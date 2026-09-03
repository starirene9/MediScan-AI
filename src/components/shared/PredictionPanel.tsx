import { Alert, Box, LinearProgress, Stack, Typography, Chip } from "@mui/material";
import { useIntl } from "react-intl";
import { PathologyFinding, Prediction } from "../../types/study";
import ConfidenceChip from "./ConfidenceChip";

interface PredictionPanelProps {
  prediction: Prediction | null;
  loading?: boolean;
  loadingMessageId?: string;
  loadingHintId?: string;
  elapsedSeconds?: number;
}

const findingLabelId = (name: string) =>
  `finding_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const FindingRow = ({ finding }: { finding: PathologyFinding }) => {
  const intl = useIntl();
  const percent = Math.round(finding.score * 100);
  const name = intl.formatMessage({
    id: findingLabelId(finding.name),
    defaultMessage: finding.name.replace(/_/g, " "),
  });

  return (
    <Box sx={{ mb: 1.25 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
        <Typography
          variant="body2"
          fontWeight={finding.positive ? 700 : 400}
          color={finding.positive ? "text.primary" : "text.secondary"}
        >
          {name}
          {finding.positive ? (
            <Chip
              label={intl.formatMessage({ id: "finding_positive", defaultMessage: "positive" })}
              size="small"
              color="error"
              sx={{ ml: 1, height: 20, fontSize: 11 }}
            />
          ) : null}
        </Typography>
        <Typography
          variant="body2"
          color={finding.positive ? "error.main" : "text.secondary"}
          fontWeight={600}
          sx={{ flexShrink: 0 }}
        >
          {percent}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={finding.positive ? "error" : "inherit"}
        sx={{ height: 8, borderRadius: 4, opacity: finding.positive ? 1 : 0.4 }}
      />
    </Box>
  );
};

const PredictionPanel = ({
  prediction,
  loading,
  loadingMessageId = "analyzing",
  loadingHintId,
  elapsedSeconds = 0,
}: PredictionPanelProps) => {
  const intl = useIntl();

  if (loading) {
    return (
      <Stack spacing={1.5}>
        <LinearProgress />
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {intl.formatMessage({ id: loadingMessageId })}
        </Typography>
        {loadingHintId ? (
          <Typography variant="body2" color="text.secondary">
            {intl.formatMessage({ id: loadingHintId })}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          {intl.formatMessage({ id: "analyze_keep_page_open" })}
        </Typography>
        {elapsedSeconds > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {intl.formatMessage(
              { id: "analyze_elapsed" },
              { seconds: elapsedSeconds }
            )}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  if (!prediction) {
    return (
      <Typography color="textSecondary">
        {intl.formatMessage({ id: "no_prediction" })}
      </Typography>
    );
  }

  const findings = [...(prediction.findings ?? [])].sort(
    (a, b) => b.score - a.score
  );
  const positiveCount = findings.filter((f) => f.positive).length;

  return (
    <Box>
      <Alert
        severity="warning"
        variant="outlined"
        sx={{ mb: 2, py: 0.5, alignItems: "center" }}
      >
        <Typography variant="body2" fontWeight={600}>
          {intl.formatMessage({ id: "clinical_disclaimer" })}
        </Typography>
      </Alert>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="body1">
          {intl.formatMessage({ id: "primary_finding" })}:
        </Typography>
        <ConfidenceChip label={prediction.label} confidence={prediction.confidence} />
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
        {intl.formatMessage(
          { id: "nih14_scores_title" },
          { positive: positiveCount, total: findings.length || 14 }
        )}
      </Typography>

      {findings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {intl.formatMessage({ id: "no_nih_scores" })}
        </Typography>
      ) : (
        <Stack spacing={0}>
          {findings.map((finding) => (
            <FindingRow key={finding.name} finding={finding} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default PredictionPanel;
