import { GradCamMeta, Prediction } from "../types/study";
import { analyzeXray } from "./apiClient";

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

export async function runAnalysis(params: {
  file?: File | null;
  previewUrl: string;
  patientName?: string;
  notes?: string;
}): Promise<AnalysisResult> {
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
