'use client';

import { useEffect, useState } from 'react';
import { cartAPI } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import CurrencyPrice from './CurrencyPrice';
import { stripHtml } from '@/utils/stripHtml';
import ProductItem from './ProductItem';

interface CartItem {
  id: string;
  quantity: number;
  isGift?: boolean;
  giftRuleId?: string | null;
  dataItem: {
    id: string;
    title: string;
    price: number;
    image: string;
    stock: number;
    unitName?: string;
    priceType?: string;
    availableQuantities?: number[];
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
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const isGuest = user?.role === 'guest';

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
    if (!confirm(t('cart.confirmClearCart'))) return;
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
        <p className="text-gray-600 mb-4">{t('cart.emptyCart')}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('cart.continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">
          🛒 {t('cart.title')} ({cart.itemCount} {cart.itemCount === 1 ? t('cart.product') : t('cart.products')})
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
        {cart.items.map((item) => {
          // Verifică dacă este produs cadou
          const isGiftProduct = item.isGift === true || item.giftRuleId != null;
          
          return (
          <div key={item.id} className="flex gap-4 bg-white p-4 rounded-lg shadow">
            <img
              src={item.dataItem.image}
              alt={item.dataItem.title}
              className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/products/${item.dataItem.id}`)}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ProductItem product={item.dataItem}>
                  {(translatedTitle) => (
                    <h3 
                      className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/products/${item.dataItem.id}`)}
                    >
                      {stripHtml(translatedTitle)}
                    </h3>
                  )}
                </ProductItem>
                {isGiftProduct && (
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    🎁 {t('cart.gift')}
                  </span>
                )}
              </div>
              <div className="text-blue-600 font-bold">
                <CurrencyPrice amount={isGiftProduct ? 0 : item.dataItem.price} />
                {!isGiftProduct && item.dataItem.priceType === 'per_unit' && item.dataItem.unitName && item.dataItem.unitName !== 'bucată' && (
                  <span className="text-sm font-normal text-gray-600">/{item.dataItem.unitName}</span>
                )}
                {!isGiftProduct && item.dataItem.priceType === 'fixed' && (
                  <span className="text-sm font-normal text-gray-600">/buc</span>
                )}
              </div>
              {!isGiftProduct && item.dataItem.priceType === 'fixed' && item.dataItem.availableQuantities && item.dataItem.availableQuantities[0] > 1 && (
                <p className="text-xs text-gray-500">
                  {item.dataItem.availableQuantities[0]} {item.dataItem.unitName}/bucată
                </p>
              )}
              
              {/* Afișare cantități disponibile - doar pentru produse normale */}
              {!isGiftProduct && item.dataItem.availableQuantities && Array.isArray(item.dataItem.availableQuantities) && item.dataItem.availableQuantities.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    📦 {t('cart.availableQuantities')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.dataItem.availableQuantities.map((qty: number) => (
                      <button
                        key={qty}
                        onClick={() => updateQuantity(item.id, qty)}
                        className={`px-2 py-1 text-xs rounded transition ${
                          item.quantity === qty
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        {qty} {item.dataItem.unitName || 'buc'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {!isGiftProduct ? (
                  // Butoane normale pentru produse obișnuite
                  <>
                    <button
                      onClick={() => {
                        // Calculează step-ul corect
                        let step = 1;
                        console.log('Decrement - availableQuantities:', item.dataItem.availableQuantities);
                        if (item.dataItem.availableQuantities && Array.isArray(item.dataItem.availableQuantities) && item.dataItem.availableQuantities.length > 1) {
                          const sortedQtys = [...item.dataItem.availableQuantities].sort((a, b) => a - b);
                          step = sortedQtys[1] - sortedQtys[0];
                          console.log('Calculated step:', step, 'from quantities:', sortedQtys);
                        }
                        const minQty = (item.dataItem.availableQuantities && item.dataItem.availableQuantities[0]) || step;
                        console.log('Min quantity:', minQty, 'Current:', item.quantity, 'Step:', step);
                        updateQuantity(item.id, Math.max(minQty, item.quantity - step));
                      }}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      disabled={item.quantity <= (item.dataItem.availableQuantities?.[0] || 1)}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => {
                        // Calculează step-ul corect
                        let step = 1;
                        console.log('Increment - availableQuantities:', item.dataItem.availableQuantities);
                        if (item.dataItem.availableQuantities && Array.isArray(item.dataItem.availableQuantities) && item.dataItem.availableQuantities.length > 1) {
                          const sortedQtys = [...item.dataItem.availableQuantities].sort((a, b) => a - b);
                          step = sortedQtys[1] - sortedQtys[0];
                          console.log('Calculated step:', step, 'from quantities:', sortedQtys);
                        }
                        console.log('Current quantity:', item.quantity, 'Step:', step, 'New quantity:', item.quantity + step);
                        updateQuantity(item.id, item.quantity + step);
                      }}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      disabled={item.quantity >= ((item.dataItem as any).availableStock || item.dataItem.stock)}
                    >
                      +
                    </button>
                  </>
                ) : (
                  // Afișare cantitate fixă pentru produse cadou
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg border border-green-300 px-3 py-2">
                    <span className="text-sm font-semibold text-green-800">{t('cart.quantity')}: {item.quantity}</span>
                    <span className="text-xs text-green-600">{t('cart.fixedQuantity')}</span>
                  </div>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-auto text-red-600 hover:text-red-800"
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {t('cart.subtotal')}: <span className="font-semibold text-gray-800">
                  {isGiftProduct ? (
                    <span className="text-green-600 font-bold">{t('cart.free')}</span>
                  ) : (
                    <CurrencyPrice amount={item.dataItem.price * item.quantity} />
                  )}
                </span>
              </div>
            </div>
          </div>
        )})}
      </div>

      <div className="border-t p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">{t('cart.total')}:</span>
          <span className="text-2xl font-bold text-blue-600">
            {cart.total.toFixed(2)} RON
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={clearCart}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
          >
            {t('cart.clearCart')}
          </button>
          <button
            onClick={goToCheckout}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
