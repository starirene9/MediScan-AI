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
from app.ml.gradcam import generate_gradcam_image, resolve_target_index
from app.ml.pathologies import (
    GROUP_MAP,
    MODEL_TO_NIH,
    NIH14_PATHOLOGIES,
    NO_FINDING_LABEL,
    NORMAL_SUMMARY_LABEL,
)
from app.ml.thresholds import load_thresholds
from app.models.schemas import FindingLabel, GradCamMeta, PathologyFinding, Prediction
from app.services import storage_service

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
    if positives:
        top = positives[0]
        return top.name, top.score

    # Screening fallback: if no class beat its JSON cutoff, still surface the
    # strongest finding when it is at least `threshold` (default 0.5).
    # The previous 0.85–0.90 cuts labeled most disease images as Normal.
    if findings and findings[0].score >= threshold:
        top = findings[0]
        return top.name, top.score

    top_score = findings[0].score if findings else 0.0
    return NO_FINDING_LABEL, round(max(0.0, min(1.0, 1.0 - top_score)), 4)


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


def _gradcam_target(prediction: Prediction) -> str | None:
    """Pick the pathology class for Grad-CAM; None when Normal / unavailable."""
    if is_normal_label(prediction.label):
        return None

    try:
        resolve_target_index(prediction.label)
        return prediction.label
    except ValueError:
        pass

    for finding in prediction.findings:
        if finding.positive:
            try:
                resolve_target_index(finding.name)
                return finding.name
            except ValueError:
                continue
    return None


def _run_gradcam(
    image_path: str | Path,
    target_class: str,
    confidence: float,
) -> tuple[str, GradCamMeta]:
    model = get_model()
    tensor = preprocess(image_path)
    result = generate_gradcam_image(
        model=model,
        tensor=tensor,
        image_path=Path(image_path),
        target_class=target_class,
    )
    url = storage_service.save_gradcam_image(result.image)
    meta = GradCamMeta(
        finding=target_class,
        confidence=round(float(confidence), 4),
        centroid={"x": result.centroid_x, "y": result.centroid_y},
    )
    return url, meta


async def generate_gradcam_url(
    image_path: str | Path,
    prediction: Prediction,
) -> tuple[str | None, GradCamMeta | None]:
    """
    Build a Grad-CAM heatmap URL + focus meta for abnormal predictions.

    Returns (None, None) for Normal or when no valid target class exists.
    """
    target = _gradcam_target(prediction)
    if target is None:
        return None, None
    return await asyncio.to_thread(
        _run_gradcam, image_path, target, prediction.confidence
    )
