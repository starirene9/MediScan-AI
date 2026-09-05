import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useIntl } from "react-intl";
import { AppDispatch, RootState } from "../../store/store";
import {
  fetchStudiesData,
  selectStudy,
  updateStudy,
} from "../../features/studies/studies-slice";
import ImageViewer from "../../components/shared/ImageViewer";
import PredictionPanel from "../../components/shared/PredictionPanel";
import StudyMetadataBar from "../../components/shared/StudyMetadataBar";
import useSpeechToText from "../../hooks/useSpeechToText";

const StudyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const { studies, loading } = useSelector((state: RootState) => state.studies);
  const study = id ? studies[id] : null;
  const [notes, setNotes] = useState("");
  const [listening, setListening] = useState(false);
  const { startListening, stopListening } = useSpeechToText((text) =>
    setNotes((prev) => prev + text)
  );

  useEffect(() => {
    dispatch(fetchStudiesData());
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(selectStudy(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (study) setNotes(study.notes);
  }, [study]);

  const handleSaveNotes = () => {
    if (study) {
      dispatch(updateStudy({ id: study.id, notes }));
    }
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
      setListening(false);
    } else {
      const started = startListening();
      if (started) setListening(true);
    }
  };

  if (loading && !study) {
    return <LinearProgress />;
  }

  if (!study && !loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography color="error" gutterBottom>
          {intl.formatMessage({ id: "study_not_found" })}
        </Typography>
        <Button onClick={() => navigate("/studies")}>
          {intl.formatMessage({ id: "back_to_worklist" })}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => navigate("/studies")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "study_detail" })} — {id}
        </Typography>
      </Box>

      {study && <StudyMetadataBar study={study} />}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, flex: 1 }}>
        <Paper sx={{ flex: "1 1 45%", p: 2, minWidth: 280 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, color: "var(--color-navy)" }}>
            {intl.formatMessage({ id: "xray_image" })}
          </Typography>
          <ImageViewer
            imageUrl={study?.imageUrl ?? null}
            gradCamUrl={study?.gradCamUrl}
            gradCamMeta={
              study?.gradCamUrl && study.prediction
                ? {
                    finding: study.prediction.label,
                    confidence: study.prediction.confidence,
                  }
                : null
            }
          />
        </Paper>

        <Box sx={{ flex: "1 1 45%", display: "flex", flexDirection: "column", gap: 2, minWidth: 280 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: "var(--color-navy)" }}>
              {intl.formatMessage({ id: "ai_prediction" })}
            </Typography>
            <PredictionPanel
              prediction={study?.prediction ?? null}
              loading={loading}
            />
          </Paper>

          <Paper sx={{ p: 2, flex: 1, position: "relative" }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: "var(--color-navy)" }}>
              {intl.formatMessage({ id: "radiologist_notes" })}
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={intl.formatMessage({ id: "notes_placeholder" })}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Tooltip title={listening ? "Stop" : "Voice input"}>
                <IconButton onClick={toggleMic}>
                  {listening ? (
                    <StopIcon color="error" />
                  ) : (
                    <MicIcon color="primary" />
                  )}
                </IconButton>
              </Tooltip>
              <Button variant="outlined" size="small" onClick={handleSaveNotes}>
                {intl.formatMessage({ id: "save_notes" })}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default StudyDetail;
