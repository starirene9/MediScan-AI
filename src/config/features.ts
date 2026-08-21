/**
 * Feature flags for branch-based development.
 *
 * - USE_MOCK_AI: false → call FastAPI via Vite proxy (/api, /uploads)
 * - ENABLE_GRADCAM_API: reserved for dedicated Grad-CAM endpoint later
 */
export const FEATURES = {
  USE_MOCK_AI: false,
  ENABLE_GRADCAM_API: false,
} as const;

export const APP_NAME = "MediScan AI";
