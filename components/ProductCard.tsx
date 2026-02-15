'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import CurrencyPrice from './CurrencyPrice';
import { stripHtml } from '@/utils/stripHtml';

interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  unitName?: string;
  priceType?: string;
  availableQuantities?: number[];
  stock?: number;
  availableStock?: number;
}

interface ProductCardProps {
  product: Product;
  onFavoriteToggle: (productId: string) => void;
  isFavorite: boolean;
}

export default function ProductCard({ product, onFavoriteToggle, isFavorite }: ProductCardProps) {
  // Use dynamic translation for product title
  const { value: translatedTitle } = useDynamicTranslation(
    'product',
    product.id,
    'title',
    product.title
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group">
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onFavoriteToggle(product.id);
        }}
        className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
      >
        <Heart
          className={`h-5 w-5 ${
            isFavorite
              ? 'fill-red-500 text-red-500'
              : 'text-gray-600'
          }`}
        />
      </button>

      <Link href={`/products/${product.id}`}>
        <div className="relative h-56 bg-gray-200">
          <img
            src={product.image || '/placeholder.jpg'}
            alt={stripHtml(translatedTitle)}
            width="100%"
            height="100%"
            style={{ width: '100%', height: '100%', display: 'block' }}
            className="group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-800 break-words whitespace-normal overflow-visible group-hover:text-blue-600 mb-2">
            {stripHtml(translatedTitle)}
          </h3>
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
            </div>
          )}
          <p className="text-lg font-bold text-blue-600">
            <CurrencyPrice amount={product.price} />
            {product.priceType === 'per_unit' && product.unitName && product.unitName !== 'bucată' ? (
              <span className="text-sm font-normal text-gray-600">/{product.unitName}</span>
            ) : product.priceType === 'fixed' && product.availableQuantities && product.availableQuantities[0] > 1 ? (
              <span className="text-sm font-normal text-gray-600">/buc</span>
            ) : null}
          </p>
          {product.priceType === 'per_unit' && product.unitName && product.unitName !== 'bucată' && (
            <p className="text-xs text-gray-500">
              Preț per {product.unitName}
            </p>
          )}
          {product.priceType === 'fixed' && product.availableQuantities && product.availableQuantities[0] > 1 && (
            <p className="text-xs text-gray-500">
              {product.availableQuantities[0]} {product.unitName} per produs
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
