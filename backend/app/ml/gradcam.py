"""Grad-CAM heatmap generation for TorchXRayVision DenseNet.

Produces a transparent RGBA heatmap (not a pre-blended overlay) so the
frontend ImageViewer can stack original + Grad-CAM with its own opacity.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torchxrayvision as xrv
from PIL import Image, ImageFilter

from app.ml.pathologies import MODEL_TO_NIH


@dataclass(frozen=True)
class GradCamResult:
    image: Image.Image
    """Normalized centroid of the hot region (0–1), origin at top-left."""
    centroid_x: float
    centroid_y: float


def _last_conv2d(model: nn.Module) -> nn.Conv2d:
    last: nn.Conv2d | None = None
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            last = module
    if last is None:
        raise RuntimeError("No Conv2d layer found for Grad-CAM hooks.")
    return last


def resolve_target_index(target_class: str) -> int:
    """Map NIH / model pathology name → TorchXRayVision logit index."""
    pathologies = list(xrv.datasets.default_pathologies)
    if target_class in pathologies:
        return pathologies.index(target_class)

    for model_name, nih_name in MODEL_TO_NIH.items():
        if nih_name == target_class and model_name in pathologies:
            return pathologies.index(model_name)

    raise ValueError(f"Unknown Grad-CAM target class: {target_class!r}")


def compute_cam(
    model: nn.Module,
    tensor: torch.Tensor,
    target_class: str,
) -> np.ndarray:
    """
    Grad-CAM over the last convolution.

    Returns a float32 array shaped [h, w] with values in [0, 1].
    """
    target_idx = resolve_target_index(target_class)
    last_conv = _last_conv2d(model)

    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []

    def forward_hook(_module, _inputs, output):
        activations.append(output)

    def backward_hook(_module, _grad_input, grad_output):
        gradients.append(grad_output[0])

    handle_f = last_conv.register_forward_hook(forward_hook)
    handle_b = last_conv.register_full_backward_hook(backward_hook)

    try:
        model.zero_grad(set_to_none=True)
        logits = model(tensor)[0]
        logits[target_idx].backward()
    finally:
        handle_f.remove()
        handle_b.remove()

    if not activations or not gradients:
        raise RuntimeError("Grad-CAM hooks did not capture activations/gradients.")

    activation = activations[0][0].detach()
    gradient = gradients[0][0].detach()

    weights = gradient.mean(dim=(1, 2))
    cam = (weights[:, None, None] * activation).sum(0)
    cam = torch.relu(cam)

    cam_np = cam.cpu().numpy().astype(np.float32)
    cam_np -= cam_np.min()
    max_val = float(cam_np.max())
    if max_val > 1e-8:
        cam_np /= max_val
    return cam_np


# Soft warm Grad-CAM: yellow → orange → red, top activations only.
# Higher quantile → smaller / more localized cloud (was 0.60).
TOP_QUANTILE = 0.78
MAX_ALPHA = 230
BLUR_DIVISOR = 96
MIN_PEAK_ALPHA = 160

COLOR_YELLOW = np.array([250, 204, 21], dtype=np.float32)
COLOR_ORANGE = np.array([249, 115, 22], dtype=np.float32)
COLOR_RED = np.array([220, 38, 38], dtype=np.float32)


def _warm_rgb(strength: np.ndarray) -> np.ndarray:
    """Map strength in [0, 1] to yellow → orange → red."""
    s = np.clip(strength, 0.0, 1.0)
    rgb = np.zeros(s.shape + (3,), dtype=np.float32)

    low = s <= 0.5
    high = ~low
    t_low = np.zeros_like(s)
    t_high = np.zeros_like(s)
    t_low[low] = s[low] / 0.5
    t_high[high] = (s[high] - 0.5) / 0.5

    for c in range(3):
        rgb[..., c] = np.where(
            low,
            COLOR_YELLOW[c] * (1.0 - t_low) + COLOR_ORANGE[c] * t_low,
            COLOR_ORANGE[c] * (1.0 - t_high) + COLOR_RED[c] * t_high,
        )
    return np.clip(rgb, 0, 255).astype(np.uint8)


def _cam_centroid(cam: np.ndarray) -> tuple[float, float]:
    """
    Centroid of the hottest CAM region, normalized to [0, 1] (x right, y down).
    Uses the upper half of non-zero pixels so the badge sits on the focus core.
    """
    positive = cam > 1e-6
    if not np.any(positive):
        return 0.5, 0.5

    vals = cam[positive]
    thr = float(np.quantile(vals, 0.50))
    thr = max(thr, float(vals.max()) * 0.45)
    mask = cam >= thr
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return 0.5, 0.5
    return float(xs.mean() / cam.shape[1]), float(ys.mean() / cam.shape[0])


def cam_to_heatmap_rgba(cam: np.ndarray, size: tuple[int, int]) -> GradCamResult:
    """
    Upsample CAM → keep top activations → Gaussian blur → warm RGBA cloud.
    """
    width, height = size
    cam_img = Image.fromarray((np.clip(cam, 0, 1) * 255).astype(np.uint8), mode="L")
    cam_img = cam_img.resize((width, height), Image.Resampling.BICUBIC)
    cam_arr = np.asarray(cam_img, dtype=np.float32) / 255.0

    floor = float(np.quantile(cam_arr, TOP_QUANTILE))
    floor = max(floor, 1e-6)
    masked = np.where(cam_arr >= floor, cam_arr, 0.0).astype(np.float32)
    peak = float(masked.max())
    if peak > 1e-8:
        masked /= peak

    cx, cy = _cam_centroid(masked)

    blur_radius = max(4, width // BLUR_DIVISOR)
    soft = Image.fromarray((masked * 255).astype(np.uint8), mode="L")
    soft = soft.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    strength = np.asarray(soft, dtype=np.float32) / 255.0

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[..., :3] = _warm_rgb(strength)

    alpha = (np.clip(strength, 0.0, 1.0) * MAX_ALPHA).astype(np.uint8)
    if alpha.max() > 0 and alpha.max() < MIN_PEAK_ALPHA:
        scale = MIN_PEAK_ALPHA / float(alpha.max())
        alpha = np.clip(alpha.astype(np.float32) * scale, 0, MAX_ALPHA).astype(np.uint8)
    alpha = np.where(strength < 0.02, 0, alpha).astype(np.uint8)
    rgba[..., 3] = alpha

    return GradCamResult(
        image=Image.fromarray(rgba, mode="RGBA"),
        centroid_x=round(cx, 4),
        centroid_y=round(cy, 4),
    )


def generate_gradcam_image(
    model: nn.Module,
    tensor: torch.Tensor,
    image_path: Path,
    target_class: str,
) -> GradCamResult:
    """Compute Grad-CAM heatmap + focus centroid for the original image size."""
    cam = compute_cam(model, tensor, target_class)
    with Image.open(image_path) as original:
        width, height = original.size
    return cam_to_heatmap_rgba(cam, (width, height))
