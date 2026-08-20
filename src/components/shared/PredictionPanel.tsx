import { Box, LinearProgress, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { Prediction } from "../../types/study";
import ConfidenceChip from "./ConfidenceChip";

interface PredictionPanelProps {
  prediction: Prediction | null;
  loading?: boolean;
}

const PredictionPanel = ({ prediction, loading }: PredictionPanelProps) => {
  const intl = useIntl();

  if (loading) {
    return <LinearProgress />;
  }

  if (!prediction) {
    return (
      <Typography color="textSecondary">
        {intl.formatMessage({ id: "no_prediction" })}
      </Typography>
    );
  }

  const confidencePercent = Math.round(prediction.confidence * 100);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="body1">
          {intl.formatMessage({ id: "finding_label" })}:
        </Typography>
        <ConfidenceChip label={prediction.label} confidence={prediction.confidence} />
      </Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {intl.formatMessage({ id: "confidence" })}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <LinearProgress
          variant="determinate"
          value={confidencePercent}
          sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
        />
        <Typography variant="h6" fontWeight="bold">
          {confidencePercent}%
        </Typography>
      </Box>
    </Box>
  );
};

export default PredictionPanel;
