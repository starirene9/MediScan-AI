export const FINDING_COLORS: Record<string, string> = {
  Normal: "#006400",
  Nodule: "#DC143C",
  Pneumonia: "#FF4500",
  Other: "#1E90FF",
};

export const getFindingColor = (label: string): string => {
  return FINDING_COLORS[label] ?? "#8884d8";
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
};

export const languageButtons = ["🇰🇷 한국어", "🇺🇸 Eng", "🇪🇸 Esp"];
export const languageCodes = ["ko", "en", "es"];

export const getStudyStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "abnormal":
      return "#DC143C";
    case "normal":
      return "#006400";
    case "pending":
      return "#1E90FF";
    case "reviewed":
      return "#666";
    default:
      return "#888";
  }
};

export const studyStatusOptions = ["Pending", "Reviewed", "Abnormal", "Normal"];
