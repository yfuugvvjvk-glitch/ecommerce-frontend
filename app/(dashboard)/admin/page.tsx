'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import UsersManagement from '@/components/admin/UsersManagement';
import OrdersManagement from '@/components/admin/OrdersManagement';
import VouchersManagement from '@/components/admin/VouchersManagement';
import OffersManagement from '@/components/admin/OffersManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import InvoicesManagement from '@/components/admin/InvoicesManagement';
import TestCardsManagement from '@/components/admin/TestCardsManagement';
import ProductsManagement from '@/components/admin/ProductsManagement';
import AdvancedProductManager from '@/components/admin/AdvancedProductManager';
import InventoryDashboard from '@/components/admin/InventoryDashboard';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import ContentManager from '@/components/admin/ContentManager';
import DeliveryScheduleManager from '@/components/admin/DeliveryScheduleManager';
import ExpenseRevenueManager from '@/components/admin/ExpenseRevenueManager';
import DeliveryPaymentSettings from '@/components/admin/DeliveryPaymentSettings';
import DeliveryLocationsManager from '@/components/admin/DeliveryLocationsManager';
import UIElementsManager from '@/components/admin/UIElementsManager';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'orders' | 'vouchers' | 'offers' | 'categories' | 'invoices' | 'test-cards' | 'inventory' | 'financial' | 'content' | 'delivery-schedule' | 'delivery-locations' | 'payment-delivery' | 'ui-elements'>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchStats();
    }
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!confirm('Sigur vrei să rulezi cleanup-ul? Aceasta va șterge vouchere expirate, complet utilizate și cereri vechi.')) {
      return;
    }

    try {
      const response = await apiClient.post('/api/admin/cleanup');
      const results = response.data.results;
      const message = `Cleanup finalizat! Șterse: ${results.expiredVouchers} vouchere expirate, ${results.fullyUsedVouchers} vouchere utilizate, ${results.oldRejectedRequests} cereri respinse vechi, ${results.oldApprovedRequests} cereri aprobate vechi.`;
      setToast({ message, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la rulare cleanup', type: 'error' });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">👨‍💼 Panou Administrator</h1>

      {/* Toast Notification */}
      {toast && (
        <div className={`mb-4 p-4 rounded-lg ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Utilizatori
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Produse
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🛒 Comenzi
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'vouchers'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎟️ Vouchere
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'offers'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎉 Oferte
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📂 Categorii
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📄 Facturi
        </button>
        <button
          onClick={() => setActiveTab('test-cards')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'test-cards'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💳 Carduri Test
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Inventar
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'financial'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💰 Financiar
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'content'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📝 Conținut
        </button>
        <button
          onClick={() => setActiveTab('delivery-schedule')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'delivery-schedule'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🚚 Livrări & Blocare
        </button>
        <button
          onClick={() => setActiveTab('delivery-locations')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'delivery-locations'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📍 Locații Livrare
        </button>
        <button
          onClick={() => setActiveTab('payment-delivery')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'payment-delivery'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💳 Plată & Livrare
        </button>
        <button
          onClick={() => setActiveTab('ui-elements')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'ui-elements'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎨 Elemente UI
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Utilizatori</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Produse</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
                </div>
                <div className="text-4xl">🛍️</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Comenzi</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Venit Total</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.totalRevenue.toFixed(0)} RON
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          {/* System Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">🔧 Acțiuni Sistem</h2>
            <div className="flex gap-4">
              <button
                onClick={handleRunCleanup}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                🗑️ Rulează Cleanup Acum
              </button>
              <p className="text-sm text-gray-600 flex items-center">
                Șterge vouchere expirate, complet utilizate și cereri vechi
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Comenzi Recente</h2>
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{order.total.toFixed(2)} RON</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestionare Utilizatori</h2>
          <UsersManagement />
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestionare Comenzi</h2>
          <OrdersManagement />
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestionare Completă Produse</h2>
          <ProductsManagement />
        </div>
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestionare Vouchere</h2>
          <VouchersManagement />
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-lg shadow p-6">
          <OffersManagement />
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-lg shadow p-6">
          <CategoriesManagement />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow p-6">
          <InvoicesManagement />
        </div>
      )}

      {/* Test Cards Tab */}
      {activeTab === 'test-cards' && (
        <div className="bg-white rounded-lg shadow p-6">
          <TestCardsManagement />
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Dashboard Inventar</h2>
          <InventoryDashboard />
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="bg-white rounded-lg shadow p-6">
          <ExpenseRevenueManager />
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestionare Conținut</h2>
          <ContentManager />
        </div>
      )}

      {/* Delivery Schedule Tab */}
      {activeTab === 'delivery-schedule' && (
        <div className="bg-white rounded-lg shadow p-6">
          <DeliveryScheduleManager />
        </div>
      )}

      {/* Delivery Locations Tab */}
      {activeTab === 'delivery-locations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <DeliveryLocationsManager />
        </div>
      )}

      {/* Payment & Delivery Settings Tab */}
      {activeTab === 'payment-delivery' && (
        <div className="bg-white rounded-lg shadow p-6">
          <DeliveryPaymentSettings />
        </div>
      )}

      {/* UI Elements Tab */}
      {activeTab === 'ui-elements' && (
        <div className="bg-white rounded-lg shadow p-6">
          <UIElementsManager />
        </div>
      )}
    </div>
  );
}
