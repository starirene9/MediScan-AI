from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "MediScan AI API"
    database_url: str = "sqlite:///./mediscan.db"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = str(BACKEND_ROOT / "uploads")
    serve_frontend: bool = False
    static_dir: str = str(BACKEND_ROOT / "static")
    warmup_model_on_startup: bool = False

    # TorchXRayVision multi-label (NIH-aligned)
    inference_model_name: str = "densenet121-res224-all"

    # Positive finding cutoff for each NIH pathology score (0–1).
    # Keep this aligned with screening (not the old 0.85–0.90 global-tune cuts).
    pathology_threshold: float = 0.5

    # How to build the single summary `prediction.label`:
    #   nih14   → top positive NIH label, or "Normal"
    #   grouped → roll up via app.ml.pathologies.GROUP_MAP
    classification_mode: str = "nih14"

    # Clinical assistant (Groq OpenAI-compatible chat API)
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    # Comma-separated models tried in order when the primary hits a rate limit (429).
    # Free tier output-token-per-minute caps are per model, so a fallback keeps chat usable.
    groq_fallback_models: str = "openai/gpt-oss-120b"
    groq_max_tokens: int = 600
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout_seconds: float = 45.0

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def groq_model_chain(self) -> list[str]:
        fallbacks = [m.strip() for m in self.groq_fallback_models.split(",") if m.strip()]
        chain = [self.groq_model.strip(), *fallbacks]
        return list(dict.fromkeys(m for m in chain if m))

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
