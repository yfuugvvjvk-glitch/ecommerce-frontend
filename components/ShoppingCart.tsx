'use client';

import { useEffect, useState } from 'react';
import { cartAPI } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';

interface CartItem {
  id: string;
  quantity: number;
  dataItem: {
    id: string;
    title: string;
    price: number;
    image: string;
    stock: number;
  };
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function ShoppingCart({ onClose }: { onClose?: () => void }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshCartCount } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await cartAPI.updateQuantity(cartItemId, quantity);
      await fetchCart();
      await refreshCartCount(); // Actualizează indicatorul global
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      await fetchCart();
      await refreshCartCount(); // Actualizează indicatorul global
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = async () => {
    if (!confirm('Sigur vrei să golești coșul?')) return;
    try {
      await cartAPI.clearCart();
      await fetchCart();
      await refreshCartCount(); // Actualizează indicatorul global
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const goToCheckout = () => {
    router.push('/checkout');
    onClose?.();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-600 mb-4">Coșul tău este gol</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continuă cumpărăturile
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">
          🛒 Coș ({cart.itemCount} {cart.itemCount === 1 ? 'produs' : 'produse'})
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close cart"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 bg-white p-4 rounded-lg shadow">
            <img
              src={item.dataItem.image}
              alt={item.dataItem.title}
              className="w-20 h-20 object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{item.dataItem.title}</h3>
              <p className="text-blue-600 font-bold">
                {item.dataItem.price.toFixed(2)} RON
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={item.quantity >= item.dataItem.stock}
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-auto text-red-600 hover:text-red-800"
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            {cart.total.toFixed(2)} RON
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCart}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
          >
            Golește coșul
          </button>
          <button
            onClick={goToCheckout}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Finalizează comanda
          </button>
        </div>
      </div>
    </div>
  );
}
