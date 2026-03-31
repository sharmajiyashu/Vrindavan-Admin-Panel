"use client";

import * as React from "react";
import {
  getStoredLocale,
  setStoredLocale,
  type Locale,
} from "@/lib/locale";
import { messages } from "@/lib/i18n/messages";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function getMessage(locale: Locale, key: string): string {
  const localeMessages = messages[locale];
  if (localeMessages && key in localeMessages) return localeMessages[key] ?? key;
  const enMessages = messages.en;
  if (enMessages && key in enMessages) return enMessages[key] ?? key;
  return key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  React.useEffect(() => {
    setStoredLocale(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "kh" ? "km" : "en";
    }
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = React.useCallback(
    (key: string) => getMessage(locale, key),
    [locale]
  );

  const value = React.useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function useTranslations(): { t: (key: string) => string; locale: Locale } {
  const { t, locale } = useLanguage();
  return { t, locale };
}
