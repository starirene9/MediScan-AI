#!/usr/bin/env python3
"""
Fine-tune TorchXRayVision DenseNet121 for MediScan 4-class labels on NIH ChestX-ray14.

Uses official NIH train_val_list.txt (train) and test_list.txt (eval).

Example:
  python scripts/train_mediscan_classifier.py \\
    --archive /Users/bitnagu/Downloads/archive \\
    --epochs 8 \\
    --freeze-epochs 3 \\
    --batch-size 64
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
import time
from collections import Counter
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import numpy as np
import torch
import torch.nn as nn
import torchxrayvision as xrv
import torchvision.transforms as T
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler

from app.ml.labels import (
    LABEL_TO_IDX,
    MEDISCAN_LABELS,
    parse_nih_labels,
    to_mediscan_label,
    to_mediscan_label_clean,
)
from app.ml.model import build_classifier, load_classifier, save_checkpoint

DEFAULT_CHECKPOINT = BACKEND_ROOT / "models" / "mediscan4_densenet.pt"


class NihMediScanDataset(Dataset):
    def __init__(self, rows: list[tuple[str, int]], image_index: dict[str, Path], *, train: bool):
        self.rows = rows
        self.image_index = image_index
        self.train = train
        self.base = T.Compose([
            xrv.datasets.XRayCenterCrop(),
            xrv.datasets.XRayResizer(224),
        ])

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        filename, label_idx = self.rows[idx]
        path = self.image_index[filename]
        img = np.array(Image.open(path).convert("L"), dtype=np.float32)
        img = xrv.datasets.normalize(img, maxval=255)[None, :, :]
        img = self.base(img)
        tensor = torch.from_numpy(img).float()
        if self.train and random.random() < 0.5:
            tensor = torch.flip(tensor, dims=[-1])
        return tensor, label_idx


def build_image_index(archive: Path) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for path in archive.rglob("*.png"):
        if path.is_file():
            index[path.name] = path
    return index


def load_split_rows(
    csv_path: Path, split_files: set[str], *, single_label_only: bool
) -> list[tuple[str, int]]:
    rows: list[tuple[str, int]] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            filename = row["Image Index"].strip()
            if filename not in split_files:
                continue
            nih_labels = parse_nih_labels(row["Finding Labels"])
            if single_label_only:
                label = to_mediscan_label_clean(nih_labels)
                if label is None:
                    continue
            else:
                label = to_mediscan_label(nih_labels)
            rows.append((filename, LABEL_TO_IDX[label]))
    return rows


def cap_per_class(rows: list[tuple[str, int]], max_per_class: int, seed: int) -> list[tuple[str, int]]:
    random.seed(seed)
    by_class: dict[int, list[tuple[str, int]]] = {i: [] for i in range(len(MEDISCAN_LABELS))}
    for row in rows:
        by_class[row[1]].append(row)
    capped: list[tuple[str, int]] = []
    for items in by_class.values():
        if len(items) <= max_per_class:
            capped.extend(items)
        else:
            capped.extend(random.sample(items, max_per_class))
    random.shuffle(capped)
    return capped


def make_sampler(rows: list[tuple[str, int]]) -> WeightedRandomSampler:
    counts = Counter(label for _, label in rows)
    weights = [1.0 / counts[label] for _, label in rows]
    return WeightedRandomSampler(weights, num_samples=len(rows), replacement=True)


@torch.no_grad()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> tuple[float, dict[str, float]]:
    model.eval()
    correct = 0
    total = 0
    per_class = Counter()
    per_correct = Counter()

    for batch_x, batch_y in loader:
        batch_x = batch_x.to(device)
        batch_y = batch_y.to(device)
        logits = model(batch_x)
        preds = logits.argmax(dim=1)
        correct += (preds == batch_y).sum().item()
        total += batch_y.size(0)
        for gt, pred in zip(batch_y.tolist(), preds.tolist()):
            per_class[gt] += 1
            if gt == pred:
                per_correct[gt] += 1

    acc = correct / total if total else 0.0
    per_class_acc = {
        MEDISCAN_LABELS[i]: per_correct[i] / per_class[i] if per_class[i] else 0.0
        for i in range(len(MEDISCAN_LABELS))
    }
    return acc, per_class_acc


def set_backbone_trainable(model: nn.Module, trainable: bool) -> None:
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = trainable


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune MediScan 4-class DenseNet on NIH.")
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--freeze-epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--finetune-lr", type=float, default=5e-5)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument(
        "--backbone",
        type=str,
        default="densenet121-res224-nih",
        help="TorchXRayVision weights (nih converges faster for ChestX-ray14).",
    )
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    parser.add_argument(
        "--max-per-class",
        type=int,
        default=6000,
        help="Cap training samples per class (0=all).",
    )
    parser.add_argument(
        "--max-eval",
        type=int,
        default=4000,
        help="Cap eval samples during training (0=full test set).",
    )
    parser.add_argument(
        "--single-label-only",
        action="store_true",
        default=True,
        help="Use unambiguous single-finding NIH rows only (default on).",
    )
    parser.add_argument(
        "--allow-multilabel",
        action="store_true",
        help="Disable single-label filter (noisier, usually lower accuracy).",
    )
    args = parser.parse_args()
    single_label_only = not args.allow_multilabel

    csv_path = args.archive / "Data_Entry_2017.csv"
    train_files = set((args.archive / "train_val_list.txt").read_text().splitlines())
    test_files = set((args.archive / "test_list.txt").read_text().splitlines())

    print("Indexing PNG files...", flush=True)
    image_index = build_image_index(args.archive)
    print(f"  {len(image_index)} images indexed", flush=True)

    print(f"Label mode: {'single-label-only' if single_label_only else 'priority multilabel'}", flush=True)
    train_rows = load_split_rows(csv_path, train_files, single_label_only=single_label_only)
    test_rows = load_split_rows(csv_path, test_files, single_label_only=single_label_only)
    print("Train class counts:", dict(Counter(MEDISCAN_LABELS[i] for _, i in train_rows)), flush=True)

    if args.max_per_class > 0:
        train_rows = cap_per_class(train_rows, args.max_per_class, seed=42)
        print(f"Capped train rows: {len(train_rows)} ({args.max_per_class}/class max)", flush=True)

    if args.max_eval > 0 and len(test_rows) > args.max_eval:
        test_rows = cap_per_class(test_rows, max(1, args.max_eval // len(MEDISCAN_LABELS)), seed=99)
        print(f"Capped eval rows: {len(test_rows)} (balanced)", flush=True)

    print(f"Train rows: {len(train_rows)} | Test rows: {len(test_rows)}", flush=True)

    train_ds = NihMediScanDataset(train_rows, image_index, train=True)
    test_ds = NihMediScanDataset(test_rows, image_index, train=False)
    train_loader = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        sampler=make_sampler(train_rows),
        num_workers=args.num_workers,
        pin_memory=False,
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=False,
    )

    if torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")
    print(f"Device: {device}", flush=True)

    print(f"Loading backbone {args.backbone}...", flush=True)
    model = build_classifier(pretrained_weights=args.backbone).to(device)
    set_backbone_trainable(model, trainable=False)
    print(f"Model ready. Freeze backbone for first {args.freeze_epochs} epoch(s).", flush=True)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
    )

    best_acc = 0.0
    total_batches = len(train_loader)
    for epoch in range(1, args.epochs + 1):
        if epoch == args.freeze_epochs + 1:
            set_backbone_trainable(model, trainable=True)
            optimizer = torch.optim.AdamW(model.parameters(), lr=args.finetune_lr)
            print(f"Unfroze backbone; lr={args.finetune_lr}", flush=True)

        model.train()
        running_loss = 0.0
        seen = 0
        t0 = time.time()

        for batch_idx, (batch_x, batch_y) in enumerate(train_loader, start=1):
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * batch_y.size(0)
            seen += batch_y.size(0)
            if batch_idx == 1 or batch_idx % 20 == 0 or batch_idx == total_batches:
                print(
                    f"  epoch {epoch} batch {batch_idx}/{total_batches} "
                    f"loss={running_loss / seen:.4f}",
                    flush=True,
                )

        train_loss = running_loss / max(seen, 1)
        val_acc, per_class = evaluate(model, test_loader, device)
        elapsed = time.time() - t0
        print(
            f"Epoch {epoch}/{args.epochs} "
            f"loss={train_loss:.4f} val_acc={val_acc:.1%} time={elapsed:.0f}s",
            flush=True,
        )
        print("  per-class:", " ".join(f"{k}={v:.1%}" for k, v in per_class.items()), flush=True)

        if val_acc > best_acc:
            best_acc = val_acc
            save_checkpoint(model.cpu(), args.checkpoint, pretrained_weights=args.backbone)
            model = model.to(device)
            print(f"  saved checkpoint -> {args.checkpoint} (best {best_acc:.1%})", flush=True)

    print(f"\nBest validation accuracy: {best_acc:.1%}", flush=True)

    if args.max_eval > 0:
        full_test = load_split_rows(csv_path, test_files, single_label_only=single_label_only)
        full_loader = DataLoader(
            NihMediScanDataset(full_test, image_index, train=False),
            batch_size=args.batch_size,
            shuffle=False,
            num_workers=args.num_workers,
        )
        model = load_classifier(args.checkpoint, pretrained_weights=args.backbone).to(device)
        full_acc, full_per = evaluate(model, full_loader, device)
        print(f"Full test split accuracy: {full_acc:.1%}", flush=True)
        print("  per-class:", " ".join(f"{k}={v:.1%}" for k, v in full_per.items()), flush=True)

    if best_acc < 0.80:
        print("Target 80% not reached yet — try more epochs or full train set.", flush=True)


if __name__ == "__main__":
    main()
