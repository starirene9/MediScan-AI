import { FindingLabel, GradCamMeta, Prediction, isNormalPrediction } from "../types/study";
import { FEATURES } from "../config/features";
import { analyzeXray } from "./apiClient";

const MOCK_PREDICTIONS: Prediction[] = [
  {
    label: "Normal",
    confidence: 0.91,
    classificationMode: "nih14",
    findings: [
      { name: "Infiltration", score: 0.12, positive: false },
      { name: "Effusion", score: 0.08, positive: false },
      { name: "Nodule", score: 0.05, positive: false },
    ],
  },
  {
    label: "Nodule",
    confidence: 0.87,
    classificationMode: "nih14",
    findings: [
      { name: "Nodule", score: 0.87, positive: true },
      { name: "Mass", score: 0.41, positive: false },
      { name: "Infiltration", score: 0.22, positive: false },
    ],
  },
  {
    label: "Pneumonia",
    confidence: 0.82,
    classificationMode: "nih14",
    findings: [
      { name: "Pneumonia", score: 0.82, positive: true },
      { name: "Infiltration", score: 0.71, positive: true },
      { name: "Consolidation", score: 0.55, positive: true },
    ],
  },
  {
    label: "Cardiomegaly",
    confidence: 0.76,
    classificationMode: "nih14",
    findings: [
      { name: "Cardiomegaly", score: 0.76, positive: true },
      { name: "Edema", score: 0.33, positive: false },
    ],
  },
];

export interface AnalysisResult {
  prediction: Prediction;
  imageUrl: string;
  gradCamUrl: string | null;
  gradCamMeta: GradCamMeta | null;
}

async function resolveUploadFile(
  file: File | null | undefined,
  previewUrl: string
): Promise<File> {
  if (file) return file;
  if (previewUrl.startsWith("data:")) {
    const response = await fetch(previewUrl);
    const blob = await response.blob();
    return new File([blob], "xray-upload.png", {
      type: blob.type || "image/png",
    });
  }
  throw new Error("Please select an image file to analyze.");
}

/** Prefer API analyze when USE_MOCK_AI is false. */
export async function runAnalysis(params: {
  file?: File | null;
  previewUrl: string;
  patientName?: string;
  notes?: string;
}): Promise<AnalysisResult> {
  if (!FEATURES.USE_MOCK_AI) {
    const uploadFile = await resolveUploadFile(params.file, params.previewUrl);
    const result = await analyzeXray({
      file: uploadFile,
      patientName: params.patientName,
      notes: params.notes,
      saveToWorklist: false,
    });
    return {
      prediction: result.prediction,
      imageUrl: result.imageUrl,
      gradCamUrl: result.gradCamUrl,
      gradCamMeta: result.gradCamMeta ?? null,
    };
  }

  await new Promise((r) => setTimeout(r, 1500));
  const prediction =
    MOCK_PREDICTIONS[Math.floor(Math.random() * MOCK_PREDICTIONS.length)];
  const gradCamUrl = getMockGradCamUrl(params.previewUrl, prediction.label);
  return {
    prediction,
    imageUrl: params.previewUrl,
    gradCamUrl,
    gradCamMeta: gradCamUrl
      ? {
          finding: prediction.label,
          confidence: prediction.confidence,
          centroid: { x: 0.5, y: 0.45 },
        }
      : null,
  };
}

export function getMockGradCamUrl(
  imageUrl: string,
  label: FindingLabel
): string | null {
  if (isNormalPrediction(label)) return null;
  return imageUrl;
}
