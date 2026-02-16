'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslationCache } from '@/lib/TranslationCache';

export type Locale = 'ro' | 'en' | 'fr' | 'de' | 'es' | 'it';

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  tDynamic: (entityType: string, entityId: string, field: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

// Import static translations directly
import roCommon from '@/locales/ro/common.json';
import roAuth from '@/locales/ro/auth.json';
import roProducts from '@/locales/ro/products.json';
import roCart from '@/locales/ro/cart.json';
import roAdmin from '@/locales/ro/admin.json';
import roErrors from '@/locales/ro/errors.json';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enProducts from '@/locales/en/products.json';
import enCart from '@/locales/en/cart.json';
import enAdmin from '@/locales/en/admin.json';
import enErrors from '@/locales/en/errors.json';

import frCommon from '@/locales/fr/common.json';
import frAuth from '@/locales/fr/auth.json';
import frProducts from '@/locales/fr/products.json';
import frCart from '@/locales/fr/cart.json';
import frAdmin from '@/locales/fr/admin.json';
import frErrors from '@/locales/fr/errors.json';

import deCommon from '@/locales/de/common.json';
import deAuth from '@/locales/de/auth.json';
import deProducts from '@/locales/de/products.json';
import deCart from '@/locales/de/cart.json';
import deAdmin from '@/locales/de/admin.json';
import deErrors from '@/locales/de/errors.json';

import esCommon from '@/locales/es/common.json';
import esAuth from '@/locales/es/auth.json';
import esProducts from '@/locales/es/products.json';
import esCart from '@/locales/es/cart.json';
import esAdmin from '@/locales/es/admin.json';
import esErrors from '@/locales/es/errors.json';

import itCommon from '@/locales/it/common.json';
import itAuth from '@/locales/it/auth.json';
import itProducts from '@/locales/it/products.json';
import itCart from '@/locales/it/cart.json';
import itAdmin from '@/locales/it/admin.json';
import itErrors from '@/locales/it/errors.json';

// Static translations loaded from JSON files
const staticTranslations: Record<Locale, Record<string, any>> = {
  ro: {
    common: roCommon,
    auth: roAuth,
    products: roProducts,
    cart: roCart,
    admin: roAdmin,
    errors: roErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    products: enProducts,
    cart: enCart,
    admin: enAdmin,
    errors: enErrors,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    products: frProducts,
    cart: frCart,
    admin: frAdmin,
    errors: frErrors,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    products: deProducts,
    cart: deCart,
    admin: deAdmin,
    errors: deErrors,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    products: esProducts,
    cart: esCart,
    admin: esAdmin,
    errors: esErrors,
  },
  it: {
    common: itCommon,
    auth: itAuth,
    products: itProducts,
    cart: itCart,
    admin: itAdmin,
    errors: itErrors,
  },
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('ro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Locale;
    const validLanguages: Locale[] = ['ro', 'en', 'fr', 'de', 'es', 'it'];
    if (saved && validLanguages.includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  // Persist locale to localStorage and emit event
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('language', newLocale);
    // Emit languageChange event for backward compatibility
    window.dispatchEvent(new Event('languageChange'));
  }, []);

  // Static translation function with nested key support and fallback
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    
    // Try to find the translation in all modules
    const modules = Object.keys(staticTranslations[locale]);
    
    for (const module of modules) {
      let value: any = staticTranslations[locale][module];
      
      // Try to navigate through the keys
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }
      
      // If found in this module, use it
      if (value && typeof value === 'string') {
        let result = value;
        
        // Replace parameters if provided
        if (params) {
          Object.entries(params).forEach(([paramKey, paramValue]) => {
            result = result.replace(`{{${paramKey}}}`, paramValue);
          });
        }
        
        return result;
      }
    }

    // If key doesn't have a module prefix, search for the key directly in all modules
    if (!key.includes('.')) {
      for (const module of modules) {
        const moduleData = staticTranslations[locale][module];
        if (moduleData && typeof moduleData === 'object') {
          if (key in moduleData) {
            const moduleValue = moduleData[key];
            if (typeof moduleValue === 'string') {
              let result = moduleValue;
              if (params) {
                Object.entries(params).forEach(([paramKey, paramValue]) => {
                  result = result.replace(`{{${paramKey}}}`, paramValue);
                });
              }
              return result;
            }
          }
        }
      }
    }

    // Fallback to Romanian if current locale is not Romanian
    if (locale !== 'ro') {
      const roModules = Object.keys(staticTranslations['ro']);
      
      for (const module of roModules) {
        let fallbackValue: any = staticTranslations['ro'][module];
        
        for (const k of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
            fallbackValue = fallbackValue[k];
          } else {
            fallbackValue = null;
            break;
          }
        }

        if (fallbackValue && typeof fallbackValue === 'string') {
          console.warn(`Translation missing for key "${key}" in locale "${locale}", using Romanian fallback`);
          
          let result = fallbackValue;
          if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
              result = result.replace(`{{${paramKey}}}`, paramValue);
            });
          }
          
          return result;
        }
      }

      // Also search in Romanian modules if key doesn't have prefix
      if (!key.includes('.')) {
        for (const module of roModules) {
          const moduleData = staticTranslations['ro'][module];
          if (moduleData && typeof moduleData === 'object') {
            if (key in moduleData) {
              const moduleValue = moduleData[key];
              if (typeof moduleValue === 'string') {
                console.warn(`Translation missing for key "${key}" in locale "${locale}", using Romanian fallback from module "${module}"`);
                let result = moduleValue;
                if (params) {
                  Object.entries(params).forEach(([paramKey, paramValue]) => {
                    result = result.replace(`{{${paramKey}}}`, paramValue);
                  });
                }
                return result;
              }
            }
          }
        }
      }
    }

    // If we're in Romanian locale, also search in modules
    if (locale === 'ro' && !key.includes('.')) {
      const roModules = Object.keys(staticTranslations['ro']);
      for (const module of roModules) {
        const moduleData = staticTranslations['ro'][module];
        if (moduleData && typeof moduleData === 'object') {
          if (key in moduleData) {
            const moduleValue = moduleData[key];
            if (typeof moduleValue === 'string') {
              let result = moduleValue;
              if (params) {
                Object.entries(params).forEach(([paramKey, paramValue]) => {
                  result = result.replace(`{{${paramKey}}}`, paramValue);
                });
              }
              return result;
            }
          }
        }
      }
    }

    // Final fallback: return the key itself
    console.warn(`Translation missing for key "${key}" in all locales, returning key`);
    return key;
  }, [locale]);

  // Dynamic translation function for API-based content with robust error handling
  const tDynamic = useCallback(async (
    entityType: string,
    entityId: string,
    field: string
  ): Promise<string> => {
    const cache = getTranslationCache();
    
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = cache.get(locale, entityType, entityId, field);
      if (cached) {
        setIsLoading(false);
        return cached;
      }

      // Fetch from API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/translations/${entityType}/${entityId}/${field}?locale=${locale}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const value = data.value || '';

      // Store in cache if we got a value
      if (value) {
        cache.set(locale, entityType, entityId, field, value);
      }

      return value;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation fetch failed';
      console.error(`Translation error for ${entityType}:${entityId}:${field} (${locale}):`, errorMessage);
      
      // Try to get from cache for any locale as fallback
      const cachedAnyLocale = cache.get('ro', entityType, entityId, field);
      if (cachedAnyLocale) {
        console.warn(`Using cached Romanian translation as fallback for ${entityType}:${entityId}:${field}`);
        setError(null); // Clear error since we have a fallback
        return cachedAnyLocale;
      }

      // Set error state but don't break UI
      setError(errorMessage);
      
      // Return empty string - component should use defaultValue
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  const value: TranslationContextValue = {
    locale,
    setLocale,
    t,
    tDynamic,
    isLoading,
    error,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
}
