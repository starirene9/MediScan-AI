from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

StudyStatus = Literal["Pending", "Reviewed", "Abnormal", "Normal"]

# Summary label is free-form: NIH pathology name or "Normal".
FindingLabel = str


class PathologyFinding(BaseModel):
    """One NIH ChestX-ray14 pathology score."""

    name: str
    score: float = Field(ge=0, le=1)
    positive: bool = False


class Prediction(BaseModel):
    label: FindingLabel
    confidence: float = Field(ge=0, le=1)
    findings: list[PathologyFinding] = Field(default_factory=list)
    classificationMode: str = "nih14"


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
    patientName: str | None = None
    age: int | None = None
    gender: str | None = None
    modality: str | None = None


class GradCamMeta(BaseModel):
    """Where the model focused for the summary finding (overlay badge)."""

    finding: str
    confidence: float = Field(ge=0, le=1)
    centroid: dict[str, float]  # {"x": 0–1, "y": 0–1}, top-left origin


class AnalyzeResponse(BaseModel):
    prediction: Prediction
    imageUrl: str
    gradCamUrl: str | None = None
    gradCamMeta: GradCamMeta | None = None
    study: Study | None = None


class DashboardStats(BaseModel):
    totalStudies: int
    pendingReview: int
    abnormalCount: int
    avgConfidence: float
    timestamp: datetime


class FindingDistribution(BaseModel):
    label: FindingLabel
    count: int


class DashboardStatsResponse(BaseModel):
    """Matches frontend fetchDashboardStats payload."""

    stats: DashboardStats
    findingDistribution: list[FindingDistribution]


class StudyTrendPoint(BaseModel):
    date: str
    formattedDate: str
    totalStudies: int
    abnormalCount: int


class HealthResponse(BaseModel):
    status: str
    app: str
    modelReady: bool = False


class InferenceSettingsResponse(BaseModel):
    classificationMode: str
    pathologyThreshold: float
    pathologyThresholds: dict[str, float]
    pathologies: list[str]
    groupMap: dict[str, str]
