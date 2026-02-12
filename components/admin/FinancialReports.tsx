'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { usePagination } from '@/lib/usePagination';
import Pagination from '@/components/Pagination';
import FilterBar from './FilterBar';

interface FinancialData {
  revenue: {
    totalRevenue: number;
    orderRevenue: number;
    cardTransactions: number;
    averageOrderValue: number;
    totalOrders: number;
  };
  expenses: {
    totalExpenses: number;
    byCategory: { category: string; amount: number; count: number }[];
  };
  profit: number;
  profitMargin: number;
  topProducts: { productId: string; productName: string; totalSold: number; revenue: number; averagePrice: number }[];
  ordersByStatus: { status: string; count: number; total: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export default function FinancialReports() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Filtre și sortare pentru produse
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  // Filtre pentru cheltuieli
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [expenseSortBy, setExpenseSortBy] = useState('amount');
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (data?.topProducts) {
      let filtered = [...data.topProducts];

      // Căutare
      if (searchTerm) {
        filtered = filtered.filter(p => 
          p.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sortare
      switch (sortBy) {
        case 'revenue':
          filtered.sort((a, b) => b.revenue - a.revenue);
          break;
        case 'quantity':
          filtered.sort((a, b) => b.totalSold - a.totalSold);
          break;
        case 'name':
          filtered.sort((a, b) => a.productName.localeCompare(b.productName));
          break;
      }

      setFilteredProducts(filtered);
    }
  }, [data?.topProducts, searchTerm, sortBy]);

  useEffect(() => {
    if (data?.expenses.byCategory) {
      let filtered = [...data.expenses.byCategory];

      // Căutare
      if (expenseSearchTerm) {
        filtered = filtered.filter(e => 
          e.category.toLowerCase().includes(expenseSearchTerm.toLowerCase())
        );
      }

      // Sortare
      switch (expenseSortBy) {
        case 'amount':
          filtered.sort((a, b) => b.amount - a.amount);
          break;
        case 'count':
          filtered.sort((a, b) => b.count - a.count);
          break;
        case 'name':
          filtered.sort((a, b) => a.category.localeCompare(b.category));
          break;
      }

      setFilteredExpenses(filtered);
    }
  }, [data?.expenses.byCategory, expenseSearchTerm, expenseSortBy]);

  // Pagination pentru produse
  const { 
    paginatedItems: paginatedProducts, 
    currentPage: productsPage, 
    totalPages: productsTotalPages, 
    goToPage: goToProductsPage, 
    totalItems: productsTotalItems 
  } = usePagination({ 
    items: filteredProducts, 
    itemsPerPage: 5 
  });

  // Pagination pentru cheltuieli
  const { 
    paginatedItems: paginatedExpenses, 
    currentPage: expensesPage, 
    totalPages: expensesTotalPages, 
    goToPage: goToExpensesPage, 
    totalItems: expensesTotalItems 
  } = usePagination({ 
    items: filteredExpenses, 
    itemsPerPage: 5 
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/financial-reports?period=${period}`;
      
      if (period === 'custom' && startDate && endDate) {
        url = `/api/admin/financial-reports?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await apiClient.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year' | 'custom') => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      fetchFinancialData();
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

  const profitPercentage = data.revenue.totalRevenue > 0 
    ? ((data.profit / data.revenue.totalRevenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">📊 Rapoarte Financiare</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 rounded-lg ${
                period === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Săptămână
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 rounded-lg ${
                period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lună
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-4 py-2 rounded-lg ${
                period === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              An
            </button>
            <button
              onClick={() => handlePeriodChange('custom')}
              className={`px-4 py-2 rounded-lg ${
                period === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Personalizat
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data început</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data sfârșit</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCustomDateApply}
                  disabled={!startDate || !endDate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Aplică
                </button>
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-sm text-gray-600 mt-2">
                📊 Raport pentru perioada: {new Date(startDate).toLocaleDateString('ro-RO')} - {new Date(endDate).toLocaleDateString('ro-RO')}
              </p>
            )}
          </div>
        )}
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
          <p className="text-3xl font-bold text-green-700">{(data.revenue.totalRevenue || 0).toFixed(2)} RON</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-red-900 mb-1">Cheltuieli Totale</h3>
          <p className="text-3xl font-bold text-red-700">{(data.expenses.totalExpenses || 0).toFixed(2)} RON</p>
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
          <p className="text-3xl font-bold text-blue-700">{(data.profit || 0).toFixed(2)} RON</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Comenzi</h3>
          <p className="text-3xl font-bold text-gray-900">{data.revenue.totalOrders}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Valoare Medie Comandă</h3>
          <p className="text-3xl font-bold text-gray-900">{(data.revenue.averageOrderValue || 0).toFixed(2)} RON</p>
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
        
        {/* Filtre pentru produse */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Caută produs..."
          filters={[]}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: 'revenue', label: '💰 Venituri' },
            { value: 'quantity', label: '📦 Cantitate' },
            { value: 'name', label: '📝 Nume (A-Z)' }
          ]}
          onReset={() => {
            setSearchTerm('');
            setSortBy('revenue');
          }}
          showReset={searchTerm !== '' || sortBy !== 'revenue'}
        />

        <div className="space-y-3 mt-4">
          {paginatedProducts && paginatedProducts.length > 0 ? (
            <>
              {paginatedProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {(productsPage - 1) * 5 + index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} bucăți vândute</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-600">{product.revenue.toFixed(2)} RON</p>
                </div>
              ))}
              
              <Pagination
                currentPage={productsPage}
                totalPages={productsTotalPages}
                onPageChange={goToProductsPage}
                itemsPerPage={5}
                totalItems={productsTotalItems}
              />
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">Nu există date disponibile</p>
          )}
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Cheltuieli pe Categorii</h3>
        
        {/* Filtre pentru cheltuieli */}
        <FilterBar
          searchTerm={expenseSearchTerm}
          onSearchChange={setExpenseSearchTerm}
          searchPlaceholder="Caută categorie..."
          filters={[]}
          sortBy={expenseSortBy}
          onSortChange={setExpenseSortBy}
          sortOptions={[
            { value: 'amount', label: '💰 Sumă' },
            { value: 'count', label: '📊 Număr tranzacții' },
            { value: 'name', label: '📝 Nume (A-Z)' }
          ]}
          onReset={() => {
            setExpenseSearchTerm('');
            setExpenseSortBy('amount');
          }}
          showReset={expenseSearchTerm !== '' || expenseSortBy !== 'amount'}
        />

        <div className="space-y-3 mt-4">
          {paginatedExpenses && paginatedExpenses.length > 0 ? (
            <>
              {paginatedExpenses.map((cat, index) => {
                const percentage = data!.expenses.totalExpenses > 0 
                  ? ((cat.amount / data!.expenses.totalExpenses) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{cat.category}</span>
                      <span className="text-sm text-gray-500">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{cat.amount.toFixed(2)} RON ({cat.count} tranzacții)</p>
                  </div>
                );
              })}
              
              <Pagination
                currentPage={expensesPage}
                totalPages={expensesTotalPages}
                onPageChange={goToExpensesPage}
                itemsPerPage={5}
                totalItems={expensesTotalItems}
              />
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">Nu există date disponibile</p>
          )}
        </div>
      </div>

      {/* Revenue by Day */}
      {data?.revenueByDay && data.revenueByDay.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evoluție Venituri</h3>
          <div className="space-y-3">
            {data.revenueByDay.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700">{new Date(day.date).toLocaleDateString('ro-RO')}</span>
                  <p className="text-sm text-gray-500">{day.orders} comenzi</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{day.revenue.toFixed(2)} RON</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
