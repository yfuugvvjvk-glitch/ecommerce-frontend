'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo } from 'react';

interface ProductTitleProps {
  product: any;
  children: (translatedTitle: string) => React.ReactNode;
}

export default function ProductTitle({ product, children }: ProductTitleProps) {
  const { locale } = useTranslation();
  
  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html; // Server-side fallback
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  // Use useMemo to recalculate translation when locale changes
  const translatedTitle = useMemo(() => {
    const title = locale === 'ro' ? stripHtml(product.title || '') :
                  locale === 'en' ? stripHtml(product.titleEn || product.title || '') :
                  locale === 'fr' ? stripHtml(product.titleFr || product.title || '') :
                  locale === 'de' ? stripHtml(product.titleDe || product.title || '') :
                  locale === 'es' ? stripHtml(product.titleEs || product.title || '') :
                  locale === 'it' ? stripHtml(product.titleIt || product.title || '') :
                  stripHtml(product.title || '');
    
    return title;
  }, [locale, product]);

  return <>{children(translatedTitle)}</>;
}
