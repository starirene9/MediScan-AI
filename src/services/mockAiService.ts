import { FindingLabel, Prediction } from "../types/study";
import { FEATURES } from "../config/features";

const MOCK_PREDICTIONS: Prediction[] = [
  { label: "Normal", confidence: 0.91 },
  { label: "Nodule", confidence: 0.87 },
  { label: "Pneumonia", confidence: 0.82 },
  { label: "Other", confidence: 0.65 },
];

/** UI-only mock. Replace with FastAPI call on feature/fastapi-backend branch. */
export async function runMockAnalysis(_imageUrl: string): Promise<Prediction> {
  if (!FEATURES.USE_MOCK_AI) {
    throw new Error("Real API not wired yet. Enable on feature/fastapi-backend.");
  }

  await new Promise((r) => setTimeout(r, 1500));
  return MOCK_PREDICTIONS[Math.floor(Math.random() * MOCK_PREDICTIONS.length)];
}

export function getMockGradCamUrl(
  imageUrl: string,
  label: FindingLabel
): string | null {
  if (label === "Normal") return null;
  // Placeholder: same image until Grad-CAM API is connected
  return imageUrl;
}
