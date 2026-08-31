import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { applyTheme } from "./theme/applyTheme";
import { ACTIVE_THEME } from "./theme/config";
import { COLOR_MODE_STORAGE_KEY, type ColorMode } from "./theme/colorMode";

const storedMode = (() => {
  try {
    const item = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return item ? (JSON.parse(item) as ColorMode) : "light";
  } catch {
    return "light";
  }
})();

applyTheme(ACTIVE_THEME, storedMode === "dark" ? "dark" : "light");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
