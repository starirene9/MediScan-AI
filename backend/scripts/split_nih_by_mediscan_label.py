#!/usr/bin/env python3
"""
Split NIH ChestX-ray14 into per-finding test folders for manual UI testing.

Default: 11 folders (Normal + 10 common single-label findings).
Only single-finding CSV rows are used so each image has a clear expected label.

Example:
  python scripts/split_nih_by_mediscan_label.py \\
    --csv /Users/bitnagu/Downloads/archive/Data_Entry_2017.csv \\
    --images-dir /Users/bitnagu/Downloads/archive \\
    --output-dir /Users/bitnagu/Downloads/archive/mediscan-test \\
    --limit 40
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import shutil
from collections import Counter, defaultdict
from pathlib import Path

# 11-class manual test set (app-facing names).
# NIH CSV "No Finding" → Normal.
TEST_LABELS: tuple[str, ...] = (
    "Normal",
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Emphysema",
)

# Optional: full NIH-14 + Normal (15 folders)
NIH14_PLUS_NORMAL: tuple[str, ...] = (
    "Normal",
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural_Thickening",
    "Hernia",
)

NO_FINDING = "No Finding"


def parse_nih_labels(raw: str) -> list[str]:
    if not raw or not raw.strip():
        return []
    return [part.strip() for part in raw.split("|") if part.strip()]


def to_folder_label(nih_labels: list[str], allowed: set[str]) -> str | None:
    """Single-finding only → folder name; skip multi-label / unlisted."""
    if len(nih_labels) != 1:
        return None
    label = nih_labels[0]
    if label == NO_FINDING:
        return "Normal" if "Normal" in allowed else None
    if label in allowed:
        return label
    return None


def build_image_index(images_dir: Path) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for path in images_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
            index[path.name] = path
    return index


def clear_output_dir(output_dir: Path) -> None:
    if not output_dir.exists():
        return
    for child in output_dir.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        elif child.name in {"manifest.csv", "summary.json", "README.md"}:
            child.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split NIH images into Normal + pathology test folders."
    )
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=40, help="Max images per folder")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--copy", action="store_true")
    parser.add_argument(
        "--full-nih14",
        action="store_true",
        help="Use Normal + all 14 NIH findings (15 folders) instead of 11",
    )
    args = parser.parse_args()

    labels = NIH14_PLUS_NORMAL if args.full_nih14 else TEST_LABELS
    allowed = set(labels)

    if not args.csv.is_file():
        raise SystemExit(f"CSV not found: {args.csv}")
    if not args.images_dir.is_dir():
        raise SystemExit(f"Images directory not found: {args.images_dir}")

    print("Indexing images...", flush=True)
    image_index = build_image_index(args.images_dir)
    print(f"  {len(image_index)} files", flush=True)

    buckets: dict[str, list[tuple[str, Path, str]]] = defaultdict(list)
    with args.csv.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            filename = row["Image Index"].strip()
            nih_labels = parse_nih_labels(row["Finding Labels"])
            folder = to_folder_label(nih_labels, allowed)
            if folder is None:
                continue
            source = image_index.get(filename)
            if source is None:
                continue
            buckets[folder].append((filename, source, "|".join(nih_labels)))

    random.seed(args.seed)
    clear_output_dir(args.output_dir)
    for label in labels:
        (args.output_dir / label).mkdir(parents=True, exist_ok=True)

    class_counts: Counter[str] = Counter()
    manifest_rows: list[dict[str, str]] = []

    for label in labels:
        items = buckets.get(label, [])
        if args.limit and len(items) > args.limit:
            items = random.sample(items, args.limit)
        for filename, source, nih_raw in items:
            dest = args.output_dir / label / filename
            if dest.exists() or dest.is_symlink():
                dest.unlink()
            if args.copy:
                shutil.copy2(source, dest)
            else:
                dest.symlink_to(source.resolve())
            class_counts[label] += 1
            manifest_rows.append(
                {
                    "image": filename,
                    "folder": label,
                    "nih_labels": nih_raw,
                }
            )

    manifest_path = args.output_dir / "manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["image", "folder", "nih_labels"])
        writer.writeheader()
        writer.writerows(manifest_rows)

    ko_names = {
        "Normal": "정상",
        "Atelectasis": "무기폐",
        "Cardiomegaly": "심비대",
        "Effusion": "흉수",
        "Infiltration": "침윤",
        "Mass": "종괴",
        "Nodule": "결절",
        "Pneumonia": "폐렴",
        "Pneumothorax": "기흉",
        "Consolidation": "경화",
        "Emphysema": "폐기종",
        "Edema": "부종",
        "Fibrosis": "섬유화",
        "Pleural_Thickening": "흉막비후",
        "Hernia": "탈장",
    }
    readme = args.output_dir / "README.md"
    lines = [
        "# MediScan manual test set",
        "",
        "Each folder = expected primary finding (single-label NIH rows only).",
        "",
        "| Folder | 한국어 | count |",
        "|--------|--------|------|",
    ]
    for label in labels:
        lines.append(f"| {label} | {ko_names.get(label, label)} | {class_counts[label]} |")
    lines.append("")
    lines.append("Upload an image from a folder and check whether AI primary label matches the folder name.")
    readme.write_text("\n".join(lines) + "\n", encoding="utf-8")

    summary = {
        "total_placed": sum(class_counts.values()),
        "by_class": {label: class_counts[label] for label in labels},
        "available_before_limit": {label: len(buckets.get(label, [])) for label in labels},
        "limit_per_class": args.limit,
        "mode": "copy" if args.copy else "symlink",
        "folders": list(labels),
    }
    summary_path = args.output_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print("\nDone.")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"\nOutput: {args.output_dir}")
    print(f"README: {readme}")


if __name__ == "__main__":
    main()
