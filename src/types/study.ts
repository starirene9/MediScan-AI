export type StudyStatus = "Pending" | "Reviewed" | "Abnormal" | "Normal";

export type FindingLabel = "Normal" | "Nodule" | "Pneumonia" | "Other";

export interface Prediction {
  label: FindingLabel;
  confidence: number;
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
