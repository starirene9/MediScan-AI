import { createTheme } from "@mui/material/styles";
import type { ColorMode } from "./colorMode";
import { darkMuiOverrides } from "./darkPalette";
import type { AppPalette } from "./palettes";

export const createAppTheme = (palette: AppPalette, mode: ColorMode = "light") => {
  const mui = mode === "dark" ? { ...palette.mui, ...darkMuiOverrides } : palette.mui;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: mui.primary,
        dark: mui.primaryDark,
      },
      secondary: {
        main: mui.secondary,
      },
      background: {
        default: mui.background,
        paper: mui.paper,
      },
      text: {
        primary: mui.textPrimary,
        secondary: mui.textSecondary,
      },
      error: {
        main: palette.mui.error,
      },
      success: {
        main: palette.mui.success,
      },
      divider: mode === "dark" ? "#334155" : "#dee2e6",
    },
    typography: {
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: "none",
            "&.Mui-selected": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(56, 189, 248, 0.2)"
                  : undefined,
            },
          }),
        },
      },
    },
  });
};
