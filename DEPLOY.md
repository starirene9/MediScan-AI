# Demo deployment (quick taste)

Single-container deploy: FastAPI serves the API, uploaded X-rays, and the built React app on one URL.

**Not for production.** Uses SQLite, demo login credentials, and CPU inference.

## Option 1 — Local Docker (fastest try)

```bash
docker compose up --build
```

Open http://localhost:8000

- Login: `admin` / `admin123` (or `user` / `user123`)
- Health: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs

First start may take 1–2 minutes while the TorchXRayVision model loads.

## Option 2 — Railway (public demo URL)

1. Push `main` to GitHub (already done).
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `MediScan-AI`.
3. Railway detects the root `Dockerfile` automatically.
4. Optional env vars (defaults work for a demo):

   | Variable | Demo default |
   |----------|----------------|
   | `VITE_ADMIN_USERNAME` | set at **build** via Dockerfile ARG |
   | `SERVE_FRONTEND` | `true` (already in Dockerfile) |
   | `DATABASE_URL` | `sqlite:////app/backend/data/mediscan.db` |

5. Deploy → copy the public URL (e.g. `https://mediscan-ai-production.up.railway.app`).
6. Login with `admin` / `admin123`.

**Note:** Free tier may sleep; cold start + model load can take 1–3 minutes.

## Option 3 — Render

1. [render.com](https://render.com) → **New** → **Web Service** → connect GitHub repo.
2. **Environment:** Docker
3. **Dockerfile path:** `./Dockerfile`
4. **Health check path:** `/api/health`
5. Create service → use the `.onrender.com` URL.

`render.yaml` in the repo can be used for blueprint deploys.

## Build-time login credentials

Demo login is baked into the frontend at **image build** time:

```dockerfile
ARG VITE_ADMIN_USERNAME=admin
ARG VITE_ADMIN_PASSWORD=admin123
```

To change them on Railway/Render, set these as **build arguments** (not runtime env) if the platform supports it.

## What persists on demo deploy

| Data | Persists? |
|------|-----------|
| SQLite DB | Only if the platform provides a persistent disk/volume |
| Uploaded X-rays | Same — use a volume or they reset on redeploy |

For a throwaway demo, ephemeral storage is usually fine.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page | Check `SERVE_FRONTEND=true` and that the image built the `static/` folder |
| 502 on first request | Wait for model load (up to ~2 min) |
| Login fails | Rebuild image with correct `VITE_ADMIN_*` build args |
| AI analyze slow | Expected on CPU; demo tier has limited RAM |

## Local dev vs Docker

| | Local dev | Docker demo |
|--|-----------|-------------|
| Frontend | `npm run dev` (:5173) | built into image |
| Backend | `uvicorn` (:8000) | same process, :8000 |
| API proxy | Vite proxy | same origin, no proxy needed |
