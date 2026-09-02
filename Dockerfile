# Frontend build
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

ARG VITE_ADMIN_USERNAME=admin
ARG VITE_ADMIN_PASSWORD=admin123
ARG VITE_USER_USERNAME=user
ARG VITE_USER_PASSWORD=user123
ENV VITE_ADMIN_USERNAME=$VITE_ADMIN_USERNAME \
    VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD \
    VITE_USER_USERNAME=$VITE_USER_USERNAME \
    VITE_USER_PASSWORD=$VITE_USER_PASSWORD

RUN npm run build

# API + static SPA
FROM python:3.12-slim AS runtime
WORKDIR /app/backend

RUN apt-get update \
  && apt-get install -y --no-install-recommends libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-docker.txt ./requirements-docker.txt
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
  && pip install --no-cache-dir -r requirements-docker.txt

COPY backend/ ./
COPY --from=frontend-build /app/dist ./static

RUN mkdir -p uploads data \
  && chmod +x docker-entrypoint.sh

ENV SERVE_FRONTEND=true \
    STATIC_DIR=/app/backend/static \
    DATABASE_URL=sqlite:////app/backend/data/mediscan.db \
    UPLOAD_DIR=/app/backend/uploads \
    CORS_ORIGINS=*

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"

ENTRYPOINT ["./docker-entrypoint.sh"]
