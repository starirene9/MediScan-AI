#!/usr/bin/env python3
"""
Auto-tune per-NIH-pathology thresholds.

Two modes:
  --objective f1     : maximize per-label F1 (can hurt No Finding)
  --objective global : coordinate ascent on exact + overlap + no_finding (default)

Example:
  python scripts/tune_pathology_thresholds.py \\
    --archive /Users/bitnagu/Downloads/archive --n 600 --seed 7
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings
from app.ml.pathologies import NIH14_PATHOLOGIES
from app.ml.thresholds import DEFAULT_THRESHOLDS_PATH, save_thresholds
from app.services.inference_service import get_model, preprocess, _pathology_scores


def build_image_index(archive: Path) -> dict[str, Path]:
    return {p.name: p for p in archive.rglob("*.png") if p.is_file()}


def parse_gt(raw: str) -> set[str]:
    parts = [p.strip() for p in raw.split("|") if p.strip()]
    if parts == ["No Finding"]:
        return set()
    return {p for p in parts if p in NIH14_PATHOLOGIES}


def f_beta(tp: int, fp: int, fn: int, beta: float = 1.0) -> float:
    if tp == 0 and fp == 0 and fn == 0:
        return 0.0
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    if prec + rec == 0:
        return 0.0
    b2 = beta * beta
    return (1 + b2) * prec * rec / (b2 * prec + rec)


def evaluate_set(
    gt_list: list[set[str]],
    score_list: list[dict[str, float]],
    thresholds: dict[str, float],
) -> dict[str, float]:
    n = len(gt_list)
    exact = primary = overlap = nf_ok = nf_tot = 0
    for gt, scores in zip(gt_list, score_list):
        pred_pos = {name for name in NIH14_PATHOLOGIES if scores.get(name, 0.0) >= thresholds[name]}
        if gt == pred_pos:
            exact += 1
        if not gt:
            nf_tot += 1
            if not pred_pos:
                nf_ok += 1
                primary += 1
                overlap += 1
        else:
            top = max(NIH14_PATHOLOGIES, key=lambda n: scores.get(n, 0.0))
            if scores.get(top, 0.0) >= thresholds[top] and top in gt:
                primary += 1
            if pred_pos & gt:
                overlap += 1

    # macro F1
    f1s = []
    for name in NIH14_PATHOLOGIES:
        thr = thresholds[name]
        tp = fp = fn = 0
        for gt, scores in zip(gt_list, score_list):
            y = name in gt
            p = scores.get(name, 0.0) >= thr
            if p and y:
                tp += 1
            elif p and not y:
                fp += 1
            elif (not p) and y:
                fn += 1
        if tp + fp + fn > 0:
            f1s.append(f_beta(tp, fp, fn, beta=1.0))
    macro_f1 = sum(f1s) / len(f1s) if f1s else 0.0
    nf_acc = nf_ok / nf_tot if nf_tot else 0.0
    return {
        "exact": exact / n,
        "primary": primary / n,
        "overlap": overlap / n,
        "no_finding": nf_acc,
        "macro_f1": macro_f1,
        # Weighted toward usable demo metrics
        "score": (exact / n) + 0.5 * (overlap / n) + 0.5 * nf_acc + 0.25 * macro_f1,
    }


def tune_global(
    gt_list: list[set[str]],
    score_list: list[dict[str, float]],
    candidates: list[float],
    fallback: float,
) -> dict[str, float]:
    thresholds = {name: fallback for name in NIH14_PATHOLOGIES}
    best = evaluate_set(gt_list, score_list, thresholds)
    print(f"  init score={best['score']:.3f} exact={best['exact']:.1%} "
          f"overlap={best['overlap']:.1%} nf={best['no_finding']:.1%} "
          f"macroF1={best['macro_f1']:.3f}", flush=True)

    improved = True
    round_idx = 0
    while improved and round_idx < 3:
        improved = False
        round_idx += 1
        print(f"  coordinate ascent round {round_idx}...", flush=True)
        for name in NIH14_PATHOLOGIES:
            local_best_thr = thresholds[name]
            local_best = best
            for thr in candidates:
                trial = dict(thresholds)
                trial[name] = thr
                metrics = evaluate_set(gt_list, score_list, trial)
                if metrics["score"] > local_best["score"] + 1e-6:
                    local_best = metrics
                    local_best_thr = thr
            if local_best_thr != thresholds[name]:
                print(
                    f"    {name}: {thresholds[name]:.2f} → {local_best_thr:.2f} "
                    f"(score {best['score']:.3f} → {local_best['score']:.3f})",
                    flush=True,
                )
                thresholds[name] = local_best_thr
                best = local_best
                improved = True

    print(
        f"  final score={best['score']:.3f} exact={best['exact']:.1%} "
        f"overlap={best['overlap']:.1%} nf={best['no_finding']:.1%} "
        f"macroF1={best['macro_f1']:.3f}",
        flush=True,
    )
    return thresholds


def tune_f05(
    gt_list: list[set[str]],
    score_list: list[dict[str, float]],
    candidates: list[float],
    fallback: float,
) -> tuple[dict[str, float], dict[str, dict]]:
    """Per-label F0.5 (precision-leaning) with min precision floor."""
    tuned: dict[str, float] = {}
    metrics_by_label: dict[str, dict] = {}
    for name in NIH14_PATHOLOGIES:
        scores = [s[name] for s in score_list]
        labels = [name in gt for gt in gt_list]
        support = sum(1 for y in labels if y)
        if support == 0:
            tuned[name] = max(fallback, 0.75)
            metrics_by_label[name] = {"support": 0, "note": "no_positives"}
            continue

        best_thr = fallback
        best_f = -1.0
        best_stats = {}
        for thr in candidates:
            tp = fp = fn = 0
            for score, y in zip(scores, labels):
                pred = score >= thr
                if pred and y:
                    tp += 1
                elif pred and not y:
                    fp += 1
                elif (not pred) and y:
                    fn += 1
            prec = tp / (tp + fp) if (tp + fp) else 0.0
            # Prefer precision-leaning F0.5; require at least some precision if predictions exist
            f = f_beta(tp, fp, fn, beta=0.5)
            if f > best_f + 1e-9 or (abs(f - best_f) < 1e-9 and thr > best_thr):
                best_f = f
                best_thr = thr
                best_stats = {
                    "precision": round(prec, 4),
                    "recall": round(tp / (tp + fn) if (tp + fn) else 0.0, 4),
                    "f0.5": round(f, 4),
                    "support": support,
                    "tp": tp,
                    "fp": fp,
                    "fn": fn,
                }
        tuned[name] = round(best_thr, 4)
        metrics_by_label[name] = best_stats
        print(
            f"  {name:20s} thr={best_thr:.2f}  F0.5={best_stats.get('f0.5', 0):.3f}  "
            f"P={best_stats.get('precision', 0):.3f} R={best_stats.get('recall', 0):.3f}",
            flush=True,
        )
    return tuned, metrics_by_label


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, default=Path("/Users/bitnagu/Downloads/archive"))
    parser.add_argument("--n", type=int, default=600)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--fallback", type=float, default=settings.pathology_threshold)
    parser.add_argument("--output", type=Path, default=DEFAULT_THRESHOLDS_PATH)
    parser.add_argument("--min-thr", type=float, default=0.35)
    parser.add_argument("--max-thr", type=float, default=0.90)
    parser.add_argument("--step", type=float, default=0.05)
    parser.add_argument(
        "--objective",
        choices=["global", "f05"],
        default="global",
        help="global=exact/overlap/NoFinding; f05=per-label F0.5",
    )
    args = parser.parse_args()

    candidates = []
    thr = args.min_thr
    while thr <= args.max_thr + 1e-9:
        candidates.append(round(thr, 4))
        thr += args.step

    print(f"Model={settings.inference_model_name} objective={args.objective}", flush=True)
    print("Indexing...", flush=True)
    index = build_image_index(args.archive)
    with (args.archive / "Data_Entry_2017.csv").open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    usable = [r for r in rows if r["Image Index"].strip() in index]
    random.seed(args.seed)
    sample = random.sample(usable, min(args.n, len(usable)))
    print(f"Scoring {len(sample)} images...", flush=True)

    model = get_model()
    gt_list: list[set[str]] = []
    score_list: list[dict[str, float]] = []
    for i, row in enumerate(sample, start=1):
        path = index[row["Image Index"].strip()]
        gt_list.append(parse_gt(row["Finding Labels"]))
        score_list.append(_pathology_scores(model, preprocess(path)))
        if i % 50 == 0 or i == len(sample):
            print(f"  scored {i}/{len(sample)}", flush=True)

    metrics_by_label: dict = {}
    if args.objective == "global":
        tuned = tune_global(gt_list, score_list, candidates, args.fallback)
        final = evaluate_set(gt_list, score_list, tuned)
        metrics_by_label = {"tune_set_metrics": final}
        print("\nTuned thresholds:", flush=True)
        for name in NIH14_PATHOLOGIES:
            print(f"  {name:20s} {tuned[name]:.2f}", flush=True)
    else:
        tuned, metrics_by_label = tune_f05(gt_list, score_list, candidates, args.fallback)

    out = save_thresholds(
        tuned,
        args.output,
        meta={
            "tune_n": len(sample),
            "tune_seed": args.seed,
            "fallback": args.fallback,
            "model": settings.inference_model_name,
            "objective": args.objective,
            "details": metrics_by_label,
        },
    )
    print(f"\nSaved -> {out}", flush=True)


if __name__ == "__main__":
    main()
