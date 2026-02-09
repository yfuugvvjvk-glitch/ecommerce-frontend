'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  ordersCount: number;
  productsCount: number;
  usersCount: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { title: string; revenue: number; quantity: number }[];
  revenueByCategory: { category: string; revenue: number }[];
}

export default function FinancialReports() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/financial-reports?period=${period}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nu s-au putut încărca datele financiare</p>
      </div>
    );
  }

  const profitPercentage = data.totalRevenue > 0 
    ? ((data.profit / data.totalRevenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📊 Rapoarte Financiare</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Săptămână
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lună
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            An
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-green-900 mb-1">Venituri Totale</h3>
          <p className="text-3xl font-bold text-green-700">{data.totalRevenue.toFixed(2)} RON</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-red-900 mb-1">Cheltuieli Totale</h3>
          <p className="text-3xl font-bold text-red-700">{data.totalExpenses.toFixed(2)} RON</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700">
              {profitPercentage}% marjă
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">Profit Net</h3>
          <p className="text-3xl font-bold text-blue-700">{data.profit.toFixed(2)} RON</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Comenzi</h3>
          <p className="text-3xl font-bold text-gray-900">{data.ordersCount}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Produse</h3>
          <p className="text-3xl font-bold text-gray-900">{data.productsCount}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Utilizatori</h3>
          <p className="text-3xl font-bold text-gray-900">{data.usersCount}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Produse Vândute</h3>
        <div className="space-y-3">
          {data.topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.quantity} bucăți vândute</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">{product.revenue.toFixed(2)} RON</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Venituri pe Categorii</h3>
        <div className="space-y-3">
          {data.revenueByCategory.map((cat, index) => {
            const percentage = data.totalRevenue > 0 
              ? ((cat.revenue / data.totalRevenue) * 100).toFixed(1)
              : '0';
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{cat.category}</span>
                  <span className="text-sm text-gray-500">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{cat.revenue.toFixed(2)} RON</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue by Month */}
      {data.revenueByMonth.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evoluție Venituri</h3>
          <div className="space-y-3">
            {data.revenueByMonth.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{month.month}</span>
                <span className="text-lg font-bold text-blue-600">{month.revenue.toFixed(2)} RON</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
