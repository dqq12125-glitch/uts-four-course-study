import type { SupportedLanguage } from "@/src/lib/i18n";

export type PublicLocale = SupportedLanguage;

export const PUBLIC_LOCALE_COOKIE = "deepstudy_locale";

export function normalizePublicLocale(
  value: string | null | undefined,
): PublicLocale | null {
  if (value === "zh-CN" || value === "en") return value;
  return null;
}

export function localeFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): PublicLocale {
  if (!acceptLanguage) return "en";

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;
      return {
        tag: rawTag.toLowerCase(),
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
        index,
      };
    })
    .filter((entry) => entry.quality > 0)
    .sort(
      (left, right) =>
        right.quality - left.quality || left.index - right.index,
    );

  for (const preference of preferences) {
    if (
      preference.tag === "zh" ||
      preference.tag.startsWith("zh-")
    ) {
      return "zh-CN";
    }
    if (
      preference.tag === "en" ||
      preference.tag.startsWith("en-")
    ) {
      return "en";
    }
  }

  return "en";
}

export function resolvePublicLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): PublicLocale {
  return (
    normalizePublicLocale(input.cookieLocale) ??
    localeFromAcceptLanguage(input.acceptLanguage)
  );
}

