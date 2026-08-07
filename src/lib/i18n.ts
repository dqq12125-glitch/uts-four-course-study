export type SupportedLanguage = "zh-CN" | "en";

export function copy(
  language: SupportedLanguage,
  chinese: string,
  english: string,
): string {
  return language === "zh-CN" ? chinese : english;
}

export function locale(language: SupportedLanguage): "zh-CN" | "en-AU" {
  return language === "zh-CN" ? "zh-CN" : "en-AU";
}
