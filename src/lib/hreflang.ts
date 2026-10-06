import type { Locale } from "./strings";

// hreflang helper — defined for i18n readiness, not yet used by any page.
export const SUPPORTED_LOCALES: Locale[] = ["en"];

export interface HreflangLink {
  lang: Locale;
  href: string;
}

export function hreflangLinks(
  path: string,
  locales: Locale[] = SUPPORTED_LOCALES,
): HreflangLink[] {
  return locales.map((lang) => ({
    lang,
    href: lang === "en" ? path : `/${lang}${path}`,
  }));
}
