import { FindingLabel, Prediction } from "../types/study";
import { FEATURES } from "../config/features";
import { analyzeXray } from "./apiClient";

const MOCK_PREDICTIONS: Prediction[] = [
  { label: "Normal", confidence: 0.91 },
  { label: "Nodule", confidence: 0.87 },
  { label: "Pneumonia", confidence: 0.82 },
  { label: "Other", confidence: 0.65 },
];

export interface AnalysisResult {
  prediction: Prediction;
  imageUrl: string;
  gradCamUrl: string | null;
}

/** Prefer API analyze when USE_MOCK_AI is false. */
export async function runAnalysis(params: {
  file?: File | null;
  previewUrl: string;
  patientName?: string;
  notes?: string;
}): Promise<AnalysisResult> {
  if (!FEATURES.USE_MOCK_AI) {
    if (!params.file) {
      throw new Error("Please select an image file to analyze.");
    }
    const result = await analyzeXray({
      file: params.file,
      patientName: params.patientName,
      notes: params.notes,
      saveToWorklist: false,
    });
    return {
      prediction: result.prediction,
      imageUrl: result.imageUrl,
      gradCamUrl: result.gradCamUrl,
    };
  }

  await new Promise((r) => setTimeout(r, 1500));
  const prediction =
    MOCK_PREDICTIONS[Math.floor(Math.random() * MOCK_PREDICTIONS.length)];
  return {
    prediction,
    imageUrl: params.previewUrl,
    gradCamUrl: getMockGradCamUrl(params.previewUrl, prediction.label),
  };
}

export function getMockGradCamUrl(
  imageUrl: string,
  label: FindingLabel
): string | null {
  if (label === "Normal") return null;
  return imageUrl;
}
