'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { dataAPI, categoryAPI } from '@/lib/api-client';
import { useTranslation } from '@/components/LanguageSwitcher';
import Link from 'next/link';

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
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">{t('noProductsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="relative h-48 bg-gray-200">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
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
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                  {product.title}
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
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {product.price.toFixed(2)} RON
                    {product.unitName && product.unitName !== 'bucată' && (
                      <span className="text-sm font-normal text-gray-600">/{product.unitName}</span>
                    )}
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {product.oldPrice.toFixed(2)} RON
                      {product.unitName && product.unitName !== 'bucată' && (
                        <span className="text-xs">/{product.unitName}</span>
                      )}
                    </span>
                  )}
                </div>
                
                {/* Informații despre unitatea de măsură */}
                {product.unitName && product.unitName !== 'bucată' && (
                  <p className="text-xs text-gray-500 mb-2">
                    Vândut per {product.unitName}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`font-medium ${
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {product.stock > 0 ? `${t('inStockCount')}: ${product.stock}` : t('outOfStock')}
                  </span>
                  <span className="text-gray-500 capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                    {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
