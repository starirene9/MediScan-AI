import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useIntl } from "react-intl";
import { AppDispatch, RootState } from "../../store/store";
import { fetchStudiesData } from "../../features/studies/studies-slice";
import { getStudyStatusColor } from "../../utils";
import ConfidenceChip from "../../components/shared/ConfidenceChip";

interface StudyDetailCardProps {
  selectedStudyId?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  hideTitle?: boolean;
}

const StudyDetailCard = ({
  selectedStudyId,
  onEdit,
  onDelete,
  hideTitle = false,
}: StudyDetailCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const intl = useIntl();
  const { studies, loading, error, mutating } = useSelector(
    (state: RootState) => state.studies
  );

  const study = selectedStudyId ? studies[selectedStudyId] : null;

  if (loading) return <LinearProgress />;
  if (error) {
    return (
      <Button startIcon={<ReplayIcon />} onClick={() => dispatch(fetchStudiesData())}>
        {intl.formatMessage({ id: "retry" })}
      </Button>
    );
  }
  if (!study) {
    return (
      <Typography color="textSecondary" sx={{ textAlign: "center", mt: 4 }}>
        {intl.formatMessage({ id: "no_study_selected" })}
      </Typography>
    );
  }

  return (
    <Box>
      {!hideTitle && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "study_information" })}
        </Typography>
      )}

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">{study.patientName}</Typography>
        <Typography variant="body2" color="textSecondary">
          {study.age} {intl.formatMessage({ id: "years" })} ·{" "}
          {intl.formatMessage({
            id: `gender_${(study.gender || "Unknown").toLowerCase()}`,
            defaultMessage: study.gender,
          })}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={study.id} color="primary" />
          <Chip
            size="small"
            label={intl.formatMessage({
              id: `study_status_${study.status.toLowerCase()}`,
            })}
            sx={{
              bgcolor: `${getStudyStatusColor(study.status)}22`,
              color: getStudyStatusColor(study.status),
            }}
          />
        </Box>
      </Card>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {intl.formatMessage({ id: "modality" })}
          </Typography>
          <Typography>{study.modality}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {intl.formatMessage({ id: "uploaded_at" })}
          </Typography>
          <Typography>
            {intl.formatDate(new Date(study.uploadedAt), {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {intl.formatMessage({ id: "ai_result" })}
          </Typography>
          <ConfidenceChip
            label={study.prediction.label}
            confidence={study.prediction.confidence}
          />
        </Box>
      </Stack>

      <Stack spacing={1} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate(`/studies/${study.id}`)}
        >
          {intl.formatMessage({ id: "open_study_detail" })}
        </Button>
        {onEdit && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<EditIcon />}
            onClick={onEdit}
            disabled={mutating}
          >
            {intl.formatMessage({ id: "edit_study" })}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            disabled={mutating}
          >
            {intl.formatMessage({ id: "delete_study" })}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default StudyDetailCard;
