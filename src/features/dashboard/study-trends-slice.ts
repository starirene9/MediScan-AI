import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchStudyTrendsApi } from "../../services/apiClient";

export interface StudyTrendPoint {
  date: string;
  formattedDate: string;
  totalStudies: number;
  abnormalCount: number;
}

interface StudyTrendsState {
  trends: StudyTrendPoint[];
  loading: boolean;
  error: string | null;
}

const initialState: StudyTrendsState = {
  trends: [],
  loading: false,
  error: null,
};

export const fetchStudyTrends = createAsyncThunk(
  "studyTrends/fetchStudyTrends",
  async () => fetchStudyTrendsApi()
);

export const studyTrendsSlice = createSlice({
  name: "studyTrends",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudyTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.trends = action.payload;
      })
      .addCase(fetchStudyTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch study trends";
      });
  },
});

export default studyTrendsSlice.reducer;
