import { createTheme } from "@mui/material/styles";
import type { AppPalette } from "./palettes";

export const createAppTheme = (palette: AppPalette) =>
  createTheme({
    palette: {
      primary: {
        main: palette.mui.primary,
        dark: palette.mui.primaryDark,
      },
      secondary: {
        main: palette.mui.secondary,
      },
      background: {
        default: palette.mui.background,
        paper: palette.mui.paper,
      },
      text: {
        primary: palette.mui.textPrimary,
        secondary: palette.mui.textSecondary,
      },
      error: {
        main: palette.mui.error,
      },
      success: {
        main: palette.mui.success,
      },
    },
    typography: {
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
  });
