import { Chip } from "@mui/material";
import { FindingLabel } from "../../types/study";

interface ConfidenceChipProps {
  label: FindingLabel;
  confidence: number;
}

const getChipColor = (
  label: FindingLabel
): "success" | "error" | "warning" | "default" => {
  switch (label) {
    case "Normal":
      return "success";
    case "Nodule":
      return "error";
    case "Pneumonia":
      return "warning";
    default:
      return "default";
  }
};

const ConfidenceChip = ({ label, confidence }: ConfidenceChipProps) => {
  const percent = Math.round(confidence * 100);
  return (
    <Chip
      label={`${label} (${percent}%)`}
      color={getChipColor(label)}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

export default ConfidenceChip;
