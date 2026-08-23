import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useIntl } from "react-intl";

interface StatCardProps {
  labelId: string;
  value: string | number;
  color?: string;
  compact?: boolean;
}

export default function StatCard({
  labelId,
  value,
  color,
  compact = false,
}: StatCardProps) {
  const intl = useIntl();

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent
        sx={{
          textAlign: "center",
          py: compact ? 1.25 : 3,
          "&:last-child": { pb: compact ? 1.25 : 3 },
        }}
      >
        <Typography
          gutterBottom
          sx={{ color: "text.secondary", fontSize: compact ? 12 : 14, mb: 0.5 }}
        >
          {intl.formatMessage({ id: labelId })}
        </Typography>
        <Typography
          variant={compact ? "h5" : "h4"}
          sx={{ fontWeight: "bold", color: color ?? "text.primary" }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
