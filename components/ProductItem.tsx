'use client';

import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { stripHtml } from '@/utils/stripHtml';

interface ProductItemProps {
  product: any;
  children: (translatedTitle: string, translatedDescription: string) => React.ReactNode;
}

export default function ProductItem({ product, children }: ProductItemProps) {
  const { value: translatedTitle } = useDynamicTranslation(
    'product',
    product.id,
    'title',
    product.title
  );

  const { value: translatedDescription } = useDynamicTranslation(
    'product',
    product.id,
    'description',
    product.description || ''
  );

  return <>{children(translatedTitle, translatedDescription)}</>;
}
