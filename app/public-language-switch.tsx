"use client";

import { useRouter } from "next/navigation";
import {
  PUBLIC_LOCALE_COOKIE,
  type PublicLocale,
} from "@/src/lib/public-locale";

export function PublicLanguageSwitch({
  language,
}: {
  language: PublicLocale;
}) {
  const router = useRouter();
  const nextLanguage: PublicLocale =
    language === "zh-CN" ? "en" : "zh-CN";

  function switchLanguage() {
    document.cookie = `${PUBLIC_LOCALE_COOKIE}=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang =
      nextLanguage === "zh-CN" ? "zh-CN" : "en-AU";
    router.refresh();
  }

  return (
    <button
      className="public-language-switch"
      type="button"
      onClick={switchLanguage}
      aria-label={
        language === "zh-CN"
          ? "切换网站语言为英文"
          : "Switch website language to Chinese"
      }
    >
      {language === "zh-CN" ? "English" : "中文"}
    </button>
  );
}

