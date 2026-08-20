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
import { addStudy } from "../../features/studies/studies-slice";
import { Study } from "../../types/study";
import ImageUploadZone from "../../components/shared/ImageUploadZone";
import ImageViewer from "../../components/shared/ImageViewer";
import PredictionPanel from "../../components/shared/PredictionPanel";
import useSpeechToText from "../../hooks/useSpeechToText";
import { runMockAnalysis, getMockGradCamUrl } from "../../services/mockAiService";
import { Prediction } from "../../types/study";

const XrayUpload = () => {
  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [gradCamUrl, setGradCamUrl] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const { startListening, stopListening } = useSpeechToText((text) =>
    setNotes((prev) => prev + text)
  );

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    setPrediction(null);
    setGradCamUrl(null);
    try {
      const result = await runMockAnalysis(imageUrl);
      setPrediction(result);
      setGradCamUrl(getMockGradCamUrl(imageUrl, result.label));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveStudy = () => {
    if (!imageUrl || !prediction) return;
    const id = `S${Date.now().toString().slice(-6)}`;
    const newStudy: Study = {
      id,
      patientId: `P${Date.now().toString().slice(-4)}`,
      patientName: patientName || "Unknown Patient",
      age: 0,
      gender: "Unknown",
      modality: "Chest X-ray",
      uploadedAt: new Date().toISOString(),
      status: prediction.label === "Normal" ? "Normal" : "Abnormal",
      prediction,
      imageUrl,
      gradCamUrl,
      notes,
    };
    dispatch(addStudy(newStudy));
    navigate(`/studies/${id}`);
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

      <Alert severity="info" sx={{ py: 0.5 }}>
        {intl.formatMessage({ id: "mock_ai_notice" })}
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, flex: 1 }}>
        <Paper sx={{ flex: "1 1 45%", p: 2, minWidth: 280 }}>
          <ImageUploadZone
            imageUrl={imageUrl}
            onImageChange={(url) => {
              setImageUrl(url);
              setPrediction(null);
              setGradCamUrl(null);
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
            disabled={!imageUrl || analyzing}
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

          {prediction && imageUrl && (
            <Paper sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, color: "var(--color-navy)" }}
              >
                {intl.formatMessage({ id: "gradcam_preview" })}
              </Typography>
              <ImageViewer imageUrl={imageUrl} gradCamUrl={gradCamUrl} />
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
            <Button variant="contained" color="success" onClick={handleSaveStudy}>
              {intl.formatMessage({ id: "save_to_worklist" })}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default XrayUpload;
