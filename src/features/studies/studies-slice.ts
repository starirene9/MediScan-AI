import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../../store/store";
import { Study } from "../../types/study";
import {
  createStudy,
  deleteStudy,
  fetchStudies,
  fetchStudy,
  patchStudy,
} from "../../services/apiClient";
import { FEATURES } from "../../config/features";

interface StudiesState {
  studies: { [id: string]: Study };
  loading: boolean;
  error: string | null;
  selectedStudyId: string | null;
  mutating: boolean;
}

const initialState: StudiesState = {
  studies: {},
  loading: false,
  error: null,
  selectedStudyId: null,
  mutating: false,
};

function toRecord(list: Study[]): { [id: string]: Study } {
  return Object.fromEntries(list.map((study) => [study.id, study]));
}

export const fetchStudiesData = createAsyncThunk(
  "studies/fetchStudiesData",
  async () => {
    if (FEATURES.USE_MOCK_AI) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {} as { [id: string]: Study };
    }
    const list = await fetchStudies();
    return toRecord(list);
  }
);

export const fetchStudyById = createAsyncThunk(
  "studies/fetchStudyById",
  async (id: string) => {
    if (FEATURES.USE_MOCK_AI) {
      throw new Error("Study not found");
    }
    return fetchStudy(id);
  }
);

export const saveStudyNotes = createAsyncThunk(
  "studies/saveStudyNotes",
  async ({ id, notes }: { id: string; notes: string }) => {
    if (FEATURES.USE_MOCK_AI) {
      return { id, notes } as Partial<Study> & { id: string };
    }
    return patchStudy(id, { notes });
  }
);

export const updateStudyFields = createAsyncThunk(
  "studies/updateStudyFields",
  async ({
    id,
    ...payload
  }: {
    id: string;
    notes?: string;
    status?: Study["status"];
    patientName?: string;
    age?: number;
    gender?: string;
    modality?: string;
  }) => {
    if (FEATURES.USE_MOCK_AI) {
      return { id, ...payload } as Study;
    }
    return patchStudy(id, payload);
  }
);

export const removeStudy = createAsyncThunk(
  "studies/removeStudy",
  async (id: string) => {
    if (!FEATURES.USE_MOCK_AI) {
      await deleteStudy(id);
    }
    return id;
  }
);

export const saveStudyToWorklist = createAsyncThunk(
  "studies/saveStudyToWorklist",
  async (
    payload: {
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
    }
  ) => {
    if (FEATURES.USE_MOCK_AI) {
      const id = `S${Date.now().toString().slice(-6)}`;
      return {
        id,
        patientId: payload.patientId || `P${Date.now().toString().slice(-4)}`,
        patientName: payload.patientName,
        age: payload.age,
        gender: payload.gender,
        modality: payload.modality,
        uploadedAt: new Date().toISOString(),
        status: payload.status,
        prediction: payload.prediction,
        imageUrl: payload.imageUrl,
        gradCamUrl: payload.gradCamUrl,
        notes: payload.notes,
      } as Study;
    }
    return createStudy(payload);
  }
);

export const studiesSlice = createSlice({
  name: "studies",
  initialState,
  reducers: {
    selectStudy(state, action: PayloadAction<string | null>) {
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
    removeStudyLocal(state, action: PayloadAction<string>) {
      delete state.studies[action.payload];
      if (state.selectedStudyId === action.payload) {
        state.selectedStudyId = null;
      }
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
      })
      .addCase(fetchStudyById.fulfilled, (state, action) => {
        state.studies[action.payload.id] = action.payload;
        state.loading = false;
      })
      .addCase(saveStudyNotes.fulfilled, (state, action) => {
        const study = action.payload as Study;
        if (study.id && state.studies[study.id]) {
          state.studies[study.id] = {
            ...state.studies[study.id],
            ...study,
          };
        }
      })
      .addCase(updateStudyFields.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(updateStudyFields.fulfilled, (state, action) => {
        state.mutating = false;
        state.studies[action.payload.id] = action.payload;
      })
      .addCase(updateStudyFields.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.error.message || "Failed to update study";
      })
      .addCase(removeStudy.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(removeStudy.fulfilled, (state, action) => {
        state.mutating = false;
        delete state.studies[action.payload];
        if (state.selectedStudyId === action.payload) {
          const remaining = Object.keys(state.studies);
          state.selectedStudyId = remaining[0] ?? null;
        }
      })
      .addCase(removeStudy.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.error.message || "Failed to delete study";
      })
      .addCase(saveStudyToWorklist.fulfilled, (state, action) => {
        state.studies[action.payload.id] = action.payload;
        state.selectedStudyId = action.payload.id;
      });
  },
});

export const { selectStudy, updateStudy, addStudy, removeStudyLocal } =
  studiesSlice.actions;

export default studiesSlice.reducer;

export const selectSelectedStudy = (state: RootState): Study | null => {
  const { selectedStudyId, studies } = state.studies;
  return selectedStudyId ? studies[selectedStudyId] ?? null : null;
};
