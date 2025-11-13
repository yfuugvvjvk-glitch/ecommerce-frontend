'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api-client';

interface CartContextType {
  cartItemCount: number;
  refreshCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItemCount, setCartItemCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const response = await apiClient.get('/api/cart');
      const items = response.data.items || [];
      const totalCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemCount(totalCount);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    refreshCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartItemCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
