'use client';

import { useTranslationContext, Locale } from '@/contexts/TranslationContext';

export function useTranslation() {
  const { locale, setLocale, t, tDynamic, isLoading, error } = useTranslationContext();

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return {
    locale,
    language: locale, // Alias for backward compatibility
    t,
    tDynamic,
    changeLanguage,
    isLoading,
    error,
  };
}

export type { Locale };
