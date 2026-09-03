from fastapi import APIRouter

from app.config import settings
from app.models.schemas import HealthResponse
from app.services import inference_service

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        modelReady=inference_service.is_model_ready(),
    )
