import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Box, Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { RootState } from "../../store/store";
import { getFindingColor } from "../../utils";

const RADIAN = Math.PI / 180;

type SliceLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
};

const renderSliceLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  percent = 0,
  name = "",
}: SliceLabelProps) => {
  if (percent < 0.03) return null;

  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x >= cx ? "start" : "end";
  const pct = `${(percent * 100).toFixed(0)}%`;

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="#1e293b"
      fontSize={12}
      fontWeight={600}
    >
      <tspan x={x} dy="-0.4em">
        {name}
      </tspan>
      <tspan x={x} dy="1.15em">
        {pct}
      </tspan>
    </text>
  );
};

const FindingDistribution = () => {
  const intl = useIntl();
  const { findingDistribution, error } = useSelector(
    (state: RootState) => state.dashboardStats
  );

  if (error) {
    return (
      <Paper sx={{ p: 2, height: "100%", minHeight: 280 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  const data = findingDistribution
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      name: intl.formatMessage({
        id: `finding_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        defaultMessage: item.label.replace(/_/g, " "),
      }),
    }));

  return (
    <Paper
      sx={{
        p: 1.5,
        height: "100%",
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ mb: 1, color: "var(--color-navy)", flexShrink: 0 }}
      >
        {intl.formatMessage({ id: "finding_distribution" })}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 240, width: "100%", overflow: "visible" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 22, right: 64, bottom: 18, left: 64 }}>
            <Pie
              data={data}
              cx="50%"
              cy="40%"
              innerRadius="30%"
              outerRadius="42%"
              dataKey="count"
              label={renderSliceLabel}
              labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={getFindingColor(entry.label)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => [
                value,
                item.payload?.name ?? item.name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              iconSize={12}
              wrapperStyle={{ fontSize: 14, lineHeight: "18px", paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default FindingDistribution;
