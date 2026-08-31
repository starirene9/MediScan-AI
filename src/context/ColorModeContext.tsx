import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import useLocalStorage from "../hooks/useLocalStorage";
import { applyTheme } from "../theme/applyTheme";
import { ACTIVE_THEME } from "../theme/config";
import {
  COLOR_MODE_STORAGE_KEY,
  type ColorMode,
} from "../theme/colorMode";
import { createAppTheme } from "../theme/muiTheme";
import { getActivePalette } from "../theme/palettes";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useLocalStorage<ColorMode>(
    COLOR_MODE_STORAGE_KEY,
    "light"
  );

  useEffect(() => {
    applyTheme(ACTIVE_THEME, mode);
  }, [mode]);

  const setColorMode = useCallback(
    (next: ColorMode) => {
      setMode(next);
    },
    [setMode]
  );

  const toggleColorMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  const theme = useMemo(
    () => createAppTheme(getActivePalette(ACTIVE_THEME), mode),
    [mode]
  );

  const value = useMemo(
    () => ({ mode, toggleColorMode, setColorMode }),
    [mode, toggleColorMode, setColorMode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ColorModeProvider");
  }
  return ctx;
};
