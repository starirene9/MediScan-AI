"""Chest X-ray inference: NIH multi-label scores + configurable summary label."""

from __future__ import annotations

import asyncio
from pathlib import Path
from threading import Lock

import numpy as np
import torch
import torchxrayvision as xrv
import torchvision.transforms as T
from PIL import Image

from app.config import settings
from app.ml.pathologies import (
    GROUP_MAP,
    MODEL_TO_NIH,
    NIH14_PATHOLOGIES,
    NO_FINDING_LABEL,
    NORMAL_SUMMARY_LABEL,
)
from app.ml.thresholds import load_thresholds
from app.models.schemas import FindingLabel, PathologyFinding, Prediction

_model = None
_model_lock = Lock()


def get_model():
    global _model
    if _model is not None:
        return _model

    with _model_lock:
        if _model is None:
            model = xrv.models.DenseNet(weights=settings.inference_model_name)
            model.eval()
            _model = model

    return _model


def preprocess(image_path: str | Path) -> torch.Tensor:
    path = Path(image_path)
    if not path.is_file():
        raise FileNotFoundError(f"X-ray not found: {path}")

    img = np.array(Image.open(path).convert("L"), dtype=np.float32)
    img = xrv.datasets.normalize(img, maxval=255)
    img = img[None, :, :]

    transform = T.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])
    img = transform(img)
    return torch.from_numpy(img).unsqueeze(0).float()


def _pathology_scores(model: torch.nn.Module, tensor: torch.Tensor) -> dict[str, float]:
    with torch.no_grad():
        outputs = model(tensor)[0]
    raw = {
        name: float(outputs[i])
        for i, name in enumerate(xrv.datasets.default_pathologies)
    }
    # Normalize model names → NIH14 keys where possible.
    nih_scores: dict[str, float] = {name: 0.0 for name in NIH14_PATHOLOGIES}
    for name, score in raw.items():
        mapped = MODEL_TO_NIH.get(name, name)
        if mapped in nih_scores:
            nih_scores[mapped] = max(nih_scores[mapped], score)
    return nih_scores


def _build_findings(
    scores: dict[str, float],
    thresholds: dict[str, float],
    fallback: float,
) -> list[PathologyFinding]:
    findings = [
        PathologyFinding(
            name=name,
            score=round(scores.get(name, 0.0), 4),
            positive=scores.get(name, 0.0) >= thresholds.get(name, fallback),
        )
        for name in NIH14_PATHOLOGIES
    ]
    findings.sort(key=lambda f: f.score, reverse=True)
    return findings


def _summary_from_nih(findings: list[PathologyFinding], threshold: float) -> tuple[str, float]:
    positives = [f for f in findings if f.positive]
    if not positives:
        # Confidence that image is Normal ≈ 1 - strongest disease score.
        top = findings[0].score if findings else 0.0
        return NO_FINDING_LABEL, round(max(0.0, min(1.0, 1.0 - top)), 4)
    top = positives[0]
    return top.name, top.score


def _summary_grouped(findings: list[PathologyFinding], threshold: float) -> tuple[str, float]:
    group_scores: dict[str, float] = {}
    for finding in findings:
        group = GROUP_MAP.get(finding.name)
        if group is None:
            continue
        group_scores[group] = max(group_scores.get(group, 0.0), finding.score)

    if not group_scores:
        return NORMAL_SUMMARY_LABEL, 1.0

    best_label, best_score = max(group_scores.items(), key=lambda item: item[1])
    if best_score < threshold:
        return NORMAL_SUMMARY_LABEL, round(1.0 - best_score, 4)
    return best_label, round(best_score, 4)


def scores_to_prediction(scores: dict[str, float]) -> Prediction:
    fallback = settings.pathology_threshold
    thresholds = load_thresholds(fallback=fallback)
    mode = settings.classification_mode
    findings = _build_findings(scores, thresholds, fallback)

    if mode == "grouped":
        label, confidence = _summary_grouped(findings, fallback)
    else:
        label, confidence = _summary_from_nih(findings, fallback)

    return Prediction(
        label=label,  # type: ignore[arg-type]
        confidence=confidence,
        findings=findings,
        classificationMode=mode,
    )


def _run_inference(image_path: str | Path) -> Prediction:
    model = get_model()
    tensor = preprocess(image_path)
    scores = _pathology_scores(model, tensor)
    return scores_to_prediction(scores)


async def predict(image_path: str | Path) -> Prediction:
    return await asyncio.to_thread(_run_inference, image_path)


def is_normal_label(label: str) -> bool:
    return label in {NO_FINDING_LABEL, NORMAL_SUMMARY_LABEL, "Normal", "No Finding"}


def mock_gradcam_url(image_url: str, label: FindingLabel | str) -> str | None:
    if is_normal_label(str(label)):
        return None
    return image_url
