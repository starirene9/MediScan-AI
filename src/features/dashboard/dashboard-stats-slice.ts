import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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

const mockStats: DashboardStats = {
  totalStudies: 142,
  pendingReview: 18,
  abnormalCount: 34,
  avgConfidence: 0.84,
  timestamp: new Date().toISOString(),
};

const mockFindingDistribution: FindingDistribution[] = [
  { label: "Normal", count: 68 },
  { label: "Nodule", count: 22 },
  { label: "Pneumonia", count: 12 },
  { label: "Other", count: 40 },
];

const initialState: DashboardStatsState = {
  stats: mockStats,
  findingDistribution: mockFindingDistribution,
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboardStats/fetchDashboardStats",
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      stats: { ...mockStats, timestamp: new Date().toISOString() },
      findingDistribution: mockFindingDistribution,
    };
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
