import { Box, Chip, Stack, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { Study, effectiveFindingLabel } from "../../types/study";
import ConfidenceChip from "./ConfidenceChip";

interface StudyMetadataBarProps {
  study: Study;
}

const StudyMetadataBar = ({ study }: StudyMetadataBarProps) => {
  const intl = useIntl();
  const finalLabel = effectiveFindingLabel(study);
  const review = study.review;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        p: 1.5,
        bgcolor: "action.hover",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {study.patientName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        · {study.modality}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ ml: { sm: "auto" }, flexWrap: "wrap" }}>
        <Chip size="small" label={study.id} variant="outlined" />
        <ConfidenceChip
          label={study.prediction.label}
          confidence={study.prediction.confidence}
        />
        {review ? (
          <Chip
            size="small"
            color={review.decision === "overridden" ? "warning" : "success"}
            label={
              review.decision === "overridden"
                ? intl.formatMessage(
                    { id: "review_badge_overridden" },
                    { label: finalLabel.replace(/_/g, " ") }
                  )
                : intl.formatMessage({ id: "review_badge_accepted" })
            }
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Chip
            size="small"
            color="info"
            variant="outlined"
            label={intl.formatMessage({ id: "review_badge_pending" })}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default StudyMetadataBar;
