'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface CurrencyPriceProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}

export default function CurrencyPrice({ 
  amount, 
  fromCurrency = 'RON', 
  className = '',
  showOriginal = false 
}: CurrencyPriceProps) {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [targetCurrency, setTargetCurrency] = useState<string>('RON');
  const [symbol, setSymbol] = useState<string>('lei');
  const [position, setPosition] = useState<'before' | 'after'>('after');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'RON';
    setTargetCurrency(savedCurrency);
    convertPrice(savedCurrency);

    const handleCurrencyChange = (event: any) => {
      const newCurrency = event.detail;
      setTargetCurrency(newCurrency);
      convertPrice(newCurrency);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [amount, fromCurrency]);

  const convertPrice = async (toCurrency: string) => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      await fetchCurrencySymbol(toCurrency);
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(
        `${apiUrl}/api/currencies/convert`,
        {
          params: {
            amount,
            from: fromCurrency,
            to: toCurrency,
          },
        }
      );

      setConvertedAmount(response.data.converted.amount);
      await fetchCurrencySymbol(toCurrency);
    } catch (error) {
      console.error('Error converting price:', error);
      setConvertedAmount(amount);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencySymbol = async (currencyCode: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${apiUrl}/api/currencies`);
      const currency = response.data.currencies.find((c: any) => c.code === currencyCode);
      if (currency) {
        setSymbol(currency.symbol);
        setPosition(currency.position);
      }
    } catch (error) {
      console.error('Error fetching currency symbol:', error);
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <span className={`inline-block animate-pulse ${className}`}>
        <span className="bg-gray-200 rounded px-2 py-1">...</span>
      </span>
    );
  }

  return (
    <span className={className}>
      {position === 'before' && <span>{symbol} </span>}
      <span>{formatPrice(convertedAmount)}</span>
      {position === 'after' && <span> {symbol}</span>}
      
      {showOriginal && fromCurrency !== targetCurrency && (
        <span className="text-xs text-gray-500 ml-2">
          ({formatPrice(amount)} {fromCurrency})
        </span>
      )}
    </span>
  );
}
