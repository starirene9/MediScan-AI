from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

StudyStatus = Literal["Pending", "Reviewed", "Abnormal", "Normal"]
FindingLabel = Literal["Normal", "Nodule", "Pneumonia", "Other"]


class Prediction(BaseModel):
    label: FindingLabel
    confidence: float = Field(ge=0, le=1)


class Study(BaseModel):
    """Matches the frontend Study type in src/types/study.ts."""

    id: str
    patientId: str
    patientName: str
    age: int
    gender: str
    modality: str
    uploadedAt: datetime
    status: StudyStatus
    prediction: Prediction
    imageUrl: str
    gradCamUrl: str | None = None
    notes: str = ""

    model_config = {"from_attributes": True}


class StudyCreate(BaseModel):
    patientId: str | None = None
    patientName: str
    age: int = 0
    gender: str = "Unknown"
    modality: str = "Chest X-ray"
    status: StudyStatus = "Pending"
    prediction: Prediction
    imageUrl: str
    gradCamUrl: str | None = None
    notes: str = ""


class StudyUpdate(BaseModel):
    notes: str | None = None
    status: StudyStatus | None = None


class AnalyzeResponse(BaseModel):
    prediction: Prediction
    imageUrl: str
    gradCamUrl: str | None = None
    study: Study | None = None


class HealthResponse(BaseModel):
    status: str
    app: str
