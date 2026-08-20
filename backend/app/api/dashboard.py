from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import DashboardStatsResponse, StudyTrendPoint
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats(db: Session = Depends(get_db)) -> DashboardStatsResponse:
    return dashboard_service.get_stats(db)


@router.get("/trends", response_model=list[StudyTrendPoint])
def dashboard_trends(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
) -> list[StudyTrendPoint]:
    return dashboard_service.get_trends(db, days=days)
