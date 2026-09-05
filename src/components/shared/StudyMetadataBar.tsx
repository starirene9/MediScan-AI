import { Box, Chip, Stack, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { Study } from "../../types/study";
import { getStudyStatusColor } from "../../utils";
import ConfidenceChip from "./ConfidenceChip";

interface StudyMetadataBarProps {
  study: Study;
}

const StudyMetadataBar = ({ study }: StudyMetadataBarProps) => {
  const intl = useIntl();

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
      <Stack direction="row" spacing={1} sx={{ ml: { sm: "auto" } }}>
        <Chip size="small" label={study.id} variant="outlined" />
        <Chip
          size="small"
          label={intl.formatMessage({
            id: `study_status_${study.status.toLowerCase()}`,
          })}
          sx={{
            bgcolor: `${getStudyStatusColor(study.status)}18`,
            color: getStudyStatusColor(study.status),
            fontWeight: 600,
          }}
        />
        <ConfidenceChip
          label={study.prediction.label}
          confidence={study.prediction.confidence}
        />
      </Stack>
    </Box>
  );
};

export default StudyMetadataBar;
