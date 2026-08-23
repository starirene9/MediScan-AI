import { Chip } from "@mui/material";
import { FindingLabel } from "../../types/study";
import { isNormalPrediction } from "../../types/study";

interface ConfidenceChipProps {
  label: FindingLabel;
  confidence: number;
}

const getChipColor = (
  label: FindingLabel
): "success" | "error" | "warning" | "default" => {
  if (isNormalPrediction(label)) return "success";
  if (label === "Pneumonia" || label === "Infiltration" || label === "Consolidation") {
    return "warning";
  }
  if (label === "Nodule" || label === "Mass") return "error";
  return "default";
};

const ConfidenceChip = ({ label, confidence }: ConfidenceChipProps) => {
  const percent = Math.round(confidence * 100);
  const display = label.replace(/_/g, " ");
  return (
    <Chip
      label={`${display} (${percent}%)`}
      color={getChipColor(label)}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

export default ConfidenceChip;
