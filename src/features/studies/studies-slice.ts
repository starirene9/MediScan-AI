import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../../store/store";
import { Study } from "../../types/study";

interface StudiesState {
  studies: { [id: string]: Study };
  loading: boolean;
  error: string | null;
  selectedStudyId: string | null;
}

const sampleStudies: { [id: string]: Study } = {
  S001: {
    id: "S001",
    patientId: "P001",
    patientName: "John Smith",
    age: 45,
    gender: "Male",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-18T09:30:00",
    status: "Abnormal",
    prediction: { label: "Nodule", confidence: 0.87 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: "/placeholder-xray.svg",
    notes: "",
  },
  S002: {
    id: "S002",
    patientId: "P002",
    patientName: "Emily Johnson",
    age: 32,
    gender: "Female",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-18T11:15:00",
    status: "Abnormal",
    prediction: { label: "Pneumonia", confidence: 0.92 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: "/placeholder-xray.svg",
    notes: "Follow-up recommended in 2 weeks.",
  },
  S003: {
    id: "S003",
    patientId: "P003",
    patientName: "Robert Williams",
    age: 58,
    gender: "Male",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-19T08:00:00",
    status: "Normal",
    prediction: { label: "Normal", confidence: 0.95 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: null,
    notes: "",
  },
  S004: {
    id: "S004",
    patientId: "P004",
    patientName: "Sophia Garcia",
    age: 29,
    gender: "Female",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-19T14:20:00",
    status: "Pending",
    prediction: { label: "Other", confidence: 0.62 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: null,
    notes: "",
  },
  S005: {
    id: "S005",
    patientId: "P005",
    patientName: "David Kim",
    age: 67,
    gender: "Male",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-20T07:45:00",
    status: "Reviewed",
    prediction: { label: "Nodule", confidence: 0.78 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: "/placeholder-xray.svg",
    notes: "Biopsy scheduled.",
  },
  S006: {
    id: "S006",
    patientId: "P006",
    patientName: "Jackson Lee",
    age: 52,
    gender: "Male",
    modality: "Chest X-ray",
    uploadedAt: "2025-08-20T10:00:00",
    status: "Pending",
    prediction: { label: "Normal", confidence: 0.71 },
    imageUrl: "/placeholder-xray.svg",
    gradCamUrl: null,
    notes: "",
  },
};

const initialState: StudiesState = {
  studies: sampleStudies,
  loading: false,
  error: null,
  selectedStudyId: null,
};

export const fetchStudiesData = createAsyncThunk(
  "studies/fetchStudiesData",
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return sampleStudies;
  }
);

export const studiesSlice = createSlice({
  name: "studies",
  initialState,
  reducers: {
    selectStudy(state, action: PayloadAction<string>) {
      state.selectedStudyId = action.payload;
    },
    updateStudy(
      state,
      action: PayloadAction<Partial<Study> & { id: string }>
    ) {
      const { id, ...updates } = action.payload;
      const existing = state.studies[id];
      if (existing) {
        state.studies[id] = { ...existing, ...updates };
      }
    },
    addStudy(state, action: PayloadAction<Study>) {
      state.studies[action.payload.id] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudiesData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudiesData.fulfilled, (state, action) => {
        state.loading = false;
        state.studies = action.payload;
      })
      .addCase(fetchStudiesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch studies";
      });
  },
});

export const { selectStudy, updateStudy, addStudy } = studiesSlice.actions;

export default studiesSlice.reducer;

export const selectSelectedStudy = (state: RootState): Study | null => {
  const { selectedStudyId, studies } = state.studies;
  return selectedStudyId ? studies[selectedStudyId] ?? null : null;
};
