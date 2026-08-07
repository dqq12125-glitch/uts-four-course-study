export const deepStudyColours = {
  accent: "#2D7A57",
  accentPressed: "#205E42",
  amber: "#B66A15",
  danger: "#B8483E",
  success: "#2D7A57",
  course: {
    ocean: "#367A91",
    forest: "#4B7758",
    amber: "#A66B28",
    violet: "#6D5A8B",
    rose: "#9B5865",
    slate: "#64727A",
  },
  light: {
    canvas: "#F4F1E9",
    surface: "#FFFEFA",
    surfaceMuted: "#EBEEE7",
    ink: "#17211B",
    muted: "#667168",
    line: "#D7DDD5",
    inverted: "#F7FAF7",
    warningSurface: "#FFF4D9",
    dangerSurface: "#FDEAE5",
  },
  dark: {
    canvas: "#111813",
    surface: "#1A231C",
    surfaceMuted: "#232E26",
    ink: "#EDF4EE",
    muted: "#A8B5AB",
    line: "#354139",
    inverted: "#101813",
    warningSurface: "#302818",
    dangerSurface: "#30201D",
  },
} as const;

export const deepStudySpacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const deepStudyRadii = {
  small: 8,
  medium: 12,
  large: 18,
  pill: 999,
} as const;

export const primaryNavigation = [
  { id: "today", labelKey: "navigation.today" },
  { id: "courses", labelKey: "navigation.courses" },
  { id: "practice", labelKey: "navigation.practice" },
  { id: "tools", labelKey: "navigation.tools" },
  { id: "progress", labelKey: "navigation.progress" },
] as const;

export type PrimaryNavigationId = (typeof primaryNavigation)[number]["id"];
export type NavigationPlacement = "desktop-sidebar" | "mobile-bottom-bar";
