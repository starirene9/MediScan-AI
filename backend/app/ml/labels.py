"""MediScan 4-class label mapping for NIH ChestX-ray14 CSV rows."""

from __future__ import annotations

MEDISCAN_LABELS: tuple[str, ...] = ("Normal", "Nodule", "Pneumonia", "Other")
LABEL_TO_IDX: dict[str, int] = {label: i for i, label in enumerate(MEDISCAN_LABELS)}
IDX_TO_LABEL: dict[int, str] = {i: label for label, i in LABEL_TO_IDX.items()}

# Align with inference grouping: rare "Pneumonia" alone is too sparse for 80% target.
PNEUMONIA_TERMS = {"Pneumonia", "Infiltration", "Consolidation"}
NODULE_TERMS = {"Nodule", "Mass"}
NO_FINDING_TERMS = {"No Finding"}
# Unambiguous single-finding "Other" diseases (exclude multi-label noise).
OTHER_TERMS = {
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural_Thickening",
    "Hernia",
    "Pneumothorax",
}


def parse_nih_labels(raw: str) -> list[str]:
    if not raw or not raw.strip():
        return []
    return [part.strip() for part in raw.split("|") if part.strip()]


def to_mediscan_label(nih_labels: list[str]) -> str:
    """Priority mapping (allows multi-label NIH rows)."""
    label_set = set(nih_labels)
    if label_set & PNEUMONIA_TERMS:
        return "Pneumonia"
    if label_set & NODULE_TERMS:
        return "Nodule"
    if len(nih_labels) == 1 and nih_labels[0] in NO_FINDING_TERMS:
        return "Normal"
    return "Other"


def to_mediscan_label_clean(nih_labels: list[str]) -> str | None:
    """
    Single-finding only mapping for higher-accuracy fine-tuning.

    Returns None when the row is multi-label or not mappable cleanly.
    """
    if len(nih_labels) != 1:
        return None
    label = nih_labels[0]
    if label in NO_FINDING_TERMS:
        return "Normal"
    if label in PNEUMONIA_TERMS:
        return "Pneumonia"
    if label in NODULE_TERMS:
        return "Nodule"
    if label in OTHER_TERMS:
        return "Other"
    return None
