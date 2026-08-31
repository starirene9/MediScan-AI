import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { RootState } from "../../store/store";

const StudyTrendChart = () => {
  const intl = useIntl();
  const theme = useTheme();
  const tickFill = theme.palette.text.secondary;
  const gridStroke = theme.palette.divider;
  const { trends, error } = useSelector(
    (state: RootState) => state.studyTrends
  );

  if (error) {
    return (
      <Paper sx={{ p: 2, height: "100%" }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 1.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ mb: 1, color: "var(--color-navy)", flexShrink: 0 }}
      >
        {intl.formatMessage({ id: "study_trend_chart" })}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 10, fill: tickFill }}
              stroke={gridStroke}
            />
            <YAxis
              width={32}
              tick={{ fontSize: 10, fill: tickFill }}
              stroke={gridStroke}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: theme.palette.text.secondary }}
            />
            <Line
              type="monotone"
              dataKey="totalStudies"
              stroke="var(--color-azure)"
              strokeWidth={2}
              dot={false}
              name={intl.formatMessage({ id: "studies_analyzed" })}
            />
            <Line
              type="monotone"
              dataKey="abnormalCount"
              stroke="#DC143C"
              strokeWidth={2}
              dot={false}
              name={intl.formatMessage({ id: "abnormal_findings" })}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default StudyTrendChart;
