'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface StockIndicatorProps {
  productId: string;
  quantity?: number;
  showDetails?: boolean;
  className?: string;
}

interface StockInfo {
  available: boolean;
  currentStock: number;
}

export default function StockIndicator({ 
  productId, 
  quantity = 1, 
  showDetails = false,
  className = '' 
}: StockIndicatorProps) {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStock();
  }, [productId, quantity]);

  const checkStock = async () => {
    try {
      const response = await fetch(`/api/inventory/check/${productId}?quantity=${quantity}`);
      if (response.ok) {
        const data = await response.json();
        setStockInfo(data);
      }
    } catch (error) {
      console.error('Eroare verificare stoc:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm text-gray-500">Verificare stoc...</span>
      </div>
    );
  }

  if (!stockInfo) {
    return null;
  }

  const getStockStatus = () => {
    if (!stockInfo.available) {
      return {
        icon: AlertTriangle,
        text: 'Fără stoc',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (stockInfo.currentStock === -1) {
      return {
        icon: CheckCircle,
        text: 'În stoc',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }

    if (stockInfo.currentStock <= 5) {
      return {
        icon: AlertTriangle,
        text: showDetails ? `Doar ${stockInfo.currentStock} bucăți` : 'Stoc limitat',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    return {
      icon: CheckCircle,
      text: showDetails ? `${stockInfo.currentStock} bucăți` : 'În stoc',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const status = getStockStatus();
  const Icon = status.icon;

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border ${status.bgColor} ${status.borderColor} ${className}`}>
      <Icon className={`h-4 w-4 ${status.color}`} />
      <span className={`text-sm font-medium ${status.color}`}>
        {status.text}
      </span>
    </div>
  );
}

// Hook pentru verificare stoc în coș
export function useStockCheck(items: Array<{ productId: string; quantity: number }>) {
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const checkAllStock = async () => {
    setChecking(true);
    const errors: string[] = [];

    try {
      for (const item of items) {
        const response = await fetch(`/api/inventory/check/${item.productId}?quantity=${item.quantity}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.available) {
            errors.push(`Stoc insuficient pentru produsul cu ID ${item.productId}`);
          }
        }
      }
    } catch (error) {
      errors.push('Eroare la verificarea stocului');
    }

    setStockErrors(errors);
    setChecking(false);
    return errors.length === 0;
  };

  return { stockErrors, checking, checkAllStock };
}