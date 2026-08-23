import type { ThemeId } from "./config";

export type CssVarMap = Record<string, string>;

export interface AppPalette {
  id: ThemeId;
  label: string;
  cssVars: CssVarMap;
  mui: {
    primary: string;
    primaryDark: string;
    secondary: string;
    background: string;
    paper: string;
    textPrimary: string;
    textSecondary: string;
    error: string;
    success: string;
  };
  status: {
    abnormal: string;
    normal: string;
    pending: string;
    reviewed: string;
    default: string;
  };
}

/** Previous MediScan palette (Bootstrap/admin-style blues + gray chrome). */
export const legacyPalette: AppPalette = {
  id: "legacy",
  label: "Legacy",
  cssVars: {
    "--color-navy": "#3c4b64",
    "--color-dark-navy": "#2b3648",
    "--color-light-navy": "#4f5d75",
    "--color-azure": "#0080ff",
    "--color-accent": "#0080ff",
    "--color-primary": "#007bff",
    "--color-primary-hover": "#0056b3",
    "--color-shell": "#1e40af",
    "--color-nav": "#1f2937",
    "--color-nav-hover": "#374151",
    "--color-nav-toggle": "#111827",
    "--color-nav-toggle-hover": "#374151",
    "--layout-footer-height": "3rem",
    "--color-footer": "#111827",
    "--color-surface": "#f3f4f6",
    "--color-muted": "#6c757d",
    "--color-border": "#dee2e6",
    "--color-white": "#ffffff",
    "--color-black": "#000000",
    "--color-light-silver": "#dee2e6",
    "--color-abnormal": "#DC143C",
    "--color-normal": "#006400",
  },
  mui: {
    primary: "#007bff",
    primaryDark: "#0056b3",
    secondary: "#0080ff",
    background: "#f3f4f6",
    paper: "#ffffff",
    textPrimary: "#3c4b64",
    textSecondary: "#6c757d",
    error: "#DC143C",
    success: "#006400",
  },
  status: {
    abnormal: "#DC143C",
    normal: "#006400",
    pending: "#1E90FF",
    reviewed: "#666666",
    default: "#888888",
  },
};

/** Clinical Slate — calm medical SaaS palette. */
export const clinicalSlatePalette: AppPalette = {
  id: "clinical-slate",
  label: "Clinical Slate",
  cssVars: {
    "--color-navy": "#0F172A",
    "--color-dark-navy": "#020617",
    "--color-light-navy": "#334155",
    "--color-azure": "#14B8A6",
    "--color-accent": "#14B8A6",
    "--color-primary": "#0F766E",
    "--color-primary-hover": "#115E59",
    "--color-shell": "#1E293B",
    "--color-nav": "#1E293B",
    "--color-nav-hover": "#334155",
    "--color-nav-toggle": "#0F172A",
    "--color-nav-toggle-hover": "#1E293B",
    "--layout-footer-height": "3rem",
    "--color-footer": "#1E293B",
    "--color-surface": "#F8FAFC",
    "--color-muted": "#64748B",
    "--color-border": "#E2E8F0",
    "--color-white": "#ffffff",
    "--color-black": "#0F172A",
    "--color-light-silver": "#E2E8F0",
    "--color-abnormal": "#DC2626",
    "--color-normal": "#16A34A",
  },
  mui: {
    primary: "#0F766E",
    primaryDark: "#115E59",
    secondary: "#14B8A6",
    background: "#F8FAFC",
    paper: "#ffffff",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    error: "#DC2626",
    success: "#16A34A",
  },
  status: {
    abnormal: "#DC2626",
    normal: "#16A34A",
    pending: "#0F766E",
    reviewed: "#64748B",
    default: "#94A3B8",
  },
};

export const palettes: Record<ThemeId, AppPalette> = {
  legacy: legacyPalette,
  "clinical-slate": clinicalSlatePalette,
};

export const getActivePalette = (themeId: ThemeId): AppPalette => palettes[themeId];
