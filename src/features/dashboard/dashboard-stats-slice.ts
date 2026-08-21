import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { FEATURES } from "../../config/features";
import { fetchDashboardStatsApi } from "../../services/apiClient";

export interface DashboardStats {
  totalStudies: number;
  pendingReview: number;
  abnormalCount: number;
  avgConfidence: number;
  timestamp: string;
}

export interface FindingDistribution {
  label: string;
  count: number;
}

interface DashboardStatsState {
  stats: DashboardStats;
  findingDistribution: FindingDistribution[];
  loading: boolean;
  error: string | null;
}

const emptyStats: DashboardStats = {
  totalStudies: 0,
  pendingReview: 0,
  abnormalCount: 0,
  avgConfidence: 0,
  timestamp: "",
};

const initialState: DashboardStatsState = {
  stats: emptyStats,
  findingDistribution: [
    { label: "Normal", count: 0 },
    { label: "Nodule", count: 0 },
    { label: "Pneumonia", count: 0 },
    { label: "Other", count: 0 },
  ],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboardStats/fetchDashboardStats",
  async () => {
    if (FEATURES.USE_MOCK_AI) {
      return {
        stats: emptyStats,
        findingDistribution: initialState.findingDistribution,
      };
    }
    return fetchDashboardStatsApi();
  }
);

export const dashboardStatsSlice = createSlice({
  name: "dashboardStats",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.findingDistribution = action.payload.findingDistribution;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch dashboard stats";
      });
  },
});

export default dashboardStatsSlice.reducer;
