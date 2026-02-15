'use client';

import ProductCard from './ProductCard';
import { useTranslation } from '@/hooks/useTranslation';

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

interface ProductGridProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFavoriteToggle: (productId: string) => void;
  favorites: string[];
}

export default function ProductGrid({
  products,
  currentPage,
  totalPages,
  onPageChange,
  onFavoriteToggle,
  favorites,
}: ProductGridProps) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={favorites.includes(product.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.buttons.previous') || 'Anterior'}
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 rounded-lg ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.buttons.next') || 'Următor'}
          </button>
        </div>
      )}
    </div>
  );
}
