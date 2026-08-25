from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "MediScan AI API"
    database_url: str = "sqlite:///./mediscan.db"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = str(BACKEND_ROOT / "uploads")

    # TorchXRayVision multi-label (NIH-aligned)
    inference_model_name: str = "densenet121-res224-all"

    # Positive finding cutoff for each NIH pathology score (0–1).
    # Keep this aligned with screening (not the old 0.85–0.90 global-tune cuts).
    pathology_threshold: float = 0.5

    # How to build the single summary `prediction.label`:
    #   nih14   → top positive NIH label, or "Normal"
    #   grouped → roll up via app.ml.pathologies.GROUP_MAP
    classification_mode: str = "nih14"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
