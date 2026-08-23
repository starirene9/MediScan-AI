export type StudyStatus = "Pending" | "Reviewed" | "Abnormal" | "Normal";

/** Summary label: NIH pathology name or "Normal". */
export type FindingLabel = string;

export interface PathologyFinding {
  name: string;
  score: number;
  positive: boolean;
}

export interface Prediction {
  label: FindingLabel;
  confidence: number;
  findings?: PathologyFinding[];
  classificationMode?: "nih14" | "grouped" | string;
}

export interface Study {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  modality: string;
  uploadedAt: string;
  status: StudyStatus;
  prediction: Prediction;
  imageUrl: string;
  gradCamUrl: string | null;
  notes: string;
}

export function isNormalPrediction(label: string): boolean {
  return label === "Normal" || label === "No Finding";
}
