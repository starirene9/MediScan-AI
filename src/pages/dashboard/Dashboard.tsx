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
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "dashboard_title" })}
        </Typography>
        {loading && <CircularProgress size={18} />}
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ flexShrink: 0 }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <StatCard labelId="stat_total_studies" value={stats.totalStudies} compact />
        <StatCard
          labelId="stat_pending_review"
          value={stats.pendingReview}
          color="var(--color-azure)"
          compact
        />
        <StatCard
          labelId="stat_abnormal"
          value={stats.abnormalCount}
          color="#DC143C"
          compact
        />
        <StatCard
          labelId="stat_override_rate"
          value={`${Math.round((stats.overrideRate ?? 0) * 100)}%`}
          color="#E67E22"
          compact
        />
        <StatCard
          labelId="stat_avg_confidence"
          value={`${Math.round(stats.avgConfidence * 100)}%`}
          compact
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: { xs: "wrap", md: "nowrap" },
          gap: 1.5,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box sx={{ flex: "1 1 58%", minWidth: 0, minHeight: { xs: 260, md: 0 } }}>
          <StudyTrendChart />
        </Box>
        <Box sx={{ flex: "1 1 38%", minWidth: 0, minHeight: { xs: 260, md: 0 } }}>
          <FindingDistribution />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
