'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import CurrencyPrice from './CurrencyPrice';
import { stripHtml } from '@/utils/stripHtml';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  priceType?: string;
  unitName?: string;
  description?: string;
}

interface NavigationHistoryProps {
  products: Product[];
}

export default function NavigationHistory({ products }: NavigationHistoryProps) {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerView = 5;
  
  // Limitează la maxim 10 produse
  const limitedProducts = products.slice(0, 10);

  if (limitedProducts.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setStartIndex((prev) => {
      // Navigare circulară: dacă suntem la început, mergi la sfârșit
      if (prev === 0) {
        // Calculează ultimul index valid pentru a afișa itemsPerView produse
        const lastValidIndex = Math.max(0, limitedProducts.length - itemsPerView);
        return lastValidIndex;
      }
      // Altfel, mergi înapoi cu itemsPerView
      return Math.max(0, prev - itemsPerView);
    });
  };

  const goToNext = () => {
    setStartIndex((prev) => {
      const next = prev + itemsPerView;
      // Navigare circulară: dacă depășim lungimea, revino la început
      if (next >= limitedProducts.length) {
        return 0;
      }
      return next;
    });
  };

  const visibleProducts = limitedProducts.slice(startIndex, startIndex + itemsPerView);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">📜 {t('navigationHistory')}</h2>
        <div className="flex gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous products"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next products"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group"
          >
            <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-40 bg-gray-200">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.title}
                  width="100%"
                  height="100%"
                  style={{ width: '100%', height: '100%' }}
                  className="group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 break-words whitespace-normal overflow-visible mb-1">
                  {stripHtml(product.title)}
                </h3>
                {product.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {stripHtml(product.description)}
                  </p>
                )}
                <p className="text-sm font-bold text-blue-600">
                  <CurrencyPrice amount={product.price} />
                  {product.priceType === 'per_unit' ? (
                    <span className="text-xs font-normal text-gray-600">/{product.unitName || 'buc'}</span>
                  ) : product.priceType === 'fixed' ? (
                    <span className="text-xs font-normal text-gray-600">/bucată</span>
                  ) : null}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
