import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import BiotechIcon from "@mui/icons-material/Biotech";
import { useIntl } from "react-intl";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import { saveStudyToWorklist } from "../../features/studies/studies-slice";
import ImageUploadZone from "../../components/shared/ImageUploadZone";
import ImageViewer from "../../components/shared/ImageViewer";
import PredictionPanel from "../../components/shared/PredictionPanel";
import useSpeechToText from "../../hooks/useSpeechToText";
import { runAnalysis } from "../../services/mockAiService";
import { FEATURES } from "../../config/features";
import { Prediction } from "../../types/study";

const XrayUpload = () => {
  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [gradCamUrl, setGradCamUrl] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const { startListening, stopListening } = useSpeechToText((text) =>
    setNotes((prev) => prev + text)
  );

  const displayImageUrl = serverImageUrl || previewUrl;

  const handleAnalyze = async () => {
    if (!previewUrl) return;
    setAnalyzing(true);
    setError(null);
    setPrediction(null);
    setGradCamUrl(null);
    setServerImageUrl(null);
    try {
      const result = await runAnalysis({
        file,
        previewUrl,
        patientName,
        notes,
      });
      setPrediction(result.prediction);
      setGradCamUrl(result.gradCamUrl);
      setServerImageUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveStudy = async () => {
    if (!prediction || !displayImageUrl) return;
    setSaving(true);
    setError(null);
    try {
      const study = await dispatch(
        saveStudyToWorklist({
          patientId: null,
          patientName: patientName || "Unknown Patient",
          age: 0,
          gender: "Unknown",
          modality: "Chest X-ray",
          status: prediction.label === "Normal" ? "Normal" : "Abnormal",
          prediction,
          imageUrl: serverImageUrl || displayImageUrl,
          gradCamUrl,
          notes,
        })
      ).unwrap();
      navigate(`/studies/${study.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save study");
    } finally {
      setSaving(false);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <BiotechIcon sx={{ color: "var(--color-navy)" }} />
        <Typography variant="h6" sx={{ color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "upload_xray" })}
        </Typography>
      </Box>

      <Alert severity={FEATURES.USE_MOCK_AI ? "info" : "success"} sx={{ py: 0.5 }}>
        {intl.formatMessage({
          id: FEATURES.USE_MOCK_AI ? "mock_ai_notice" : "api_ai_notice",
        })}
      </Alert>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, flex: 1 }}>
        <Paper sx={{ flex: "1 1 45%", p: 2, minWidth: 280 }}>
          <ImageUploadZone
            imageUrl={previewUrl}
            onImageChange={(url, selectedFile) => {
              setPreviewUrl(url);
              setFile(selectedFile);
              setPrediction(null);
              setGradCamUrl(null);
              setServerImageUrl(null);
              setError(null);
            }}
            label={intl.formatMessage({ id: "upload_xray_image" })}
          />
          <TextField
            fullWidth
            label={intl.formatMessage({ id: "patient_name" })}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            sx={{ mt: 2 }}
            size="small"
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!previewUrl || analyzing}
            onClick={handleAnalyze}
          >
            {analyzing
              ? intl.formatMessage({ id: "analyzing" })
              : intl.formatMessage({ id: "run_ai_analysis" })}
          </Button>
        </Paper>

        <Box
          sx={{
            flex: "1 1 45%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 280,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, color: "var(--color-navy)" }}
            >
              {intl.formatMessage({ id: "ai_prediction" })}
            </Typography>
            <PredictionPanel prediction={prediction} loading={analyzing} />
          </Paper>

          {prediction && displayImageUrl && (
            <Paper sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, color: "var(--color-navy)" }}
              >
                {intl.formatMessage({ id: "gradcam_preview" })}
              </Typography>
              <ImageViewer
                imageUrl={displayImageUrl}
                gradCamUrl={gradCamUrl}
              />
            </Paper>
          )}

          <Paper sx={{ p: 2, position: "relative" }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, color: "var(--color-navy)" }}
            >
              {intl.formatMessage({ id: "radiologist_notes" })}
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={intl.formatMessage({ id: "notes_placeholder" })}
            />
            <Tooltip title={listening ? "Stop" : "Voice input"}>
              <IconButton
                onClick={toggleMic}
                sx={{ position: "absolute", bottom: 16, right: 16 }}
              >
                {listening ? (
                  <StopIcon color="error" />
                ) : (
                  <MicIcon color="primary" />
                )}
              </IconButton>
            </Tooltip>
          </Paper>

          {prediction && (
            <Button
              variant="contained"
              color="success"
              disabled={saving}
              onClick={handleSaveStudy}
            >
              {intl.formatMessage({ id: "save_to_worklist" })}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default XrayUpload;
