from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import AnalyzeResponse, Study, StudyCreate, StudyUpdate
from app.services import inference_service, storage_service, study_service

router = APIRouter(prefix="/api/studies", tags=["studies"])


@router.get("", response_model=list[Study])
def list_studies(db: Session = Depends(get_db)) -> list[Study]:
    return study_service.list_studies(db)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_study(
    file: UploadFile = File(...),
    patientName: str = Form("Unknown Patient"),
    notes: str = Form(""),
    saveToWorklist: bool = Form(False),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    # 1) Save upload to disk; API returns URL for the frontend
    image_url = storage_service.save_upload(file)

    # 2) Resolve URL → local path and run CNN inference on the saved file
    image_path = storage_service.resolve_upload_path(image_url)
    prediction = await inference_service.predict(image_path)

    grad_cam_url = inference_service.mock_gradcam_url(image_url, prediction.label)

    study = None
    if saveToWorklist:
        status = (
            "Normal"
            if inference_service.is_normal_label(prediction.label)
            else "Abnormal"
        )
        study = study_service.create_study(
            db,
            StudyCreate(
                patientName=patientName,
                notes=notes,
                prediction=prediction,
                imageUrl=image_url,
                gradCamUrl=grad_cam_url,
                status=status,
            ),
        )

    return AnalyzeResponse(
        prediction=prediction,
        imageUrl=image_url,
        gradCamUrl=grad_cam_url,
        study=study,
    )


@router.get("/{study_id}", response_model=Study)
def get_study(study_id: str, db: Session = Depends(get_db)) -> Study:
    return study_service.get_study(db, study_id)


@router.post("", response_model=Study, status_code=201)
def create_study(payload: StudyCreate, db: Session = Depends(get_db)) -> Study:
    return study_service.create_study(db, payload)


@router.patch("/{study_id}", response_model=Study)
def update_study(
    study_id: str, payload: StudyUpdate, db: Session = Depends(get_db)
) -> Study:
    return study_service.update_study(db, study_id, payload)


@router.delete("/{study_id}", status_code=204)
def delete_study(study_id: str, db: Session = Depends(get_db)) -> None:
    study_service.delete_study(db, study_id)
