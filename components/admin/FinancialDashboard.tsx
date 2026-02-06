'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/config';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayRevenue: number;
  monthlyRevenue: number;
  recentTransactions: any[];
}

export default function FinancialDashboard() {
  const { token, user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFinancialData();
    }
  }, [user, dateFilter]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Pentru moment, folosim datele din stats-ul admin existent
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialData({
          totalRevenue: data.totalRevenue || 0,
          totalExpenses: 0, // Placeholder
          netProfit: data.totalRevenue || 0,
          todayRevenue: data.totalRevenue || 0,
          monthlyRevenue: data.totalRevenue || 0,
          recentTransactions: data.recentOrders || []
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: string) => {
    // Placeholder pentru export
    alert(`Export în format ${format} - funcționalitate în dezvoltare`);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acces interzis</h2>
        <p className="text-gray-600">Doar administratorii pot accesa această pagină.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu filtre */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Financiar</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtre
          </button>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="today">Astăzi</option>
              <option value="week">Această săptămână</option>
              <option value="month">Această lună</option>
              <option value="year">Acest an</option>
              <option value="custom">Personalizat</option>
            </select>
          </div>
          <button
            onClick={() => exportData('CSV')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filtre extinse */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtre Avansate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data început
              </label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data sfârșit
              </label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie
              </label>
              <select className="w-full border-gray-300 rounded-md shadow-sm">
                <option value="">Toate categoriile</option>
                <option value="sales">Vânzări</option>
                <option value="expenses">Cheltuieli</option>
                <option value="refunds">Rambursări</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Resetează
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              Aplică Filtre
            </button>
          </div>
        </div>
      )}

      {/* Statistici principale */}
      {financialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Venituri Totale</p>
                <p className="text-2xl font-bold text-green-600">
                  {financialData.totalRevenue.toFixed(2)} RON
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cheltuieli Totale</p>
                <p className="text-2xl font-bold text-red-600">
                  {financialData.totalExpenses.toFixed(2)} RON
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Net</p>
                <p className="text-2xl font-bold text-blue-600">
                  {financialData.netProfit.toFixed(2)} RON
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Venituri Astăzi</p>
                <p className="text-2xl font-bold text-purple-600">
                  {financialData.todayRevenue.toFixed(2)} RON
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grafic și tranzacții recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafic placeholder */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evoluția Veniturilor</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Grafic în dezvoltare</p>
              <p className="text-sm text-gray-400">Integrare cu bibliotecă de grafice</p>
            </div>
          </div>
        </div>

        {/* Tranzacții recente */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tranzacții Recente</h3>
          <div className="space-y-3">
            {financialData?.recentTransactions.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Comandă #{transaction.id.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.user?.name || 'Client necunoscut'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString('ro-RO')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    +{transaction.total?.toFixed(2) || '0.00'} RON
                  </p>
                  <p className="text-xs text-gray-500">Venit</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analiză detaliată */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analiză Detaliată</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Rata de Conversie</h4>
            <p className="text-3xl font-bold text-blue-600">85%</p>
            <p className="text-sm text-gray-500">Comenzi finalizate</p>
          </div>
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Valoare Medie Comandă</h4>
            <p className="text-3xl font-bold text-green-600">
              {financialData ? (financialData.totalRevenue / Math.max(financialData.recentTransactions.length, 1)).toFixed(2) : '0.00'} RON
            </p>
            <p className="text-sm text-gray-500">Per comandă</p>
          </div>
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Creștere Lunară</h4>
            <p className="text-3xl font-bold text-purple-600">+12%</p>
            <p className="text-sm text-gray-500">Față de luna trecută</p>
          </div>
        </div>
      </div>

      {/* Opțiuni de export */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Date</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportData('CSV')}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportData('PDF')}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportData('EXCEL')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}