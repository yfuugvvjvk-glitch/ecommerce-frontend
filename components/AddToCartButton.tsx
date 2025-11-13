'use client';

import { useState } from 'react';
import { cartAPI } from '@/lib/api-client';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  stock: number;
  onSuccess?: () => void;
}

export default function AddToCartButton({
  productId,
  productName,
  stock,
  onSuccess,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (stock <= 0) return;

    try {
      setLoading(true);
      await cartAPI.addToCart(productId, 1);
      setAdded(true);
      onSuccess?.();
      
      setTimeout(() => setAdded(false), 2000);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la adăugare în coș');
    } finally {
      setLoading(false);
    }
  };

  if (stock <= 0) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 bg-gray-300 text-gray-500 rounded cursor-not-allowed font-medium"
      >
        Stoc epuizat
      </button>
    );
  }

  if (added) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 bg-green-600 text-white rounded font-medium"
      >
        ✓ Adăugat în coș
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 transition min-h-[44px]"
    >
      {loading ? 'Se adaugă...' : '🛒 Adaugă în coș'}
    </button>
  );
}
