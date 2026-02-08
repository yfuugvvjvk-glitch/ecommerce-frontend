'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  position: 'before' | 'after';
}

export default function CurrencySelector() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RON');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies();
    // Încarcă moneda salvată
    const saved = localStorage.getItem('selectedCurrency');
    if (saved) {
      setSelectedCurrency(saved);
    }
  }, []);

  const fetchCurrencies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('🔄 Fetching currencies from:', `${apiUrl}/api/currencies`);
      const response = await axios.get(`${apiUrl}/api/currencies`);
      console.log('✅ Currencies loaded:', response.data.currencies.length);
      setCurrencies(response.data.currencies);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching currencies:', error);
      setLoading(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    localStorage.setItem('selectedCurrency', code);
    // Trigger event pentru alte componente
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: code }));
    setIsOpen(false);
  };

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-12 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (currencies.length === 0) {
    console.warn('⚠️ No currencies available');
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 rounded-lg" title="Monedele nu sunt disponibile">
        <span className="text-sm text-yellow-800">💱 RON</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Selectează moneda"
      >
        <span className="text-lg">{currentCurrency?.symbol || '💱'}</span>
        <span className="font-medium text-sm">{selectedCurrency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 sticky top-0 bg-white">
                Selectează Moneda
              </div>
              {currencies.map((currency) => (
                <button
                  key={currency.id}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                    selectedCurrency === currency.code ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{currency.symbol}</span>
                    <div className="text-left">
                      <div className="font-medium text-sm">{currency.code}</div>
                      <div className="text-xs text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                  {selectedCurrency === currency.code && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
