import { configureStore } from "@reduxjs/toolkit";
import studiesReducer from "../features/studies/studies-slice";
import dashboardStatsReducer from "../features/dashboard/dashboard-stats-slice";
import studyTrendsReducer from "../features/dashboard/study-trends-slice";

export const store = configureStore({
  reducer: {
    studies: studiesReducer,
    dashboardStats: dashboardStatsReducer,
    studyTrends: studyTrendsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
