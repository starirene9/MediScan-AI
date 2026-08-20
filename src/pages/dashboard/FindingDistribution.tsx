import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { RootState } from "../../store/store";
import { getFindingColor } from "../../utils";

const FindingDistribution = () => {
  const intl = useIntl();
  const { findingDistribution, error } = useSelector(
    (state: RootState) => state.dashboardStats
  );

  if (error) {
    return (
      <Paper sx={{ p: 2, minHeight: 320 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  const data = findingDistribution.map((item) => ({
    ...item,
    name: intl.formatMessage({
      id: `finding_${item.label.toLowerCase()}`,
      defaultMessage: item.label,
    }),
  }));

  return (
    <Paper sx={{ p: 2, minHeight: 360 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, color: "var(--color-navy)" }}>
        {intl.formatMessage({ id: "finding_distribution" })}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="count"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {findingDistribution.map((entry) => (
              <Cell key={entry.label} fill={getFindingColor(entry.label)} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default FindingDistribution;
