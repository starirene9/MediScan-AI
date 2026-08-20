import { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useIntl } from "react-intl";

interface ImageUploadZoneProps {
  imageUrl: string | null;
  onImageChange: (url: string) => void;
  label?: string;
}

const ImageUploadZone = ({
  imageUrl,
  onImageChange,
  label,
}: ImageUploadZoneProps) => {
  const intl = useIntl();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        onImageChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      readImageFile(file);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      readImageFile(file);
    }
  };

  return (
    <Box>
      {label && (
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, color: "var(--color-navy)" }}
        >
          {label}
        </Typography>
      )}
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        sx={{
          border: `2px dashed ${isDragging ? "#1976d2" : "gray"}`,
          height: 360,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "center",
          px: 2,
          overflow: "hidden",
          borderRadius: 1,
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt="X-ray"
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <Typography color="textSecondary">
            {intl.formatMessage({ id: "upload_hint" })}
          </Typography>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
      </Box>
    </Box>
  );
};

export default ImageUploadZone;
