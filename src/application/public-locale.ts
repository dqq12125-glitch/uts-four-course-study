import { cookies, headers } from "next/headers";
import {
  PUBLIC_LOCALE_COOKIE,
  resolvePublicLocale,
  type PublicLocale,
} from "@/src/lib/public-locale";

export async function getPublicLocale(): Promise<PublicLocale> {
  const [cookieStore, headerStore] = await Promise.all([
    cookies(),
    headers(),
  ]);

  return resolvePublicLocale({
    cookieLocale: cookieStore.get(PUBLIC_LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
}

