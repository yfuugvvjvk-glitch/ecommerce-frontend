'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

interface Transaction {
  id: string;
  type: 'EXPENSE' | 'REVENUE';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  attachments?: string[];
  createdAt: string;
}

interface TransactionCategory {
  id: string;
  name: string;
  type: 'EXPENSE' | 'REVENUE';
  color: string;
  isActive: boolean;
}

export default function ExpenseRevenueManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'reports'>('transactions');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expense' | 'revenue'>('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'REVENUE',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    isRecurring: false,
    recurringPeriod: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'EXPENSE' as 'EXPENSE' | 'REVENUE',
    color: '#3B82F6',
    isActive: true
  });

  // Real-time updates
  const { isConnected } = useWebSocket({
    onFinancialUpdate: (data) => {
      console.log('Financial update:', data);
      fetchData();
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/admin/transactions', { 
          params: { 
            startDate: dateRange.startDate, 
            endDate: dateRange.endDate,
            type: filter !== 'all' ? filter.toUpperCase() : undefined
          }
        }),
        apiClient.get('/api/admin/transaction-categories')
      ]);
      
      setTransactions(transactionsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Set mock data for now
      setTransactions([
        {
          id: '1',
          type: 'EXPENSE',
          category: 'Utilități',
          amount: 250.50,
          description: 'Factură electricitate',
          date: '2026-02-01',
          paymentMethod: 'transfer',
          isRecurring: true,
          recurringPeriod: 'MONTHLY',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'REVENUE',
          category: 'Vânzări Online',
          amount: 1500.00,
          description: 'Vânzări produse februarie',
          date: '2026-02-03',
          paymentMethod: 'card',
          isRecurring: false,
          createdAt: new Date().toISOString()
        }
      ]);
      setCategories([
        { id: '1', name: 'Utilități', type: 'EXPENSE', color: '#EF4444', isActive: true },
        { id: '2', name: 'Marketing', type: 'EXPENSE', color: '#F59E0B', isActive: true },
        { id: '3', name: 'Vânzări Online', type: 'REVENUE', color: '#10B981', isActive: true },
        { id: '4', name: 'Servicii', type: 'REVENUE', color: '#3B82F6', isActive: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      await apiClient.post('/api/admin/transactions', transactionForm);
      setShowModal(false);
      resetTransactionForm();
      fetchData();
      alert('Tranzacția a fost adăugată cu succes!');
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Eroare la adăugarea tranzacției');
    }
  };

  const handleCreateCategory = async () => {
    try {
      await apiClient.post('/api/admin/transaction-categories', categoryForm);
      resetCategoryForm();
      fetchData();
      alert('Categoria a fost creată cu succes!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Eroare la crearea categoriei');
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'EXPENSE',
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      isRecurring: false,
      recurringPeriod: 'MONTHLY'
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      type: 'EXPENSE',
      color: '#3B82F6',
      isActive: true
    });
  };

  const calculateTotals = () => {
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const revenues = transactions
      .filter(t => t.type === 'REVENUE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { expenses, revenues, profit: revenues - expenses };
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter.toUpperCase();
  });

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header cu status real-time */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cheltuieli și Venituri</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Statistici rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-2xl mr-3">💸</div>
            <div>
              <p className="text-sm text-red-600">Cheltuieli Totale</p>
              <p className="text-xl font-bold text-red-700">{totals.expenses.toFixed(2)} RON</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm text-green-600">Venituri Totale</p>
              <p className="text-xl font-bold text-green-700">{totals.revenues.toFixed(2)} RON</p>
            </div>
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${
          totals.profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center">
            <div className={`text-2xl mr-3 ${totals.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {totals.profit >= 0 ? '📈' : '📉'}
            </div>
            <div>
              <p className={`text-sm ${totals.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {totals.profit >= 0 ? 'Profit' : 'Pierdere'}
              </p>
              <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {Math.abs(totals.profit).toFixed(2)} RON
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'transactions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💳 Tranzacții
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📂 Categorii
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'reports'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Rapoarte
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          {/* Filtre și controale */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data început</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data sfârșit</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'expense' | 'revenue')}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="all">Toate</option>
                    <option value="expense">Cheltuieli</option>
                    <option value="revenue">Venituri</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  🔍 Filtrează
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  ➕ Adaugă Tranzacție
                </button>
              </div>
            </div>
          </div>

          {/* Lista tranzacții */}
          <div className="space-y-3">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'EXPENSE' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type === 'EXPENSE' ? '💸 Cheltuială' : '💰 Venit'}
                      </span>
                      <span className="text-sm text-gray-500">{transaction.category}</span>
                      {transaction.isRecurring && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          🔄 Recurent
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{transaction.description}</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Data:</span> {new Date(transaction.date).toLocaleDateString('ro-RO')}
                      </div>
                      <div>
                        <span className="font-medium">Plată:</span> {transaction.paymentMethod}
                      </div>
                      {transaction.isRecurring && (
                        <div>
                          <span className="font-medium">Perioada:</span> {transaction.recurringPeriod}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'EXPENSE' ? '-' : '+'}{transaction.amount.toFixed(2)} RON
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-3">Adaugă Categorie Nouă</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Nume categorie"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <select
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({...categoryForm, type: e.target.value as 'EXPENSE' | 'REVENUE'})}
                className="border rounded px-3 py-2"
              >
                <option value="EXPENSE">Cheltuială</option>
                <option value="REVENUE">Venit</option>
              </select>
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                className="border rounded px-3 py-2 h-10"
              />
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                ➕ Adaugă
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => (
              <div key={category.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-600">
                        {category.type === 'EXPENSE' ? 'Cheltuială' : 'Venit'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Raport Financiar</h3>
            <p className="text-gray-600">Rapoartele detaliate vor fi implementate în curând...</p>
          </div>
        </div>
      )}

      {/* Modal pentru adăugare tranzacție */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Adaugă Tranzacție Nouă</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value as 'EXPENSE' | 'REVENUE'})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="EXPENSE">💸 Cheltuială</option>
                    <option value="REVENUE">💰 Venit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                  <select
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Selectează categoria</option>
                    {categories
                      .filter(cat => cat.type === transactionForm.type && cat.isActive)
                      .map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sumă (RON)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: parseFloat(e.target.value)})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descriere</label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Descrierea tranzacției..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metodă de plată</label>
                <select
                  value={transactionForm.paymentMethod}
                  onChange={(e) => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="cash">Numerar</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer bancar</option>
                  <option value="crypto">Criptomonede</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={transactionForm.isRecurring}
                    onChange={(e) => setTransactionForm({...transactionForm, isRecurring: e.target.checked})}
                  />
                  <span>Tranzacție recurentă</span>
                </label>

                {transactionForm.isRecurring && (
                  <div className="mt-2">
                    <select
                      value={transactionForm.recurringPeriod}
                      onChange={(e) => setTransactionForm({...transactionForm, recurringPeriod: e.target.value as any})}
                      className="border rounded px-3 py-2"
                    >
                      <option value="DAILY">Zilnic</option>
                      <option value="WEEKLY">Săptămânal</option>
                      <option value="MONTHLY">Lunar</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleCreateTransaction}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                💾 Salvează Tranzacția
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}