'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { dataAPI, categoryAPI } from '@/lib/api-client';
import { useTranslation } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { stripHtml } from '@/utils/stripHtml';

export default function ShopPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await dataAPI.getAll();
      setProducts(response.data.data);
      setFilteredProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (p) => {
          const categoryName = typeof p.category === 'string' ? p.category : p.category?.name;
          return categoryName?.toLowerCase() === selectedCategory.toLowerCase();
        }
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter((p) => {
        const avgRating = p.averageRating || 0;
        return avgRating >= minRating;
      });
    }

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, selectedCategory, searchQuery, priceRange, minRating, sortBy]);

  const categoryOptions = ['all', ...categories.map(c => c.name)];
  
  // Refresh categories when products change
  useEffect(() => {
    if (products.length > 0 && categories.length === 0) {
      fetchCategories();
    }
  }, [products]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🛍️ {t('products')} ({filteredProducts.length})</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">🔍 {t('filtersAndSort')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('searchLabel')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProducts')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📂 {t('categoryLabel')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((cat) => (
                <option key={String(cat)} value={String(cat)}>
                  {cat === 'all' ? t('allCategories') : String(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 {t('sortBy')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">{t('newest')}</option>
              <option value="price-asc">{t('priceAsc')}</option>
              <option value="price-desc">{t('priceDesc')}</option>
              <option value="rating">{t('rating')}</option>
              <option value="name">{t('nameAZ')}</option>
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⭐ {t('minRating')}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">{t('all')}</option>
              <option value="1">⭐ 1+</option>
              <option value="2">⭐ 2+</option>
              <option value="3">⭐ 3+</option>
              <option value="4">⭐ 4+</option>
              <option value="5">⭐ 5</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 {t('priceRange')}: {priceRange[0]} - {priceRange[1]} RON
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              placeholder="Min"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span>-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              placeholder="Max"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => setPriceRange([0, 10000])}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              {t('reset')}
            </button>
          </div>
        </div>

        {/* Active Filters and Item Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            {(selectedCategory !== 'all' || searchQuery || minRating > 0 || priceRange[0] !== 0 || priceRange[1] !== 10000 || sortBy !== 'newest') && (
              <>
                <span className="text-sm text-gray-600">Filtre active:</span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
                  >
                    📂 {selectedCategory} ✕
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition"
                  >
                    🔍 "{searchQuery}" ✕
                  </button>
                )}
                {minRating > 0 && (
                  <button
                    onClick={() => setMinRating(0)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm hover:bg-yellow-200 transition"
                  >
                    ⭐ {minRating}+ ✕
                  </button>
                )}
                {(priceRange[0] !== 0 || priceRange[1] !== 10000) && (
                  <button
                    onClick={() => setPriceRange([0, 10000])}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition"
                  >
                    💰 {priceRange[0]}-{priceRange[1]} RON ✕
                  </button>
                )}
                {sortBy !== 'newest' && (
                  <button
                    onClick={() => setSortBy('newest')}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition"
                  >
                    📊 {sortBy} ✕
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setMinRating(0);
                    setPriceRange([0, 10000]);
                    setSortBy('newest');
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  Șterge toate
                </button>
              </>
            )}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {filteredProducts.length} din {products.length} produse
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">{t('noProductsFound')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="relative h-64 bg-gray-200 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={stripHtml(product.title)}
                  width="100%"
                  height="100%"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                {product.oldPrice && product.oldPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 break-words whitespace-normal overflow-visible min-h-[3.5rem]">
                  {stripHtml(product.title)}
                </h3>

                {/* Rating */}
                {product.averageRating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({product.reviewCount || 0})</span>
                  </div>
                )}

                {product.description && (
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                )}

                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price.toFixed(2)} lei
                    </span>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.oldPrice.toFixed(2)} lei
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  {/* Afișare stoc bazată pe stockDisplayMode */}
                  {product.stockDisplayMode === 'hidden' ? (
                    // Nu afișa nimic despre stoc
                    <span></span>
                  ) : product.stockDisplayMode === 'status_only' ? (
                    // Afișează doar disponibil/indisponibil
                    <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? 'Disponibil' : 'Indisponibil'}
                    </span>
                  ) : (
                    // Afișează cantitatea exactă (visible mode)
                    <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${t('inStockCount')}: ${product.stock.toFixed(2)}` : t('outOfStock')}
                    </span>
                  )}
                  {/* Category badge hidden as requested */}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-gray-700">
              Pagina {currentPage} din {Math.ceil(filteredProducts.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Următor →
            </button>
          </div>
        )}
      </>
      )}
    </div>
  );
}
