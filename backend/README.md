# MediScan AI API

FastAPI backend for MediScan AI. Phase 1: study CRUD. Phase 2: X-ray upload + mock analysis (no CNN yet).

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

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/studies` | List studies |
| GET | `/api/studies/{id}` | Get one study |
| POST | `/api/studies` | Create a study (JSON) |
| PATCH | `/api/studies/{id}` | Update notes / status |
| POST | `/api/studies/analyze` | Upload X-ray + mock prediction |

### Analyze form fields

- `file` (required): JPEG / PNG / WebP / GIF
- `patientName` (optional)
- `notes` (optional)
- `saveToWorklist` (optional, default `false`): also insert a study row

The frontend is not wired to these APIs yet.
