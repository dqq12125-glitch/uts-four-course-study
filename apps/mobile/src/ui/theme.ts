import { useColorScheme } from "react-native";

interface AppThemeDefinition {
  isDark: boolean;
  accent: string;
  accentPressed: string;
  amber: string;
  danger: string;
  success: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  muted: string;
  line: string;
  inverted: string;
  warningSurface: string;
  dangerSurface: string;
  course: Record<
    "ocean" | "forest" | "amber" | "violet" | "rose" | "slate",
    string
  >;
}

const shared = {
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
};

export const lightTheme: AppThemeDefinition = {
  ...shared,
  isDark: false,
  canvas: "#F4F1E9",
  surface: "#FFFEFA",
  surfaceMuted: "#EBEEE7",
  ink: "#17211B",
  muted: "#667168",
  line: "#D7DDD5",
  inverted: "#F7FAF7",
  warningSurface: "#FFF4D9",
  dangerSurface: "#FDEAE5",
};

export const darkTheme: AppThemeDefinition = {
  ...shared,
  isDark: true,
  canvas: "#111813",
  surface: "#1A231C",
  surfaceMuted: "#232E26",
  ink: "#EDF4EE",
  muted: "#A8B5AB",
  line: "#354139",
  inverted: "#101813",
  warningSurface: "#302818",
  dangerSurface: "#30201D",
};

export type AppTheme = AppThemeDefinition;

export function useAppTheme(): AppTheme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}

export function courseColour(
  theme: AppTheme,
  key: string | null | undefined,
): string {
  return theme.course[key as keyof AppTheme["course"]] ?? theme.course.slate;
}
