'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from './useTranslation';

interface UseDynamicTranslationResult {
  value: string;
  isLoading: boolean;
  error: string | null;
}

export function useDynamicTranslation(
  entityType: string,
  entityId: string,
  field: string,
  defaultValue: string = ''
): UseDynamicTranslationResult {
  const { tDynamic, locale } = useTranslation();
  const [value, setValue] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTranslation() {
      // If locale is 'ro' (Romanian), use default value directly
      if (locale === 'ro') {
        setValue(defaultValue);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const translated = await tDynamic(entityType, entityId, field);
        
        if (isMounted) {
          // If translation is empty or failed, fall back to default value
          setValue(translated || defaultValue);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Translation failed';
          setError(errorMessage);
          setValue(defaultValue); // Fallback to default value on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [entityType, entityId, field, defaultValue, locale, tDynamic]);

  return { value, isLoading, error };
}
