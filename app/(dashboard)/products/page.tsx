'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataItem } from '@/types';
import ProductForm from '@/components/ProductForm';
import DataTable from '@/components/DataTable';
import AddToCartButton from '@/components/AddToCartButton';
import { dataAPI, apiClient, categoryAPI } from '@/lib/api-client';
import { stripHtml } from '@/utils/stripHtml';
import ProductItem from '@/components/ProductItem';
import { getShortUnitName, formatUnitName } from '@/utils/formatUnitName';

export default function ProductsPage() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState<DataItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DataItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Read search query and offer from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const offerId = searchParams.get('offer');
    
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
    
    if (offerId) {
      fetchOfferProducts(offerId);
    } else if (token) {
      fetchProducts();
    }
  }, [searchParams, token]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchOfferProducts = async (offerId: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/api/offers/${offerId}/products`);
      setProducts(response.data.products || []);
      setFilteredProducts(response.data.products || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea produselor din ofertă');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dataAPI.getAll();
      setProducts(response.data.data);
      setFilteredProducts(response.data.data);
    } catch (err) {
      setError('Failed to load products');
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
    fetchCategories();
  }, []);

  // Filter products by category, status and search
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

    // Filter by status (admin only)
    if (selectedStatus !== 'all' && isAdmin) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        filtered.sort((a, b) => ((b as any).reviewCount || 0) - ((a as any).reviewCount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, selectedCategory, selectedStatus, searchQuery, sortBy, isAdmin]);

  // Get category options from loaded categories
  const categoryOptions = ['all', ...categories.map(c => c.name)];

  const handleCreate = async (data: any) => {
    try {
      setIsSubmitting(true);
      await dataAPI.create(data);
      setToast({ message: 'Produs adăugat cu succes!', type: 'success' });
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      setToast({ message: 'Eroare la adăugare produs', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      await dataAPI.update(editingProduct.id, data);
      setToast({ message: 'Produs actualizat!', type: 'success' });
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      setToast({ message: 'Eroare la actualizare', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to form when editing
  useEffect(() => {
    if (editingProduct || showForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingProduct, showForm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest produs?')) return;
    try {
      await dataAPI.delete(id);
      setToast({ message: 'Produs șters!', type: 'success' });
      await fetchProducts();
    } catch (err) {
      setToast({ message: 'Eroare la ștergere', type: 'error' });
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}
          role="alert"
        >
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-4 font-bold text-xl hover:text-gray-200"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          🛍️ Produse ({filteredProducts.length})
        </h1>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition min-h-[44px]"
              aria-label={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
            >
              {viewMode === 'grid' ? '📋 Tabel' : '🎨 Grid'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition min-h-[44px]"
            >
              ➕ Adaugă Produs
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Caută produse
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după nume sau descriere..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              📂 Categorie
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoryOptions.map((cat) => (
                <option key={String(cat)} value={String(cat)}>
                  {cat === 'all' ? 'Toate categoriile' : String(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
              📊 Sortează după
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Cele mai noi</option>
              <option value="name">Nume (A-Z)</option>
              <option value="price-asc">Preț crescător</option>
              <option value="price-desc">Preț descrescător</option>
              <option value="popularity">Popularitate</option>
            </select>
          </div>

          {/* Status Filter - Admin Only */}
          {isAdmin && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ⬇️ Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toate statusurile</option>
                <option value="published">✅ Published</option>
                <option value="draft">📝 Draft</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>
          )}
        </div>

        {/* Active Filters and Item Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery || sortBy !== 'newest') && (
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
                {selectedStatus !== 'all' && isAdmin && (
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition"
                  >
                    ⬇️ {selectedStatus} ✕
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
                    setSelectedStatus('all');
                    setSearchQuery('');
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

      {/* Form Modal - Admin Only */}
      {isAdmin && (showForm || editingProduct) && (
        <div className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? '✏️ Editează Produs' : '➕ Produs Nou'}
          </h2>
          <ProductForm
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            initialData={editingProduct}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 bg-white rounded-lg shadow" role="alert">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px]"
          >
            Încearcă din nou
          </button>
        </div>
      )}

      {/* Table View - Admin Only */}
      {!error && isAdmin && viewMode === 'table' && (
        <DataTable
          data={filteredProducts}
          loading={loading}
          onEdit={setEditingProduct}
          onDelete={handleDelete}
        />
      )}

      {/* Grid View */}
      {!error && viewMode === 'grid' && !loading && products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg mb-4">Nu există produse încă.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px]"
          >
            ➕ Adaugă primul produs
          </button>
        </div>
      )}

      {!error && viewMode === 'grid' && !loading && filteredProducts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((product) => (
            <ProductItem key={product.id} product={product}>
              {(translatedTitle, translatedDescription) => (
            <div
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-64 bg-gray-200 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={stripHtml(translatedTitle)}
                  width="100%"
                  height="100%"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                {product.oldPrice && product.oldPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold shadow">
                    -
                    {Math.round(
                      ((product.oldPrice - product.price) / product.oldPrice) * 100
                    )}
                    %
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 break-words whitespace-normal overflow-visible min-h-[3.5rem]">
                  {stripHtml(translatedTitle)}
                </h3>

                {translatedDescription && (
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: translatedDescription }} />
                )}

                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price.toFixed(2)} lei
                    </span>
                    {(product as any).priceType === 'per_unit' ? (
                      <span className="text-sm font-normal text-gray-600">/{getShortUnitName((product as any).unitName)}</span>
                    ) : (product as any).priceType === 'fixed' ? (
                      <span className="text-sm font-normal text-gray-600">/bucată</span>
                    ) : null}
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.oldPrice.toFixed(2)} lei
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex flex-col">
                    {/* Afișare stoc conform stockDisplayMode */}
                    {(product as any).stockDisplayMode === 'visible' && (
                      <span
                        className={`font-medium ${
                          product.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {product.stock > 0 ? `Stoc: ${product.stock.toFixed(2)} ${formatUnitName(product.stock, (product as any).unitName)}` : 'Stoc epuizat'}
                      </span>
                    )}
                    {(product as any).stockDisplayMode === 'status_only' && (
                      <span
                        className={`font-medium ${
                          product.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {product.stock > 0 ? 'Disponibil' : 'Indisponibil'}
                      </span>
                    )}
                    {/* stockDisplayMode === 'hidden' - nu afișăm nimic */}
                    
                    {/* Afișare disponibilitate avansată */}
                    {product.availabilityType && product.availabilityType !== 'always' && (
                      <span className="text-xs text-orange-600 mt-1">
                        {product.availabilityType === 'seasonal' ? '🌟 Disponibil sezonier' : '📅 Disponibil programat'}
                      </span>
                    )}
                    {product.requiresAdvanceOrder && (
                      <span className="text-xs text-blue-600 mt-1">
                        ⏰ Comandă în avans: {product.advanceOrderDays}z {product.advanceOrderHours}h
                      </span>
                    )}
                    {product.isPerishable && (
                      <span className="text-xs text-yellow-600 mt-1">
                        🕐 Produs perisabil
                        {product.expiryDate && (
                          <span className="ml-1">
                            (exp: {new Date(product.expiryDate).toLocaleDateString('ro-RO')})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {/* Category badge hidden as requested */}
                </div>

                <div className="space-y-2">
                  <AddToCartButton
                    productId={product.id}
                    productName={product.title}
                    stock={product.stock}
                    availabilityType={product.availabilityType}
                    requiresAdvanceOrder={product.requiresAdvanceOrder}
                    advanceOrderDays={product.advanceOrderDays}
                    advanceOrderHours={product.advanceOrderHours}
                    customDeliveryRules={product.customDeliveryRules}
                    availableDeliveryDays={
                      product.availableDeliveryDays && typeof product.availableDeliveryDays === 'string'
                        ? JSON.parse(product.availableDeliveryDays) as number[]
                        : product.availableDeliveryDays as number[] | undefined
                    }
                    onSuccess={() => setToast({ message: 'Produs adăugat în coș!', type: 'success' })}
                  />
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition min-h-[44px]"
                        aria-label={`Edit ${product.title}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition min-h-[44px]"
                        aria-label={`Delete ${product.title}`}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </ProductItem>
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
