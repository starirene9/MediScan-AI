import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useIntl } from "react-intl";

interface StatCardProps {
  labelId: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ labelId, value, color }: StatCardProps) {
  const intl = useIntl();

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent sx={{ textAlign: "center", py: 3 }}>
        <Typography gutterBottom sx={{ color: "text.secondary", fontSize: 14 }}>
          {intl.formatMessage({ id: labelId })}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: color ?? "text.primary" }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
