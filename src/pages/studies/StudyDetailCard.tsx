import {
  Box,
  Button,
  Card,
  Chip,
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
import ConfidenceChip from "../../components/shared/ConfidenceChip";

interface StudyDetailCardProps {
  selectedStudyId?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const StudyDetailCard = ({
  selectedStudyId,
  onEdit,
  onDelete,
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
      <Typography color="textSecondary" sx={{ textAlign: "center", mt: 2 }}>
        {intl.formatMessage({ id: "no_study_selected" })}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Card variant="outlined" sx={{ p: 1.5, flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {study.patientName}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {study.age} {intl.formatMessage({ id: "years" })} ·{" "}
          {intl.formatMessage({
            id: `gender_${(study.gender || "Unknown").toLowerCase()}`,
            defaultMessage: study.gender,
          })}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={study.id} color="primary" />
          {study.review?.decision === "overridden" ? (
            <Chip
              size="small"
              color="warning"
              label={intl.formatMessage(
                { id: "review_badge_overridden" },
                { label: study.review.finalLabel.replace(/_/g, " ") }
              )}
              sx={{ fontWeight: 600 }}
            />
          ) : study.review?.decision === "accepted" ? (
            <Chip
              size="small"
              color="success"
              label={intl.formatMessage({ id: "review_badge_accepted" })}
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
        </Box>
      </Card>

      <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
        <Box>
          <Typography variant="caption" color="textSecondary">
            {intl.formatMessage({ id: "modality" })}
          </Typography>
          <Typography variant="body2">{study.modality}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            {intl.formatMessage({ id: "uploaded_at" })}
          </Typography>
          <Typography variant="body2">
            {intl.formatDate(new Date(study.uploadedAt), {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
            {intl.formatMessage({ id: "ai_result" })}
          </Typography>
          <ConfidenceChip
            label={study.prediction.label}
            confidence={study.prediction.confidence}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block">
            {intl.formatMessage({ id: "clinical_review" })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {intl.formatMessage({ id: "clinical_review_open_detail_hint" })}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          variant="contained"
          fullWidth
          size="small"
          onClick={() => navigate(`/studies/${study.id}`)}
        >
          {intl.formatMessage({ id: "open_study_detail" })}
        </Button>
        {onEdit && (
          <Button
            variant="outlined"
            fullWidth
            size="small"
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
            size="small"
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
