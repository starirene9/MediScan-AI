/**
 * Feature flags for branch-based development.
 *
 * Branch strategy:
 * - refactor/mediscan-foundation  → UI only, mocks enabled (current)
 * - feature/fastapi-backend       → USE_MOCK_AI = false, wire real API
 * - feature/gradcam-viewer        → ENABLE_GRADCAM_API = true
 */
export const FEATURES = {
  USE_MOCK_AI: true,
  ENABLE_GRADCAM_API: false,
} as const;

export const APP_NAME = "MediScan AI";
