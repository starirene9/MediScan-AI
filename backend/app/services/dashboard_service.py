from collections import defaultdict
from datetime import date, datetime, time, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.entities import StudyEntity
from app.models.schemas import (
    DashboardStats,
    DashboardStatsResponse,
    FindingDistribution,
    FindingLabel,
    StudyTrendPoint,
)

FINDING_LABELS: tuple[FindingLabel, ...] = ("Normal", "Nodule", "Pneumonia", "Other")


def get_stats(db: Session) -> DashboardStatsResponse:
    total = db.query(func.count(StudyEntity.id)).scalar() or 0
    pending = (
        db.query(func.count(StudyEntity.id))
        .filter(StudyEntity.status == "Pending")
        .scalar()
        or 0
    )
    abnormal = (
        db.query(func.count(StudyEntity.id))
        .filter(StudyEntity.status == "Abnormal")
        .scalar()
        or 0
    )
    avg_conf = db.query(func.avg(StudyEntity.prediction_confidence)).scalar()
    avg_confidence = round(float(avg_conf), 2) if avg_conf is not None else 0.0

    label_counts = dict(
        db.query(StudyEntity.prediction_label, func.count(StudyEntity.id))
        .group_by(StudyEntity.prediction_label)
        .all()
    )
    distribution = [
        FindingDistribution(label=label, count=int(label_counts.get(label, 0)))
        for label in FINDING_LABELS
    ]

    return DashboardStatsResponse(
        stats=DashboardStats(
            totalStudies=int(total),
            pendingReview=int(pending),
            abnormalCount=int(abnormal),
            avgConfidence=avg_confidence,
            timestamp=datetime.now(),
        ),
        findingDistribution=distribution,
    )


def get_trends(db: Session, days: int = 30) -> list[StudyTrendPoint]:
    days = max(1, min(days, 90))
    today = date.today()
    start = today - timedelta(days=days - 1)

    rows = (
        db.query(StudyEntity.uploaded_at, StudyEntity.status)
        .filter(StudyEntity.uploaded_at >= datetime.combine(start, time.min))
        .all()
    )

    totals: dict[date, int] = defaultdict(int)
    abnormals: dict[date, int] = defaultdict(int)
    for uploaded_at, status in rows:
        day = uploaded_at.date()
        totals[day] += 1
        if status == "Abnormal":
            abnormals[day] += 1

    trends: list[StudyTrendPoint] = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        iso = day.isoformat()
        trends.append(
            StudyTrendPoint(
                date=iso,
                formattedDate=iso[5:],
                totalStudies=totals[day],
                abnormalCount=abnormals[day],
            )
        )
    return trends
