#!/usr/bin/env python3
"""Evaluate fine-tuned checkpoint on mediscan-test folder (symlinked NIH samples)."""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import torch
import torch.nn.functional as F

from app.ml.labels import LABEL_TO_IDX, MEDISCAN_LABELS
from app.ml.model import load_classifier
from app.services.inference_service import preprocess, _device


DEFAULT_CHECKPOINT = BACKEND_ROOT / "models" / "mediscan4_densenet.pt"


def collect_items(root: Path) -> list[tuple[Path, int]]:
    items: list[tuple[Path, int]] = []
    for label in MEDISCAN_LABELS:
        folder = root / label
        if not folder.is_dir():
            continue
        for path in sorted(folder.iterdir()):
            if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
                items.append((path, LABEL_TO_IDX[label]))
    return items


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test-dir", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    args = parser.parse_args()

    if not args.checkpoint.is_file():
        print(f"Checkpoint not found: {args.checkpoint}")
        sys.exit(1)

    device = _device()
    model = load_classifier(args.checkpoint).to(device)
    items = collect_items(args.test_dir)
    print(f"Evaluating {len(items)} images from {args.test_dir}")

    correct = 0
    per_class = Counter()
    per_correct = Counter()

    with torch.no_grad():
        for path, label_idx in items:
            tensor = preprocess(path).to(device)
            logits = model(tensor)
            pred_idx = int(F.softmax(logits, dim=1)[0].argmax().item())
            per_class[label_idx] += 1
            if pred_idx == label_idx:
                correct += 1
                per_correct[label_idx] += 1

    acc = correct / len(items) if items else 0.0
    print(f"Accuracy: {acc:.1%} ({correct}/{len(items)})")
    for i, label in enumerate(MEDISCAN_LABELS):
        total = per_class[i]
        hit = per_correct[i]
        pct = hit / total if total else 0.0
        print(f"  {label}: {pct:.1%} ({hit}/{total})")


if __name__ == "__main__":
    main()
