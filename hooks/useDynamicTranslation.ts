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
      console.log(`[useDynamicTranslation] Fetching translation for ${entityType}/${entityId}/${field} in locale ${locale}`);
      
      // If locale is 'ro' (Romanian), use default value directly
      if (locale === 'ro') {
        console.log(`[useDynamicTranslation] Locale is 'ro', using default value:`, defaultValue);
        setValue(defaultValue);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`[useDynamicTranslation] Calling tDynamic for ${entityType}/${entityId}/${field}`);
        const translated = await tDynamic(entityType, entityId, field);
        console.log(`[useDynamicTranslation] Received translation:`, translated);
        
        if (isMounted) {
          // If translation is empty or failed, fall back to default value
          setValue(translated || defaultValue);
        }
      } catch (err) {
        console.error(`[useDynamicTranslation] Error fetching translation:`, err);
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
