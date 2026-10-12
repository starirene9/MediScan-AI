#!/usr/bin/env python3
"""
Per-pathology AUROC + operating-point metrics on the official NIH ChestX-ray14 test split.

Uses the same preprocessing and score mapping as the /analyze endpoint, so the
numbers describe the model exactly as deployed.

Example:
  python scripts/eval_nih_auroc.py --archive ~/Downloads/archive --out ../docs/eval/nih_test_auroc.json
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import torch

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings
from app.ml.pathologies import NIH14_PATHOLOGIES
from app.ml.thresholds import load_thresholds
from app.services.inference_service import _pathology_scores, get_model, preprocess


def auroc(labels: np.ndarray, scores: np.ndarray) -> float | None:
    """Mann-Whitney U formulation with average ranks for ties."""
    n_pos = int(labels.sum())
    n_neg = len(labels) - n_pos
    if n_pos == 0 or n_neg == 0:
        return None
    order = scores.argsort()
    ranks = np.empty(len(scores), dtype=np.float64)
    sorted_scores = scores[order]
    i = 0
    while i < len(sorted_scores):
        j = i
        while j + 1 < len(sorted_scores) and sorted_scores[j + 1] == sorted_scores[i]:
            j += 1
        ranks[order[i : j + 1]] = (i + j) / 2.0 + 1.0
        i = j + 1
    rank_sum = ranks[labels == 1].sum()
    return float((rank_sum - n_pos * (n_pos + 1) / 2.0) / (n_pos * n_neg))


def build_image_index(archive: Path) -> dict[str, Path]:
    return {p.name: p for p in archive.glob("images_*/images/*.png")}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, default=Path.home() / "Downloads" / "archive")
    parser.add_argument("--n", type=int, default=0, help="Sample size (0 = full test split)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    test_names = [
        line.strip()
        for line in (args.archive / "test_list.txt").read_text().splitlines()
        if line.strip()
    ]
    with (args.archive / "Data_Entry_2017.csv").open(newline="", encoding="utf-8") as handle:
        gt_by_name = {row["Image Index"].strip(): row["Finding Labels"] for row in csv.DictReader(handle)}

    index = build_image_index(args.archive)
    names = [n for n in test_names if n in index and n in gt_by_name]
    if args.n:
        random.seed(args.seed)
        names = random.sample(names, min(args.n, len(names)))
    print(f"model={settings.inference_model_name} images={len(names)}", flush=True)

    model = get_model()
    thresholds = load_thresholds(fallback=settings.pathology_threshold)

    y_true = np.zeros((len(names), len(NIH14_PATHOLOGIES)), dtype=np.int8)
    y_score = np.zeros((len(names), len(NIH14_PATHOLOGIES)), dtype=np.float32)
    for row, name in enumerate(names):
        labels = {p.strip() for p in gt_by_name[name].split("|")}
        for col, pathology in enumerate(NIH14_PATHOLOGIES):
            y_true[row, col] = pathology in labels

    started = time.time()
    with ThreadPoolExecutor(max_workers=8) as pool:
        for start in range(0, len(names), args.batch_size):
            chunk = names[start : start + args.batch_size]
            tensors = list(pool.map(lambda n: preprocess(index[n]), chunk))
            batch = torch.cat(tensors, dim=0)
            for offset in range(len(chunk)):
                scores = _pathology_scores(model, batch[offset : offset + 1])
                for col, pathology in enumerate(NIH14_PATHOLOGIES):
                    y_score[start + offset, col] = scores[pathology]
            done = start + len(chunk)
            if done % (args.batch_size * 20) == 0 or done == len(names):
                elapsed = time.time() - started
                print(f"  [{done}/{len(names)}] {elapsed:.0f}s", flush=True)

    results = []
    for col, pathology in enumerate(NIH14_PATHOLOGIES):
        labels = y_true[:, col]
        scores = y_score[:, col]
        threshold = thresholds[pathology]
        pred = scores >= threshold
        tp = int((pred & (labels == 1)).sum())
        fn = int((~pred & (labels == 1)).sum())
        tn = int((~pred & (labels == 0)).sum())
        fp = int((pred & (labels == 0)).sum())
        results.append(
            {
                "pathology": pathology,
                "positives": int(labels.sum()),
                "auroc": auroc(labels, scores),
                "threshold": threshold,
                "sensitivity": tp / (tp + fn) if tp + fn else None,
                "specificity": tn / (tn + fp) if tn + fp else None,
            }
        )

    valid = [r["auroc"] for r in results if r["auroc"] is not None]
    summary = {
        "model": settings.inference_model_name,
        "split": "NIH ChestX-ray14 official test_list.txt",
        "images": len(names),
        "mean_auroc": float(np.mean(valid)) if valid else None,
        "results": results,
    }

    print(f"\n{'Pathology':20s} {'Pos':>6s} {'AUROC':>7s} {'Sens':>7s} {'Spec':>7s}")
    for r in results:
        fmt = lambda v: f"{v:.3f}" if v is not None else "  n/a"
        print(
            f"{r['pathology']:20s} {r['positives']:6d} {fmt(r['auroc']):>7s} "
            f"{fmt(r['sensitivity']):>7s} {fmt(r['specificity']):>7s}"
        )
    print(f"\nMean AUROC: {summary['mean_auroc']:.3f}")

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Saved {args.out}")


if __name__ == "__main__":
    main()
