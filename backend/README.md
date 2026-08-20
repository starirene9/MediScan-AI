# MediScan AI API (Phase 1)

FastAPI skeleton with SQLite study CRUD. No CNN / file upload yet.

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

## Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/studies` | List studies (6 seed rows on first start) |
| GET | `/api/studies/{id}` | Get one study |
| POST | `/api/studies` | Create a study |
| PATCH | `/api/studies/{id}` | Update notes / status |
