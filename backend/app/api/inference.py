from fastapi import APIRouter

from app.config import settings
from app.ml.pathologies import GROUP_MAP, NIH14_PATHOLOGIES
from app.ml.thresholds import load_thresholds
from app.models.schemas import InferenceSettingsResponse

router = APIRouter(prefix="/api/inference", tags=["inference"])


@router.get("/settings", response_model=InferenceSettingsResponse)
def get_inference_settings() -> InferenceSettingsResponse:
    """Current classification mode — change via .env / Settings / GROUP_MAP."""
    return InferenceSettingsResponse(
        classificationMode=settings.classification_mode,
        pathologyThreshold=settings.pathology_threshold,
        pathologyThresholds=load_thresholds(fallback=settings.pathology_threshold),
        pathologies=list(NIH14_PATHOLOGIES),
        groupMap=dict(GROUP_MAP),
    )
