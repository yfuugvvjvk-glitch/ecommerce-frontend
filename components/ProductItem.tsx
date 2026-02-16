'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo } from 'react';

interface ProductItemProps {
  product: any;
  children: (translatedTitle: string, translatedDescription: string) => React.ReactNode;
}

export default function ProductItem({ product, children }: ProductItemProps) {
  const { locale } = useTranslation();
  
  // Use useMemo to recalculate translations when locale changes
  const { translatedTitle, translatedDescription } = useMemo(() => {
    const title = locale === 'ro' ? product.title :
                  locale === 'en' ? (product.titleEn || product.title) :
                  locale === 'fr' ? (product.titleFr || product.title) :
                  locale === 'de' ? (product.titleDe || product.title) :
                  locale === 'es' ? (product.titleEs || product.title) :
                  locale === 'it' ? (product.titleIt || product.title) :
                  product.title;
    
    const description = locale === 'ro' ? (product.description || '') :
                        locale === 'en' ? (product.descriptionEn || product.description || '') :
                        locale === 'fr' ? (product.descriptionFr || product.description || '') :
                        locale === 'de' ? (product.descriptionDe || product.description || '') :
                        locale === 'es' ? (product.descriptionEs || product.description || '') :
                        locale === 'it' ? (product.descriptionIt || product.description || '') :
                        (product.description || '');
    
    console.log('ProductItem - Locale:', locale);
    console.log('ProductItem - Title:', title?.substring(0, 50));
    console.log('ProductItem - Description:', description?.substring(0, 50));
    
    return { translatedTitle: title, translatedDescription: description };
  }, [locale, product]);

  return <>{children(translatedTitle, translatedDescription)}</>;
}
