export type Locale = "en" | "kh";

export const LOCALE_STORAGE_KEY = "app-locale";

const DEFAULT_LOCALE: Locale = "en";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "en" || raw === "kh") return raw;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
