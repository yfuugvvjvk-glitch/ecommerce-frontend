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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [historyProducts, setHistoryProducts] = useState<any[]>([]);
  const [welcomeContent, setWelcomeContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    loadViewedProducts();
    fetchWelcomeContent();
  }, []);

  const loadViewedProducts = async () => {
    try {
      const viewedIds = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
      if (viewedIds.length === 0) return;

      // Fetch details for viewed products
      const productsRes = await apiClient.get('/api/data');
      const allProducts = productsRes.data.data || [];
      const viewed = viewedIds
        .map((id: string) => allProducts.find((p: any) => p.id === id))
        .filter(Boolean)
        .slice(0, 5);
      
      setHistoryProducts(viewed);
    } catch (error) {
      console.error('Failed to load viewed products:', error);
    }
  };

  const fetchWelcomeContent = async () => {
    try {
      const response = await fetch('/api/public/pages/dashboard-welcome');
      if (response.ok) {
        const page = await response.json();
        setWelcomeContent(page);
      }
    } catch (error) {
      console.error('Failed to fetch welcome content:', error);
    }
  };

  const fetchData = async () => {
    try {
      const productsRes = await apiClient.get('/api/data');
      const allProducts = productsRes.data.data || [];
      setProducts(allProducts);
      
      // Extract unique categories from products by name
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

      // Fetch offers from API
      try {
        const offersRes = await apiClient.get('/api/offers');
        const activeOffers = offersRes.data.filter((o: any) => o.isActive);
        if (activeOffers.length > 0) {
          // Map offers to include productId for direct linking
          const mappedOffers = activeOffers.map((o: any) => ({
            ...o,
            productId: o.productOffers?.[0]?.dataItemId || null // Link la primul produs din ofertă
          }));
          setOffers(mappedOffers);
        } else {
          // Fallback: Create offers from products with oldPrice
          const productsWithDiscounts = allProducts.filter((p: any) => p.oldPrice && p.oldPrice > p.price);
          if (productsWithDiscounts.length > 0) {
            const generatedOffers = productsWithDiscounts.slice(0, 3).map((p: any) => {
              const discountPercent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
              return {
                id: p.id,
                productId: p.id, // Link direct la produs
                title: `${t('offer')}: ${p.title}`,
                description: `${t('discount')} ${discountPercent}%`,
                image: p.image,
                discount: discountPercent,
              };
            });
            setOffers(generatedOffers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
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
        {/* Welcome Content */}
        {welcomeContent?.content && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: welcomeContent.content }}
          />
        )}

        {/* Carousel */}
        {offers.length > 0 && <Carousel offers={offers} />}

        {/* Navigation History */}
        {historyProducts.length > 0 && <NavigationHistory products={historyProducts} />}

        {/* All Products Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🛍️ {selectedCategory 
              ? (categories.find((c: any) => c.id === selectedCategory)?.name || t('category')) 
              : t('allProducts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {products
              .filter((product: any) => !selectedCategory || product.category?.id === selectedCategory)
              .slice(0, 10)
              .map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={product.image || '/placeholder.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 truncate group-hover:text-blue-600">
                    {product.title}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {product.price} RON
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Button */}
      <div className="w-16">
        <AIChatbot />
      </div>
    </div>
  );
}
