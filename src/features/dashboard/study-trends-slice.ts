import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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

const generateMockTrends = (): StudyTrendPoint[] => {
  const trends: StudyTrendPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const totalStudies = Math.floor(Math.random() * 12) + 3;
    trends.push({
      date: date.toISOString().slice(0, 10),
      formattedDate: date.toISOString().slice(5, 10),
      totalStudies,
      abnormalCount: Math.floor(totalStudies * (0.2 + Math.random() * 0.3)),
    });
  }

  return trends;
};

const initialState: StudyTrendsState = {
  trends: generateMockTrends(),
  loading: false,
  error: null,
};

export const fetchStudyTrends = createAsyncThunk(
  "studyTrends/fetchStudyTrends",
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return generateMockTrends();
  }
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
