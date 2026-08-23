"""
NIH ChestX-ray14 pathology names + optional summary grouping.

Change classification without code edits:
  - CLASSIFICATION_MODE=nih14|grouped  (env / Settings)
  - PATHOLOGY_THRESHOLD=0.5
  - edit GROUP_MAP below (or keep grouped mode off)
"""

from __future__ import annotations

# Official NIH ChestX-ray14 labels (14 disease findings; absence → app label "Normal").
NIH14_PATHOLOGIES: tuple[str, ...] = (
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

# TorchXRayVision may use slightly different spellings; map model name → NIH display name.
MODEL_TO_NIH: dict[str, str] = {
    "Pleural_Thickening": "Pleural_Thickening",
    "Pleural Thickening": "Pleural_Thickening",
}

# Optional roll-up map (classification_mode=grouped). Default: identity (no "Other").
# Edit values if you want custom summary buckets later.
GROUP_MAP: dict[str, str] = {name: name for name in NIH14_PATHOLOGIES}

# App-facing label when no NIH disease scores are positive.
# (NIH CSV still uses the string "No Finding" as ground truth.)
NO_FINDING_LABEL = "Normal"
NORMAL_SUMMARY_LABEL = "Normal"
