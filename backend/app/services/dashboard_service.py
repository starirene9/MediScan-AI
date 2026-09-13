from collections import defaultdict
from datetime import date, datetime, time, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ml.pathologies import NIH14_PATHOLOGIES, NO_FINDING_LABEL
from app.models.entities import StudyEntity
from app.models.schemas import (
    DashboardStats,
    DashboardStatsResponse,
    FindingDistribution,
    StudyTrendPoint,
)

_NORMAL_LABELS = {NO_FINDING_LABEL, "No Finding", "Normal"}


def _distribution_labels() -> list[str]:
    # Always report against NIH-14 (+ Normal) — no "Other" bucket.
    return [NO_FINDING_LABEL, *NIH14_PATHOLOGIES]


def _effective_label(entity: StudyEntity) -> str:
    if entity.final_label:
        return entity.final_label
    return entity.prediction_label


def _is_abnormal_label(label: str) -> bool:
    return label not in _NORMAL_LABELS


def get_stats(db: Session) -> DashboardStatsResponse:
    rows = db.query(StudyEntity).all()
    total = len(rows)
    # Unreviewed studies (AI draft only) count as pending review.
    pending = sum(1 for row in rows if not row.review_decision)
    reviewed = [row for row in rows if row.review_decision]
    overridden = sum(1 for row in reviewed if row.review_decision == "overridden")
    abnormal = sum(1 for row in rows if _is_abnormal_label(_effective_label(row)))
    avg_conf = db.query(func.avg(StudyEntity.prediction_confidence)).scalar()
    avg_confidence = round(float(avg_conf), 2) if avg_conf is not None else 0.0
    override_rate = (
        round(overridden / len(reviewed), 2) if reviewed else 0.0
    )

    label_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        label_counts[_effective_label(row)] += 1

    labels = _distribution_labels()
    distribution = [
        FindingDistribution(label=label, count=int(label_counts.get(label, 0)))
        for label in labels
        if int(label_counts.get(label, 0)) > 0 or label == NO_FINDING_LABEL
    ]
    for label, count in label_counts.items():
        if label not in {item.label for item in distribution}:
            distribution.append(FindingDistribution(label=label, count=int(count)))

    return DashboardStatsResponse(
        stats=DashboardStats(
            totalStudies=int(total),
            pendingReview=int(pending),
            abnormalCount=int(abnormal),
            avgConfidence=avg_confidence,
            overrideRate=override_rate,
            reviewedCount=len(reviewed),
            timestamp=datetime.now(),
        ),
        findingDistribution=distribution,
    )


def get_trends(db: Session, days: int = 30) -> list[StudyTrendPoint]:
    days = max(1, min(days, 90))
    today = date.today()
    start = today - timedelta(days=days - 1)

    rows = (
        db.query(
            StudyEntity.uploaded_at,
            StudyEntity.prediction_label,
            StudyEntity.final_label,
        )
        .filter(StudyEntity.uploaded_at >= datetime.combine(start, time.min))
        .all()
    )

    totals: dict[date, int] = defaultdict(int)
    abnormals: dict[date, int] = defaultdict(int)
    for uploaded_at, prediction_label, final_label in rows:
        day = uploaded_at.date()
        totals[day] += 1
        label = final_label or prediction_label
        if _is_abnormal_label(label):
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
