'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { stripHtml } from '@/utils/stripHtml';

interface ProductItemProps {
  product: any;
  children: (translatedTitle: string, translatedDescription: string) => React.ReactNode;
}

export default function ProductItem({ product, children }: ProductItemProps) {
  const { locale } = useTranslation();
  
  // Get translated title based on locale
  const translatedTitle = locale === 'ro' ? product.title :
                         locale === 'en' ? (product.titleEn || product.title) :
                         locale === 'fr' ? (product.titleFr || product.title) :
                         locale === 'de' ? (product.titleDe || product.title) :
                         locale === 'es' ? (product.titleEs || product.title) :
                         locale === 'it' ? (product.titleIt || product.title) :
                         product.title;
  
  // Get translated description based on locale
  const translatedDescription = locale === 'ro' ? (product.description || '') :
                               locale === 'en' ? (product.descriptionEn || product.description || '') :
                               locale === 'fr' ? (product.descriptionFr || product.description || '') :
                               locale === 'de' ? (product.descriptionDe || product.description || '') :
                               locale === 'es' ? (product.descriptionEs || product.description || '') :
                               locale === 'it' ? (product.descriptionIt || product.description || '') :
                               (product.description || '');

  return <>{children(translatedTitle, translatedDescription)}</>;
}
