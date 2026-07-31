import { useCallback } from "react";
import { useSession } from "@/src/auth/session-context";

export type MobileLanguage = "zh-CN" | "en";

function deviceLanguage(): MobileLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export function mobileCopy(
  language: MobileLanguage,
  chinese: string,
  english: string,
): string {
  return language === "zh-CN" ? chinese : english;
}

export function useCopy(): {
  language: MobileLanguage;
  t(chinese: string, english: string): string;
  locale: "zh-CN" | "en-AU";
} {
  const { user } = useSession();
  const language = user?.preferredLanguage ?? deviceLanguage();
  const t = useCallback(
    (chinese: string, english: string) =>
      mobileCopy(language, chinese, english),
    [language],
  );
  return {
    language,
    t,
    locale: language === "zh-CN" ? "zh-CN" : "en-AU",
  };
}
