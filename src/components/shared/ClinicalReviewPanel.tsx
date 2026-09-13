import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { useIntl } from "react-intl";
import {
  FINAL_LABEL_OPTIONS,
  Study,
  isNormalPrediction,
} from "../../types/study";

interface ClinicalReviewPanelProps {
  study: Study;
  submitting?: boolean;
  onSubmit: (payload: {
    decision: "accepted" | "overridden";
    finalLabel?: string;
    note?: string;
  }) => Promise<void> | void;
}

const findingLabelId = (name: string) =>
  `finding_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const ClinicalReviewPanel = ({
  study,
  submitting = false,
  onSubmit,
}: ClinicalReviewPanelProps) => {
  const intl = useIntl();
  const [mode, setMode] = useState<"idle" | "override">("idle");
  const [finalLabel, setFinalLabel] = useState(study.prediction.label);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const review = study.review;

  if (review) {
    const isOverride = review.decision === "overridden";
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1.5, color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "clinical_review" })}
        </Typography>
        <Alert
          severity={isOverride ? "warning" : "success"}
          variant="outlined"
          sx={{ mb: 1.5 }}
        >
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Chip
                size="small"
                color={isOverride ? "warning" : "success"}
                label={intl.formatMessage({
                  id: isOverride ? "review_decision_overridden" : "review_decision_accepted",
                })}
              />
              <Typography variant="body2">
                {intl.formatMessage({ id: "final_label" })}:{" "}
                <strong>
                  {intl.formatMessage({
                    id: findingLabelId(review.finalLabel),
                    defaultMessage: review.finalLabel.replace(/_/g, " "),
                  })}
                </strong>
              </Typography>
            </Box>
            {isOverride && (
              <Typography variant="body2" color="text.secondary">
                {intl.formatMessage(
                  { id: "review_override_summary" },
                  {
                    ai: intl.formatMessage({
                      id: findingLabelId(study.prediction.label),
                      defaultMessage: study.prediction.label.replace(/_/g, " "),
                    }),
                    final: intl.formatMessage({
                      id: findingLabelId(review.finalLabel),
                      defaultMessage: review.finalLabel.replace(/_/g, " "),
                    }),
                  }
                )}
              </Typography>
            )}
            {review.note ? (
              <Typography variant="body2" color="text.secondary">
                {review.note}
              </Typography>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              {intl.formatMessage(
                { id: "reviewed_at" },
                {
                  date: intl.formatDate(new Date(review.reviewedAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                }
              )}
            </Typography>
          </Stack>
        </Alert>
        <Typography variant="caption" color="text.secondary">
          {intl.formatMessage({ id: "review_ai_preserved" })}
        </Typography>
      </Box>
    );
  }

  const handleAccept = async () => {
    setError(null);
    try {
      await onSubmit({ decision: "accepted", note: note.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : intl.formatMessage({ id: "review_failed" }));
    }
  };

  const handleOverride = async () => {
    if (finalLabel === study.prediction.label) {
      setError(intl.formatMessage({ id: "review_override_same_label" }));
      return;
    }
    setError(null);
    try {
      await onSubmit({
        decision: "overridden",
        finalLabel,
        note: note.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : intl.formatMessage({ id: "review_failed" }));
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, color: "var(--color-navy)" }}>
        {intl.formatMessage({ id: "clinical_review" })}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {intl.formatMessage({ id: "clinical_review_hint" })}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {mode === "idle" ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="contained"
            color="success"
            disabled={submitting}
            onClick={handleAccept}
          >
            {intl.formatMessage({ id: "review_accept" })}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            disabled={submitting}
            onClick={() => {
              setMode("override");
              setFinalLabel(
                isNormalPrediction(study.prediction.label)
                  ? "Nodule"
                  : "Normal"
              );
              setError(null);
            }}
          >
            {intl.formatMessage({ id: "review_override" })}
          </Button>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel id="final-label-select">
              {intl.formatMessage({ id: "final_label" })}
            </InputLabel>
            <Select
              labelId="final-label-select"
              label={intl.formatMessage({ id: "final_label" })}
              value={finalLabel}
              onChange={(e) => setFinalLabel(e.target.value)}
            >
              {FINAL_LABEL_OPTIONS.filter((label) => label !== study.prediction.label).map(
                (label) => (
                  <MenuItem key={label} value={label}>
                    {intl.formatMessage({
                      id: findingLabelId(label),
                      defaultMessage: label.replace(/_/g, " "),
                    })}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
          <TextField
            size="small"
            multiline
            minRows={2}
            fullWidth
            label={intl.formatMessage({ id: "review_note" })}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={intl.formatMessage({ id: "review_note_placeholder" })}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="warning"
              disabled={submitting}
              onClick={handleOverride}
            >
              {intl.formatMessage({ id: "review_save_override" })}
            </Button>
            <Button
              variant="text"
              disabled={submitting}
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
            >
              {intl.formatMessage({ id: "cancel" })}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default ClinicalReviewPanel;
