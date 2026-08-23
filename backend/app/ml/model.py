"""Fine-tuned 4-class DenseNet for MediScan."""

from __future__ import annotations

from pathlib import Path

import torch
import torch.nn as nn
import torchxrayvision as xrv

from app.ml.labels import MEDISCAN_LABELS


def build_classifier(pretrained_weights: str = "densenet121-res224-nih") -> nn.Module:
    """DenseNet121 backbone (TorchXRayVision) + 4-class head."""
    backbone = xrv.models.DenseNet(weights=pretrained_weights)
    in_features = backbone.classifier.in_features
    backbone.classifier = nn.Linear(in_features, len(MEDISCAN_LABELS))
    # Train/infer with plain logits + softmax (no multi-label op_norm).
    backbone.op_threshs = None
    backbone.apply_sigmoid = False
    return backbone


def save_checkpoint(model: nn.Module, path: Path, *, pretrained_weights: str = "densenet121-res224-nih") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "state_dict": model.state_dict(),
            "num_classes": len(MEDISCAN_LABELS),
            "labels": list(MEDISCAN_LABELS),
            "pretrained_weights": pretrained_weights,
        },
        path,
    )


def load_classifier(path: Path, pretrained_weights: str | None = None) -> nn.Module:
    checkpoint = torch.load(path, map_location="cpu", weights_only=False)
    weights_name = pretrained_weights or checkpoint.get("pretrained_weights", "densenet121-res224-nih")
    model = build_classifier(pretrained_weights=weights_name)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    return model
