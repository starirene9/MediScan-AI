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
import { Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { RootState } from "../../store/store";

const StudyTrendChart = () => {
  const intl = useIntl();
  const { trends, error } = useSelector(
    (state: RootState) => state.studyTrends
  );

  if (error) {
    return (
      <Paper sx={{ p: 2, minHeight: 320 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, minHeight: 360 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, color: "var(--color-navy)" }}>
        {intl.formatMessage({ id: "study_trend_chart" })}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Legend />
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
    </Paper>
  );
};

export default StudyTrendChart;
