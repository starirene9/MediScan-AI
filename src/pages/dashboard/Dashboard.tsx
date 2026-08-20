import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { AppDispatch, RootState } from "../../store/store";
import { fetchDashboardStats } from "../../features/dashboard/dashboard-stats-slice";
import { fetchStudyTrends } from "../../features/dashboard/study-trends-slice";
import StatCard from "../../components/shared/StatCard";
import StudyTrendChart from "./StudyTrendChart";
import FindingDistribution from "./FindingDistribution";

const Dashboard = () => {
  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading, error } = useSelector(
    (state: RootState) => state.dashboardStats
  );

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchStudyTrends());
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: "100%",
        pb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6" sx={{ color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "dashboard_title" })}
        </Typography>
        {loading && <CircularProgress size={20} />}
      </Box>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard labelId="stat_total_studies" value={stats.totalStudies} />
        <StatCard
          labelId="stat_pending_review"
          value={stats.pendingReview}
          color="var(--color-azure)"
        />
        <StatCard
          labelId="stat_abnormal"
          value={stats.abnormalCount}
          color="#DC143C"
        />
        <StatCard
          labelId="stat_avg_confidence"
          value={`${Math.round(stats.avgConfidence * 100)}%`}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          flex: 1,
        }}
      >
        <Box sx={{ flex: "1 1 55%", minWidth: 280 }}>
          <StudyTrendChart />
        </Box>
        <Box sx={{ flex: "1 1 35%", minWidth: 240 }}>
          <FindingDistribution />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
