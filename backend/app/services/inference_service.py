import asyncio
import random

from app.models.schemas import FindingLabel, Prediction

MOCK_PREDICTIONS: list[Prediction] = [
    Prediction(label="Normal", confidence=0.91),
    Prediction(label="Nodule", confidence=0.87),
    Prediction(label="Pneumonia", confidence=0.82),
    Prediction(label="Other", confidence=0.65),
]


async def predict(_filename: str) -> Prediction:
    """UI/API mock. Replace with PyTorch inference on feature/cnn-ai."""
    await asyncio.sleep(0.4)
    return random.choice(MOCK_PREDICTIONS)


def mock_gradcam_url(image_url: str, label: FindingLabel) -> str | None:
    if label == "Normal":
        return None
    return image_url
