'use client';

import { useState } from 'react';
import { cartAPI } from '@/lib/api-client';
import { useCart } from '@/lib/cart-context';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  stock: number;
  availabilityType?: string;
  requiresAdvanceOrder?: boolean;
  advanceOrderDays?: number;
  advanceOrderHours?: number;
  customDeliveryRules?: boolean;
  availableDeliveryDays?: number[];
  onSuccess?: () => void;
}

export default function AddToCartButton({
  productId,
  productName,
  stock,
  availabilityType = 'always',
  requiresAdvanceOrder = false,
  advanceOrderDays = 0,
  advanceOrderHours = 0,
  customDeliveryRules = false,
  availableDeliveryDays,
  onSuccess,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { refreshCartCount } = useCart();

  // Verifică disponibilitatea avansată
  const checkAvailability = () => {
    const now = new Date();
    
    // Verifică dacă produsul necesită comandă în avans
    if (requiresAdvanceOrder) {
      const requiredDate = new Date();
      requiredDate.setDate(requiredDate.getDate() + advanceOrderDays);
      requiredDate.setHours(requiredDate.getHours() + advanceOrderHours);
      
      if (now < requiredDate) {
        return {
          available: false,
          message: `Disponibil pentru comandă din ${requiredDate.toLocaleDateString('ro-RO')}`
        };
      }
    }

    // Verifică zilele de livrare disponibile
    if (customDeliveryRules && availableDeliveryDays && availableDeliveryDays.length > 0) {
      const currentDay = now.getDay(); // 0 = Duminică, 1 = Luni, etc.
      
      if (!availableDeliveryDays.includes(currentDay)) {
        const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
        const availableDayNames = availableDeliveryDays.map(day => dayNames[day]).join(', ');
        
        return {
          available: false,
          message: `Disponibil pentru livrare în: ${availableDayNames}`
        };
      }
    }

    // Verifică disponibilitatea sezonieră (implementare simplificată)
    if (availabilityType === 'seasonal') {
      const month = now.getMonth(); // 0-11
      const isSummer = month >= 5 && month <= 8; // Iunie-Septembrie
      const isWinter = month >= 11 || month <= 2; // Decembrie-Martie
      
      // Pentru demo, presupunem că produsele sezoniere sunt disponibile vara
      if (!isSummer) {
        return {
          available: false,
          message: 'Produs sezonier - disponibil vara'
        };
      }
    }

    return { available: true, message: '' };
  };

  const availability = checkAvailability();

  const handleAddToCart = async () => {
    if (stock <= 0 || !availability.available) return;

    try {
      setLoading(true);
      
      const response = await cartAPI.addToCart(productId, 1);
      
      // Actualizează indicatorul de coș imediat
      await refreshCartCount();
      
      setAdded(true);
      onSuccess?.();
      
      setTimeout(() => setAdded(false), 2000);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
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

  if (!availability.available) {
    return (
      <div className="w-full">
        <button
          disabled
          className="w-full px-4 py-3 bg-orange-300 text-orange-800 rounded cursor-not-allowed font-medium mb-2"
        >
          Indisponibil temporar
        </button>
        <p className="text-xs text-orange-600 text-center">
          {availability.message}
        </p>
      </div>
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
