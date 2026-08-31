# MediScan AI API

FastAPI backend for MediScan AI: study CRUD, X-ray upload with NIH-14 inference, Grad-CAM generation, and dashboard analytics backed by SQLite.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/api/health
- Swagger: http://localhost:8000/docs
- Uploaded files: http://localhost:8000/uploads/{filename}

The React frontend (see root `README.md`) proxies `/api` and `/uploads` to this server during local development.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/studies` | List studies |
| GET | `/api/studies/{id}` | Get one study |
| POST | `/api/studies` | Create a study (JSON) |
| PATCH | `/api/studies/{id}` | Update notes / status / patient fields |
| DELETE | `/api/studies/{id}` | Delete a study |
| POST | `/api/studies/analyze` | Upload X-ray + NIH-14 inference + Grad-CAM |
| GET | `/api/dashboard/stats` | KPI + finding distribution |
| GET | `/api/dashboard/trends` | Daily study / abnormal counts (`?days=30`) |

### Analyze form fields

- `file` (required): JPEG / PNG / WebP / GIF
- `patientName` (optional)
- `notes` (optional)
- `saveToWorklist` (optional, default `false`): also insert a study row

## ML configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `CLASSIFICATION_MODE` | `nih14` (recommended) or `grouped` |
| `PATHOLOGY_THRESHOLD` | Score cutoff for positive findings (0–1) |
| `INFERENCE_MODEL_NAME` | TorchXRayVision weights (default `densenet121-res224-all`) |

## Scripts

Training and evaluation utilities live in `backend/scripts/`:

- `train_mediscan_classifier.py`
- `eval_nih_multilabel.py`
- `tune_pathology_thresholds.py`
