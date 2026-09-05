import { useEffect, useState } from "react";
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
import { useIntl } from "react-intl";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import { saveStudyToWorklist } from "../../features/studies/studies-slice";
import ImageUploadZone from "../../components/shared/ImageUploadZone";
import ImageViewer from "../../components/shared/ImageViewer";
import PredictionPanel from "../../components/shared/PredictionPanel";
import useSpeechToText from "../../hooks/useSpeechToText";
import { runAnalysis } from "../../services/analysisService";
import { AnalysisRequestError, fetchHealth } from "../../services/apiClient";
import { useAnalysisProgress } from "../../hooks/useAnalysisProgress";
import { GradCamMeta, Prediction } from "../../types/study";

const XrayUpload = () => {
  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientNameError, setPatientNameError] = useState(false);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [gradCamUrl, setGradCamUrl] = useState<string | null>(null);
  const [gradCamMeta, setGradCamMeta] = useState<GradCamMeta | null>(null);
  const [listening, setListening] = useState(false);
  const [modelReady, setModelReady] = useState(true);
  const { elapsedSeconds, phaseMessageId, showFirstRunHint } = useAnalysisProgress(
    analyzing,
    modelReady
  );
  const { startListening, stopListening } = useSpeechToText((text) =>
    setNotes((prev) => prev + text)
  );

  const displayImageUrl = serverImageUrl || previewUrl;
  const hasImage = Boolean(previewUrl || file);
  const hasPatientName = patientName.trim().length > 0;
  const canAnalyze = hasImage && !analyzing;

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const pollHealth = async () => {
      try {
        const health = await fetchHealth();
        if (cancelled) return;
        setModelReady(health.modelReady);
        if (!health.modelReady) {
          timer = window.setTimeout(pollHealth, 5000);
        }
      } catch {
        if (!cancelled) setModelReady(true);
      }
    };

    void pollHealth();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!hasImage || !previewUrl) {
      setError(intl.formatMessage({ id: "upload_requires_image" }));
      return;
    }
    if (!hasPatientName) {
      setPatientNameError(true);
      return;
    }
    setAnalyzing(true);
    setError(null);
    setPrediction(null);
    setGradCamUrl(null);
    setGradCamMeta(null);
    setServerImageUrl(null);
    try {
      const result = await runAnalysis({
        file,
        previewUrl,
        patientName: patientName.trim(),
        notes,
      });
      setPrediction(result.prediction);
      setGradCamUrl(result.gradCamUrl);
      setGradCamMeta(result.gradCamMeta);
      setServerImageUrl(result.imageUrl);
    } catch (err) {
      if (err instanceof AnalysisRequestError) {
        setError(
          intl.formatMessage({
            id: err.code === "timeout" ? "analyze_timeout" : "analyze_failed",
          })
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : intl.formatMessage({ id: "analyze_failed" })
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveStudy = async () => {
    if (!prediction || !displayImageUrl) return;
    if (!hasPatientName) {
      setPatientNameError(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const study = await dispatch(
        saveStudyToWorklist({
          patientId: null,
          patientName: patientName.trim(),
          age: 0,
          gender: "Unknown",
          modality: "Chest X-ray",
          status: "Pending",
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
      <Box>
        <Typography variant="h6" sx={{ color: "var(--color-navy)" }}>
          {intl.formatMessage({ id: "upload_xray" })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!modelReady && !analyzing && (
        <Alert severity="info">
          {intl.formatMessage({ id: "analyze_warming_hint" })}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minWidth: 0,
            }}
          >
            <ImageUploadZone
              fillHeight
              imageUrl={previewUrl}
              onImageChange={(url, selectedFile) => {
                setPreviewUrl(url);
                setFile(selectedFile);
                setPrediction(null);
                setGradCamUrl(null);
                setGradCamMeta(null);
                setServerImageUrl(null);
                setError(null);
              }}
              label={intl.formatMessage({ id: "upload_xray_image" })}
            />
            <TextField
              fullWidth
              required
              label={intl.formatMessage({ id: "patient_name" })}
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (e.target.value.trim()) setPatientNameError(false);
              }}
              sx={{ mt: 2 }}
              size="small"
              error={patientNameError && !hasPatientName}
              helperText={
                patientNameError && !hasPatientName
                  ? intl.formatMessage({ id: "upload_requires_patient_name" })
                  : " "
              }
            />
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={!canAnalyze}
              onClick={handleAnalyze}
            >
              {analyzing
                ? intl.formatMessage({ id: "analyzing" })
                : intl.formatMessage({ id: "run_ai_analysis" })}
            </Button>
          </Paper>

          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minWidth: 0,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, color: "var(--color-navy)" }}
            >
              {intl.formatMessage({ id: "ai_prediction" })}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <PredictionPanel
                prediction={prediction}
                loading={analyzing}
                loadingMessageId={phaseMessageId}
                loadingHintId={
                  showFirstRunHint ? "analyze_first_run_hint" : undefined
                }
                elapsedSeconds={elapsedSeconds}
              />
            </Box>
          </Paper>
        </Box>

        {prediction && displayImageUrl && (
          <Paper sx={{ p: 2, width: "100%" }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, color: "var(--color-navy)" }}
            >
              {intl.formatMessage({ id: "gradcam_preview" })}
            </Typography>
            <ImageViewer
              imageUrl={displayImageUrl}
              gradCamUrl={gradCamUrl}
              gradCamMeta={gradCamMeta}
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
  );
};

export default XrayUpload;
