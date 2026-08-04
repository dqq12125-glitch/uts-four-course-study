import { useColorScheme } from "react-native";
import { deepStudyColours } from "@deepstudy/ui";

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
  accent: deepStudyColours.accent,
  accentPressed: deepStudyColours.accentPressed,
  amber: deepStudyColours.amber,
  danger: deepStudyColours.danger,
  success: deepStudyColours.success,
  course: deepStudyColours.course,
};

export const lightTheme: AppThemeDefinition = {
  ...shared,
  isDark: false,
  ...deepStudyColours.light,
};

export const darkTheme: AppThemeDefinition = {
  ...shared,
  isDark: true,
  ...deepStudyColours.dark,
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
