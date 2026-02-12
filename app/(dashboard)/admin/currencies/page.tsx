'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  isActive: boolean;
  position: 'before' | 'after';
  decimals: number;
  createdAt: string;
  updatedAt: string;
}

interface ExchangeRate {
  id: string;
  rate: number;
  source: string;
  lastUpdated: string;
  fromCurrency: Currency;
  toCurrency: Currency;
}

export default function CurrenciesPage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateFormData, setRateFormData] = useState({
    fromCurrencyCode: '',
    toCurrencyCode: '',
    rate: 0,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    isActive: true,
    position: 'before' as 'before' | 'after',
    decimals: 2,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [currenciesRes, ratesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/currencies`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/currencies/rates/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCurrencies(currenciesRes.data.currencies);
      setRates(ratesRes.data.rates);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateRates = async (source: 'bnr' | 'api') => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = source === 'bnr' 
        ? '/api/admin/currencies/update-bnr'
        : '/api/admin/currencies/update-api';

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', `Cursuri actualizate cu succes! (${response.data.rates.length} monede)`);
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la actualizarea cursurilor');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/currencies`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Monedă adăugată cu succes!');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la adăugarea monedei');
    }
  };

  const handleUpdateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/currencies/${editingCurrency.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Monedă actualizată cu succes!');
      setEditingCurrency(null);
      resetForm();
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la actualizarea monedei');
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această monedă?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/currencies/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Monedă ștearsă cu succes!');
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la ștergerea monedei');
    }
  };

  const handleSetBaseCurrency = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/currencies/set-base`,
        { currencyId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Moneda de bază a fost setată!');
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la setarea monedei de bază');
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/currencies/rates`,
        rateFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Curs actualizat cu succes!');
      setShowRateModal(false);
      setRateFormData({ fromCurrencyCode: '', toCurrencyCode: '', rate: 0 });
      fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showMessage('error', err.response?.data?.error || 'Eroare la actualizarea cursului');
    }
  };

  const openRateModal = (rate?: ExchangeRate) => {
    if (rate) {
      setRateFormData({
        fromCurrencyCode: rate.fromCurrency.code,
        toCurrencyCode: rate.toCurrency.code,
        rate: rate.rate,
      });
      setEditingRate(rate);
    } else {
      setRateFormData({
        fromCurrencyCode: '',
        toCurrencyCode: '',
        rate: 0,
      });
      setEditingRate(null);
    }
    setShowRateModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      isActive: true,
      position: 'before',
      decimals: 2,
    });
  };

  const openEditModal = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isActive: currency.isActive,
      position: currency.position,
      decimals: currency.decimals,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionare Monede</h1>
          <p className="text-gray-600 mt-1">Administrează monedele și cursurile de schimb</p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Înapoi la Admin
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Actualizare Cursuri */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Actualizare Cursuri Valutare</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleUpdateRates('bnr')}
            disabled={updating}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Se actualizează...' : '🏦 Actualizează de la BNR'}
          </button>
          <button
            onClick={() => handleUpdateRates('api')}
            disabled={updating}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Se actualizează...' : '🌐 Actualizează de la API'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          💡 Cursurile se actualizează automat zilnic la ora 10:00 AM
        </p>
      </div>

      {/* Lista Monede */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monede Active</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Adaugă Monedă
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cod</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Simbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bază</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currencies.map((currency) => (
                <tr key={currency.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{currency.code}</td>
                  <td className="px-4 py-3">{currency.name}</td>
                  <td className="px-4 py-3 text-xl">{currency.symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      currency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currency.isActive ? 'Activă' : 'Inactivă'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {currency.isBase ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        ⭐ Bază
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetBaseCurrency(currency.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Setează ca bază
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(currency)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editează
                    </button>
                    {!currency.isBase && (
                      <button
                        onClick={() => handleDeleteCurrency(currency.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Șterge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cursuri de Schimb */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cursuri de Schimb Actuale</h2>
          <button
            onClick={() => openRateModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Adaugă/Editează Curs Manual
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => (
            <div key={rate.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {rate.fromCurrency.code} → {rate.toCurrency.code}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    rate.source === 'bnr' ? 'bg-blue-100 text-blue-800' :
                    rate.source === 'api' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rate.source.toUpperCase()}
                  </span>
                  <button
                    onClick={() => openRateModal(rate)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="Editează curs"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {rate.rate.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">
                Actualizat: {new Date(rate.lastUpdated).toLocaleString('ro-RO')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Adaugă/Editează */}
      {(showAddModal || editingCurrency) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingCurrency ? 'Editează Monedă' : 'Adaugă Monedă Nouă'}
            </h3>
            <form onSubmit={editingCurrency ? handleUpdateCurrency : handleAddCurrency}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cod (ex: EUR, USD)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nume
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Simbol
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poziție Simbol
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as 'before' | 'after' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="before">Înainte (€ 100)</option>
                    <option value="after">După (100 lei)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Monedă activă</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCurrency(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCurrency ? 'Actualizează' : 'Adaugă'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editare Curs */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingRate ? 'Editează Curs de Schimb' : 'Adaugă Curs de Schimb Manual'}
            </h3>
            <form onSubmit={handleUpdateRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    De la Moneda
                  </label>
                  <select
                    value={rateFormData.fromCurrencyCode}
                    onChange={(e) => setRateFormData({ ...rateFormData, fromCurrencyCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={!!editingRate}
                  >
                    <option value="">Selectează moneda</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Către Moneda
                  </label>
                  <select
                    value={rateFormData.toCurrencyCode}
                    onChange={(e) => setRateFormData({ ...rateFormData, toCurrencyCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={!!editingRate}
                  >
                    <option value="">Selectează moneda</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curs de Schimb
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={rateFormData.rate}
                    onChange={(e) => setRateFormData({ ...rateFormData, rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    placeholder="Ex: 5.0234"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 {rateFormData.fromCurrencyCode} = {rateFormData.rate} {rateFormData.toCurrencyCode}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>💡 Notă:</strong> Cursul va fi salvat ca &quot;manual&quot; și va suprascrie cursul automat.
                    Pentru a reveni la cursul automat, folosește butoanele &quot;Actualizează de la BNR/API&quot;.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRateModal(false);
                    setEditingRate(null);
                    setRateFormData({ fromCurrencyCode: '', toCurrencyCode: '', rate: 0 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Salvează Curs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
