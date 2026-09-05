export type StudyStatus = "Pending" | "Reviewed" | "Abnormal" | "Normal";

export type ReviewDecision = "accepted" | "overridden";

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

export interface ClinicalReview {
  decision: ReviewDecision;
  finalLabel: FindingLabel;
  note: string;
  reviewedAt: string;
}

export interface GradCamMeta {
  finding: string;
  confidence: number;
  /** Normalized focus point (0–1). Optional on stored studies. */
  centroid?: { x: number; y: number };
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
  review?: ClinicalReview | null;
}

export const NIH14_LABELS = [
  "Atelectasis",
  "Cardiomegaly",
  "Effusion",
  "Infiltration",
  "Mass",
  "Nodule",
  "Pneumonia",
  "Pneumothorax",
  "Consolidation",
  "Edema",
  "Emphysema",
  "Fibrosis",
  "Pleural_Thickening",
  "Hernia",
] as const;

export const FINAL_LABEL_OPTIONS = ["Normal", ...NIH14_LABELS] as const;

export function isNormalPrediction(label: string): boolean {
  return label === "Normal" || label === "No Finding";
}

export function effectiveFindingLabel(study: Study): string {
  return study.review?.finalLabel ?? study.prediction.label;
}
