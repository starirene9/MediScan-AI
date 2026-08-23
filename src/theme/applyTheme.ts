import { ACTIVE_THEME } from "./config";
import { getActivePalette } from "./palettes";

export const applyTheme = (themeId = ACTIVE_THEME) => {
  const palette = getActivePalette(themeId);
  const root = document.documentElement;

  Object.entries(palette.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.dataset.theme = themeId;
};
