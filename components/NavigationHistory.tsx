'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from './LanguageSwitcher';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface NavigationHistoryProps {
  products: Product[];
}

export default function NavigationHistory({ products }: NavigationHistoryProps) {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerView = 5;

  if (products.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setStartIndex((prev) => {
      if (prev === 0) {
        return Math.max(0, products.length - itemsPerView);
      }
      return Math.max(0, prev - itemsPerView);
    });
  };

  const goToNext = () => {
    setStartIndex((prev) => {
      const next = prev + itemsPerView;
      if (next >= products.length) {
        return 0;
      }
      return next;
    });
  };

  const visibleProducts = products.slice(startIndex, startIndex + itemsPerView);

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
              <div className="relative h-32 bg-gray-200">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                  {product.title}
                </h3>
                <p className="text-sm font-bold text-blue-600 mt-1">
                  {product.price.toFixed(2)} RON
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
