#!/usr/bin/env python3
"""
Random NIH sample eval for MediScan multi-label inference.

Ground truth: Data_Entry_2017.csv Finding Labels
Predictions: TorchXRayVision positives at PATHOLOGY_THRESHOLD
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from collections import Counter
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings
from app.ml.pathologies import NIH14_PATHOLOGIES, NO_FINDING_LABEL
from app.services.inference_service import _run_inference


def build_image_index(archive: Path) -> dict[str, Path]:
    return {p.name: p for p in archive.rglob("*.png") if p.is_file()}


def parse_gt(raw: str) -> set[str]:
    parts = [p.strip() for p in raw.split("|") if p.strip()]
    if parts == ["No Finding"]:
        return set()
    return {p for p in parts if p in NIH14_PATHOLOGIES}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, default=Path("/Users/bitnagu/Downloads/archive"))
    parser.add_argument("--n", type=int, default=100)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threshold", type=float, default=None)
    args = parser.parse_args()

    if args.threshold is not None:
        settings.pathology_threshold = args.threshold

    csv_path = args.archive / "Data_Entry_2017.csv"
    print(
        f"classification_mode={settings.classification_mode} "
        f"fallback_threshold={settings.pathology_threshold} "
        f"model={settings.inference_model_name}",
        flush=True,
    )
    from app.ml.thresholds import load_thresholds

    thr_table = load_thresholds(fallback=settings.pathology_threshold)
    print("per-label thresholds:", {k: thr_table[k] for k in list(thr_table)[:4]}, "...", flush=True)
    print("Indexing images...", flush=True)
    index = build_image_index(args.archive)
    with csv_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    usable = [r for r in rows if r["Image Index"].strip() in index]
    random.seed(args.seed)
    sample = random.sample(usable, min(args.n, len(usable)))
    print(f"Evaluating {len(sample)} / {len(usable)} indexed rows\n", flush=True)

    exact = 0
    primary_ok = 0
    overlap_ok = 0
    no_finding_total = 0
    no_finding_ok = 0
    disease_total = 0
    disease_exact = 0

    tp = Counter()
    fp = Counter()
    fn = Counter()
    examples: list[str] = []

    for i, row in enumerate(sample, start=1):
        filename = row["Image Index"].strip()
        path = index[filename]
        gt = parse_gt(row["Finding Labels"])
        pred = _run_inference(path)
        pred_pos = {f.name for f in pred.findings if f.positive}

        if gt == pred_pos:
            exact += 1

        # Primary summary: No Finding when GT empty; else top label must be in GT
        if not gt:
            no_finding_total += 1
            if not pred_pos and pred.label == NO_FINDING_LABEL:
                no_finding_ok += 1
                primary_ok += 1
                overlap_ok += 1
        else:
            disease_total += 1
            if gt == pred_pos:
                disease_exact += 1
            if pred.label in gt:
                primary_ok += 1
            if pred_pos & gt:
                overlap_ok += 1

        for name in NIH14_PATHOLOGIES:
            in_gt = name in gt
            in_pred = name in pred_pos
            if in_gt and in_pred:
                tp[name] += 1
            elif in_pred and not in_gt:
                fp[name] += 1
            elif in_gt and not in_pred:
                fn[name] += 1

        if len(examples) < 10:
            examples.append(
                f"  {filename}\n"
                f"    GT:   {sorted(gt) or [NO_FINDING_LABEL]}\n"
                f"    Pred: {pred.label} ({pred.confidence:.0%}) "
                f"positives={sorted(pred_pos) or ['(none)']}"
            )

        if i % 10 == 0 or i == len(sample):
            print(f"  [{i}/{len(sample)}] exact_match={exact / i:.1%} primary={primary_ok / i:.1%}", flush=True)

    n = len(sample)
    print("\n========== RESULTS ==========")
    print(f"Samples:              {n}")
    print(f"Exact set match:      {exact}/{n} = {exact / n:.1%}")
    print(f"Primary label hit:    {primary_ok}/{n} = {primary_ok / n:.1%}")
    print(f"Any-label overlap:    {overlap_ok}/{n} = {overlap_ok / n:.1%}")
    if no_finding_total:
        print(
            f"Normal accuracy:  {no_finding_ok}/{no_finding_total} = "
            f"{no_finding_ok / no_finding_total:.1%}"
        )
    if disease_total:
        print(
            f"Disease exact match:  {disease_exact}/{disease_total} = "
            f"{disease_exact / disease_total:.1%}"
        )

    print("\nPer-label precision / recall (labels with GT or preds):")
    for name in NIH14_PATHOLOGIES:
        tpi, fpi, fni = tp[name], fp[name], fn[name]
        if tpi + fpi + fni == 0:
            continue
        prec = tpi / (tpi + fpi) if (tpi + fpi) else 0.0
        rec = tpi / (tpi + fni) if (tpi + fni) else 0.0
        print(f"  {name:20s}  P={prec:.1%}  R={rec:.1%}  (tp={tpi} fp={fpi} fn={fni})")

    print("\nExamples:")
    print("\n".join(examples))


if __name__ == "__main__":
    main()
