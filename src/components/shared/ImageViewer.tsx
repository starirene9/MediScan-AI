import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";

interface ImageViewerProps {
  imageUrl: string | null;
  gradCamUrl?: string | null;
}

const ImageViewer = ({ imageUrl, gradCamUrl }: ImageViewerProps) => {
  const intl = useIntl();
  const [view, setView] = useState<"original" | "gradcam" | "overlay">(
    "original"
  );

  if (!imageUrl) {
    return (
      <Box
        sx={{
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
          borderRadius: 1,
        }}
      >
        <Typography color="textSecondary">
          {intl.formatMessage({ id: "no_image" })}
        </Typography>
      </Box>
    );
  }

  const displayUrl =
    view === "gradcam" && gradCamUrl ? gradCamUrl : imageUrl;

  return (
    <Box>
      {gradCamUrl && (
        <ToggleButtonGroup
          size="small"
          value={view}
          exclusive
          onChange={(_, val) => val && setView(val)}
          sx={{ mb: 1 }}
        >
          <ToggleButton value="original">
            {intl.formatMessage({ id: "view_original" })}
          </ToggleButton>
          <ToggleButton value="gradcam">
            {intl.formatMessage({ id: "view_gradcam" })}
          </ToggleButton>
          <ToggleButton value="overlay">
            {intl.formatMessage({ id: "view_overlay" })}
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      <Box
        sx={{
          height: 360,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "grey.900",
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {view === "overlay" && gradCamUrl ? (
          <>
            <Box
              component="img"
              src={imageUrl}
              alt="Original X-ray"
              sx={{
                position: "absolute",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
            <Box
              component="img"
              src={gradCamUrl}
              alt="Grad-CAM overlay"
              sx={{
                position: "absolute",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                opacity: 0.55,
              }}
            />
          </>
        ) : (
          <Box
            component="img"
            src={displayUrl}
            alt={view === "gradcam" ? "Grad-CAM" : "X-ray"}
            sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ImageViewer;
