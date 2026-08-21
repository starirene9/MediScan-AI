import { Study } from "../types/study";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // ignore parse errors
    }
    throw new Error(
      typeof detail === "string" ? detail : `Request failed (${response.status})`
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function normalizeStudy(raw: Study): Study {
  return {
    ...raw,
    uploadedAt:
      typeof raw.uploadedAt === "string"
        ? raw.uploadedAt
        : new Date(raw.uploadedAt as unknown as string).toISOString(),
  };
}

export async function fetchStudies(): Promise<Study[]> {
  const studies = await request<Study[]>("/api/studies");
  return studies.map(normalizeStudy);
}

export async function fetchStudy(id: string): Promise<Study> {
  return normalizeStudy(await request<Study>(`/api/studies/${id}`));
}

export async function createStudy(payload: {
  patientId?: string | null;
  patientName: string;
  age: number;
  gender: string;
  modality: string;
  status: Study["status"];
  prediction: Study["prediction"];
  imageUrl: string;
  gradCamUrl: string | null;
  notes: string;
}): Promise<Study> {
  return normalizeStudy(
    await request<Study>("/api/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: payload.patientId ?? null,
        patientName: payload.patientName,
        age: payload.age,
        gender: payload.gender,
        modality: payload.modality,
        status: payload.status,
        prediction: payload.prediction,
        imageUrl: payload.imageUrl,
        gradCamUrl: payload.gradCamUrl,
        notes: payload.notes,
      }),
    })
  );
}

export async function patchStudy(
  id: string,
  payload: { notes?: string; status?: Study["status"] }
): Promise<Study> {
  return normalizeStudy(
    await request<Study>(`/api/studies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export interface AnalyzeApiResponse {
  prediction: Study["prediction"];
  imageUrl: string;
  gradCamUrl: string | null;
  study: Study | null;
}

export async function analyzeXray(params: {
  file: File;
  patientName?: string;
  notes?: string;
  saveToWorklist?: boolean;
}): Promise<AnalyzeApiResponse> {
  const form = new FormData();
  form.append("file", params.file);
  form.append("patientName", params.patientName || "Unknown Patient");
  form.append("notes", params.notes || "");
  form.append("saveToWorklist", params.saveToWorklist ? "true" : "false");

  const result = await request<AnalyzeApiResponse>("/api/studies/analyze", {
    method: "POST",
    body: form,
  });

  return {
    ...result,
    study: result.study ? normalizeStudy(result.study) : null,
  };
}

export interface DashboardStatsPayload {
  stats: {
    totalStudies: number;
    pendingReview: number;
    abnormalCount: number;
    avgConfidence: number;
    timestamp: string;
  };
  findingDistribution: { label: string; count: number }[];
}

export async function fetchDashboardStatsApi(): Promise<DashboardStatsPayload> {
  const data = await request<DashboardStatsPayload>("/api/dashboard/stats");
  return {
    ...data,
    stats: {
      ...data.stats,
      timestamp:
        typeof data.stats.timestamp === "string"
          ? data.stats.timestamp
          : new Date(data.stats.timestamp).toISOString(),
    },
  };
}

export interface StudyTrendPoint {
  date: string;
  formattedDate: string;
  totalStudies: number;
  abnormalCount: number;
}

export async function fetchStudyTrendsApi(
  days = 30
): Promise<StudyTrendPoint[]> {
  return request<StudyTrendPoint[]>(`/api/dashboard/trends?days=${days}`);
}
