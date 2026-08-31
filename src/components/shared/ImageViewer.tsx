import { Alert, Box, Chip, Typography, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { GradCamMeta } from "../../types/study";

interface ImageViewerProps {
  imageUrl: string | null;
  gradCamUrl?: string | null;
  gradCamMeta?: GradCamMeta | null;
}

type ViewerMode = "original" | "overlay";

const ImageViewer = ({
  imageUrl,
  gradCamUrl,
  gradCamMeta = null,
}: ImageViewerProps) => {
  const intl = useIntl();
  const theme = useTheme();
  const [view, setView] = useState<ViewerMode>(gradCamUrl ? "overlay" : "original");

  useEffect(() => {
    setView(gradCamUrl ? "overlay" : "original");
  }, [gradCamUrl]);

  if (!imageUrl) {
    return (
      <Box
        sx={{
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          borderRadius: 1,
        }}
      >
        <Typography color="textSecondary">
          {intl.formatMessage({ id: "no_image" })}
        </Typography>
      </Box>
    );
  }

  const showOverlay = view === "overlay" && Boolean(gradCamUrl);
  const badgeLeft = `${(gradCamMeta?.centroid?.x ?? 0.5) * 100}%`;
  const badgeTop = `${(gradCamMeta?.centroid?.y ?? 0.35) * 100}%`;

  return (
    <Box>
      {gradCamUrl ? (
        <>
          <ToggleButtonGroup
            size="small"
            value={view}
            exclusive
            onChange={(_, val: ViewerMode | null) => val && setView(val)}
            sx={{ mb: 1 }}
          >
            <ToggleButton value="original">
              {intl.formatMessage({ id: "view_original" })}
            </ToggleButton>
            <ToggleButton value="overlay">
              {intl.formatMessage({ id: "view_overlay" })}
            </ToggleButton>
          </ToggleButtonGroup>
          <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
            {intl.formatMessage({ id: "gradcam_disclaimer" })}
          </Alert>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {intl.formatMessage({ id: "gradcam_not_applicable" })}
        </Typography>
      )}
      <Box
        sx={{
          height: 360,
          bgcolor: "grey.900",
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt="Original X-ray"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        {showOverlay && gradCamUrl && (
          <>
            <Box
              component="img"
              src={gradCamUrl}
              alt="Grad-CAM overlay"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: 1,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            {gradCamMeta && (
              <Chip
                size="small"
                label={`${gradCamMeta.finding} ${Math.round(gradCamMeta.confidence * 100)}%`}
                sx={{
                  position: "absolute",
                  left: badgeLeft,
                  top: badgeTop,
                  transform: "translate(-50%, -120%)",
                  zIndex: 2,
                  fontWeight: 700,
                  pointerEvents: "none",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(15, 23, 42, 0.92)"
                      : "rgba(255, 255, 255, 0.95)",
                  color: "error.main",
                  border: "1px solid",
                  borderColor: "error.main",
                  boxShadow: theme.shadows[4],
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ImageViewer;
