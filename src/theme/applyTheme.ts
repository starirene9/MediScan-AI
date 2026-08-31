import { ACTIVE_THEME } from "./config";
import type { ColorMode } from "./colorMode";
import { darkCssOverrides } from "./darkPalette";
import { getActivePalette } from "./palettes";

export const applyTheme = (
  themeId = ACTIVE_THEME,
  mode: ColorMode = "light"
) => {
  const palette = getActivePalette(themeId);
  const root = document.documentElement;

  Object.entries(palette.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (mode === "dark") {
    Object.entries(darkCssOverrides).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  } else {
    // Drop dark-only inline overrides so :root / palette values apply again
    Object.keys(darkCssOverrides).forEach((key) => {
      if (!(key in palette.cssVars)) {
        root.style.removeProperty(key);
      }
    });
  }

  root.dataset.theme = themeId;
  root.dataset.colorMode = mode;
  root.style.colorScheme = mode;
};
