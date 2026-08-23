from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class StudyEntity(Base):
    __tablename__ = "studies"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(32))
    patient_name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(32))
    modality: Mapped[str] = mapped_column(String(64))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(32))
    prediction_label: Mapped[str] = mapped_column(String(64))
    prediction_confidence: Mapped[float] = mapped_column(Float)
    # JSON list of {name, score, positive} for NIH multi-label results
    prediction_findings: Mapped[str] = mapped_column(Text, default="[]")
    prediction_mode: Mapped[str] = mapped_column(String(32), default="nih14")
    image_url: Mapped[str] = mapped_column(String(255))
    grad_cam_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
