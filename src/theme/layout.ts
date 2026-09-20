/** Shared app chrome dimensions (header h-20, footer h-12, nav w-44 / w-22). */
export const LAYOUT = {
  headerHeight: "5rem",
  footerHeight: "3rem",
  footerHeightPx: 48,
  /** Matches Tailwind `w-44` / `ml-44` when the side nav is expanded. */
  navWidthOpen: "11rem",
  /** Matches Tailwind `w-22` / `ml-22` when the side nav is collapsed. */
  navWidthClosed: "5.5rem",
} as const;
