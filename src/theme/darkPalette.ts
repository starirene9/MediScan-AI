import type { CssVarMap } from "./palettes";

/** Dark-mode CSS var overrides layered on top of the active brand palette. */
export const darkCssOverrides: CssVarMap = {
  "--color-navy": "#E2E8F0",
  "--color-dark-navy": "#F8FAFC",
  "--color-light-navy": "#CBD5E1",
  "--color-azure": "#38BDF8",
  "--color-accent": "#38BDF8",
  "--color-primary": "#3B82F6",
  "--color-primary-hover": "#2563EB",
  "--color-shell": "#020617",
  "--color-nav": "#0F172A",
  "--color-nav-hover": "#1E293B",
  "--color-nav-toggle": "#020617",
  "--color-nav-toggle-hover": "#1E293B",
  "--color-footer": "#020617",
  "--color-surface": "#0B1220",
  "--color-muted": "#94A3B8",
  "--color-border": "#334155",
  "--color-white": "#F8FAFC",
  "--color-black": "#020617",
  "--color-soft-white": "#1E293B",
  "--color-light-silver": "#334155",
  "--color-gray": "#94A3B8",
  "--color-dark-gray": "#CBD5E1",
  "--color-charcoal": "#E2E8F0",
};

export const darkMuiOverrides = {
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  secondary: "#38BDF8",
  background: "#0B1220",
  paper: "#111827",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
} as const;
