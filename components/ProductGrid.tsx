'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  unitName?: string;
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
  return (
    <div>
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group">
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
                  favorites.includes(product.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600'
                }`}
              />
            </button>

            <Link href={`/products/${product.id}`}>
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={product.image || '/placeholder.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 truncate group-hover:text-blue-600 mb-2">
                  {product.title}
                </h3>
                {product.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                  </div>
                )}
                <p className="text-lg font-bold text-blue-600">
                  {product.price.toFixed(2)} RON
                  {product.unitName && product.unitName !== 'bucată' && (
                    <span className="text-sm font-normal text-gray-600">/{product.unitName}</span>
                  )}
                </p>
                {product.unitName && product.unitName !== 'bucată' && (
                  <p className="text-xs text-gray-500">
                    Vândut per {product.unitName}
                  </p>
                )}
              </div>
            </Link>
          </div>
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
            Anterior
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
            Următor
          </button>
        </div>
      )}
    </div>
  );
}
