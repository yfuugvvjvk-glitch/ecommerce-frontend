'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Carousel from '@/components/Carousel';
import NavigationHistory from '@/components/NavigationHistory';
import AIChatbot from '@/components/AIChatbot';
import CurrencyPrice from '@/components/CurrencyPrice';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { stripHtml } from '@/utils/stripHtml';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TextStyle {
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlign: 'left' | 'center' | 'right';
}

interface AnnouncementBannerConfig {
  isActive: boolean;
  title: string;
  description: string;
  titleStyle: TextStyle;
  descriptionStyle: TextStyle;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [historyProducts, setHistoryProducts] = useState<any[]>([]);
  const [bannerConfig, setBannerConfig] = useState<AnnouncementBannerConfig | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
    loadViewedProducts();
    fetchBannerConfig();
  }, []);

  // Subscribe to real-time banner updates via WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let socket: any = null;
    let mounted = true;

    const connectWebSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        
        if (!mounted) return;

        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('⚠️ No auth token found, skipping WebSocket connection');
          return;
        }

        // Connect to WebSocket with authentication
        socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        // Listen for config updates
        socket.on('content_update', (data: any) => {
          if (data.type === 'config_updated' && data.key === 'announcement_banner') {
            console.log('📢 Banner config updated via WebSocket:', data);
            if (mounted) {
              setBannerConfig(data.value);
              setShowBanner(true); // Show banner again when updated
            }
          }
        });

        socket.on('connect', () => {
          console.log('🔌 Connected to WebSocket for banner updates');
        });

        socket.on('disconnect', () => {
          console.log('🔌 Disconnected from WebSocket');
        });

        socket.on('connect_error', (error: any) => {
          console.error('🔌 WebSocket connection error:', error.message);
        });
      } catch (error) {
        console.error('Failed to load socket.io-client:', error);
      }
    };

    // Delay connection to ensure component is mounted
    const timer = setTimeout(connectWebSocket, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = products;

    // Filter by category (include subcategories)
    if (selectedCategory) {
      // Find selected category and its subcategories
      const selectedCat = categories.find((c: any) => c.id === selectedCategory);
      const categoryIds = [selectedCategory];
      
      // Add subcategory IDs if they exist
      if (selectedCat && (selectedCat as any).subcategories) {
        (selectedCat as any).subcategories.forEach((sub: any) => {
          categoryIds.push(sub.id);
        });
      }
      
      // Filter products by category ID or any subcategory ID
      filtered = filtered.filter((p: any) => categoryIds.includes(p.category?.id));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p: any) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'name':
        filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      case 'price-asc':
        filtered.sort((a: any, b: any) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a: any, b: any) => b.price - a.price);
        break;
      case 'popularity':
        filtered.sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, selectedCategory, searchQuery, sortBy, categories]);

  const loadViewedProducts = async () => {
    try {
      const viewedIds = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
      if (viewedIds.length === 0) return;

      // Fetch details for viewed products - limitează la maxim 10
      const productsRes = await apiClient.get('/api/data');
      const allProducts = productsRes.data.data || [];
      const viewed = viewedIds
        .map((id: string) => allProducts.find((p: any) => p.id === id))
        .filter(Boolean)
        .slice(0, 10); // Maxim 10 produse pentru istoric
      
      setHistoryProducts(viewed);
    } catch (error) {
      console.error('Failed to load viewed products:', error);
    }
  };

  const fetchBannerConfig = async () => {
    try {
      const response = await apiClient.get('/api/announcement-banner');
      if (response.data.data) {
        setBannerConfig(response.data.data);
      }
    } catch (error) {
      // Fail silently - banner is optional
      console.error('Failed to fetch banner config:', error);
      setBannerConfig(null);
    }
  };

  const fetchData = async () => {
    try {
      const productsRes = await apiClient.get('/api/data');
      const allProducts = productsRes.data.data || [];
      
      setProducts(allProducts);
      
      // Fetch categories from API (admin vede toate, utilizatori doar active)
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user.role === 'admin';
        const categoriesUrl = isAdmin 
          ? '/api/categories?showAll=true&includeSubcategories=true' 
          : '/api/categories?includeSubcategories=true';
        
        const categoriesRes = await apiClient.get(categoriesUrl);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch categories from API:', error);
        // Fallback: Extract unique categories from products by name
        const categoryMap = new Map();
        allProducts.forEach((p: any) => {
          if (p.category && p.category.name) {
            categoryMap.set(p.category.name, {
              id: p.category.id,
              name: p.category.name,
              slug: p.category.slug,
            });
          }
        });
        const uniqueCategories = Array.from(categoryMap.values());
        setCategories(uniqueCategories);
      }

      // Fetch carousel items from new API
      try {
        const carouselRes = await apiClient.get('/api/carousel/active');
        setCarouselItems(carouselRes.data || []);
      } catch (error) {
        console.error('Failed to fetch carousel items:', error);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <Sidebar
        categories={categories}
        activeCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Announcement Banner - arată doar când nu e selectată nicio categorie */}
        {!selectedCategory && bannerConfig && showBanner && (
          <AnnouncementBanner
            config={bannerConfig}
            onClose={() => setShowBanner(false)}
          />
        )}

        {/* Carousel - arată doar când nu e selectată nicio categorie */}
        {!selectedCategory && carouselItems.length > 0 && <Carousel items={carouselItems} />}

        {/* Navigation History - arată doar când nu e selectată nicio categorie */}
        {!selectedCategory && historyProducts.length > 0 && <NavigationHistory products={historyProducts} />}

        {/* Products Section - când e selectată o categorie, ocupă tot spațiul */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🛍️ {selectedCategory 
              ? (categories.find((c: any) => c.id === selectedCategory)?.name || t('category')) 
              : t('allProducts')}
          </h2>

          {/* Filters - show always */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Cele mai noi</option>
                  <option value="name">Nume (A-Z)</option>
                  <option value="price-asc">Preț crescător</option>
                  <option value="price-desc">Preț descrescător</option>
                  <option value="popularity">Popularitate</option>
                </select>
              </div>
            </div>

            {/* Active Filters and Item Count */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                {(searchQuery || sortBy !== 'newest') && (
                  <>
                    <span className="text-sm text-gray-600">Filtre active:</span>
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
                {selectedCategory ? filteredProducts.length : products.slice(0, 10).length} produse
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {(selectedCategory ? filteredProducts : products)
              .slice(
                selectedCategory ? (currentPage - 1) * itemsPerPage : 0,
                selectedCategory ? currentPage * itemsPerPage : 10
              )
              .map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-56 bg-gray-200 flex items-center justify-center">
                  <img
                    src={product.image || '/placeholder.jpg'}
                    alt={stripHtml(product.title)}
                    width="100%"
                    height="100%"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 break-words whitespace-normal overflow-visible group-hover:text-blue-600">
                    {stripHtml(product.title)}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    <CurrencyPrice amount={product.price} />
                    {product.priceType === 'per_unit' ? (
                      <span className="text-sm font-normal text-gray-600">/{product.unitName || 'buc'}</span>
                    ) : product.priceType === 'fixed' ? (
                      <span className="text-sm font-normal text-gray-600">/bucată</span>
                    ) : null}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination - show when category is selected */}
          {selectedCategory && filteredProducts.length > itemsPerPage && (
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

          {!selectedCategory && (
            <div className="mt-6 text-center">
              <Link
                href="/shop"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {t('viewAllProducts')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Button */}
      <div className="w-16">
        <AIChatbot />
      </div>
    </div>
  );
}
