'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiClient } from './api-client';

// Types based on design document
interface GiftProductData {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    stock: number;
  };
  maxQuantityPerOrder: number;
  remainingStock: number | null;
}

interface GiftRuleData {
  id: string;
  name: string;
  description: string | null;
}

interface EligibleRule {
  rule: GiftRuleData;
  availableProducts: GiftProductData[];
}

interface GiftContextType {
  // State
  eligibleRules: EligibleRule[];
  selectedGifts: Map<string, string>; // ruleId -> productId
  isEvaluating: boolean;
  error: string | null;

  // Actions
  evaluateGifts: () => Promise<void>;
  selectGift: (ruleId: string, productId: string) => Promise<void>;
  removeGift: (cartItemId: string) => Promise<void>;
  clearError: () => void;
}

const GiftContext = createContext<GiftContextType | undefined>(undefined);

export function GiftProvider({ children }: { children: ReactNode }) {
  const [eligibleRules, setEligibleRules] = useState<EligibleRule[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<Map<string, string>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Evaluates which gift rules are eligible based on current cart
   * Validates: Requirements 2.4.1, 2.5.1
   */
  const evaluateGifts = useCallback(async () => {
    setIsEvaluating(true);
    setError(null);

    try {
      console.log('🎁 [Frontend] Starting gift evaluation...');
      const response = await apiClient.post('/api/cart/evaluate-gift-rules');
      console.log('🎁 [Frontend] Gift evaluation response:', response.data);
      
      if (response.data.success) {
        console.log('🎁 [Frontend] Eligible rules:', response.data.eligibleRules);
        setEligibleRules(response.data.eligibleRules || []);
      } else {
        setError('Failed to evaluate gift rules');
      }
    } catch (err: any) {
      console.error('❌ [Frontend] Failed to evaluate gifts:', err);
      console.error('❌ [Frontend] Error response:', err.response?.data);
      
      // Handle specific error codes from backend
      if (err.response?.data?.error) {
        setError(err.response.data.error.message);
      } else {
        setError('A apărut o eroare la evaluarea cadourilor');
      }
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  /**
   * Selects a gift product from an eligible rule and adds it to cart
   * Validates: Requirements 2.4.3, 2.4.6, 2.4.7
   */
  const selectGift = useCallback(async (ruleId: string, productId: string) => {
    setError(null);

    try {
      const response = await apiClient.post('/api/cart/add-gift-product', {
        giftRuleId: ruleId,
        productId: productId,
      });

      if (response.data.success) {
        // Update selected gifts map
        setSelectedGifts((prev) => {
          const newMap = new Map(prev);
          newMap.set(ruleId, productId);
          return newMap;
        });

        // Re-evaluate to update eligible rules
        await evaluateGifts();
      } else {
        setError(response.data.message || 'Failed to add gift to cart');
      }
    } catch (err: any) {
      console.error('Failed to select gift:', err);
      
      // Handle specific error codes
      if (err.response?.data?.error) {
        const errorCode = err.response.data.error.code;
        const errorMessage = err.response.data.error.message;
        
        switch (errorCode) {
          case 'CONDITIONS_NOT_MET':
            setError('Coșul tău nu îndeplinește condițiile pentru acest cadou.');
            break;
          case 'RULE_NOT_ACTIVE':
            setError('Această ofertă de cadou nu mai este activă.');
            break;
          case 'RULE_EXPIRED':
            setError('Această ofertă de cadou a expirat.');
            break;
          case 'USAGE_LIMIT_REACHED':
            setError('Ai atins limita de utilizări pentru această ofertă.');
            break;
          case 'GIFT_ALREADY_SELECTED':
            setError('Ai selectat deja un cadou din această ofertă.');
            break;
          case 'PRODUCT_OUT_OF_STOCK':
            setError('Produsul cadou selectat nu mai este în stoc.');
            break;
          case 'INSUFFICIENT_STOCK':
            setError('Stoc insuficient pentru produsul cadou selectat.');
            break;
          default:
            setError(errorMessage || 'A apărut o eroare la adăugarea cadoului');
        }
      } else {
        setError('A apărut o eroare. Te rugăm să încerci din nou.');
      }
      
      throw err; // Re-throw for component-level handling if needed
    }
  }, [evaluateGifts]);

  /**
   * Removes a gift product from cart
   * Validates: Requirements 2.5.2, 2.5.3
   */
  const removeGift = useCallback(async (cartItemId: string) => {
    setError(null);

    try {
      const response = await apiClient.delete(`/api/cart/gift-product/${cartItemId}`);

      if (response.data.success) {
        // Re-evaluate to update eligible rules
        await evaluateGifts();
      } else {
        setError(response.data.message || 'Failed to remove gift from cart');
      }
    } catch (err: any) {
      console.error('Failed to remove gift:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error.message);
      } else {
        setError('A apărut o eroare la eliminarea cadoului');
      }
      
      throw err;
    }
  }, [evaluateGifts]);

  /**
   * Clears the current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GiftContext.Provider
      value={{
        eligibleRules,
        selectedGifts,
        isEvaluating,
        error,
        evaluateGifts,
        selectGift,
        removeGift,
        clearError,
      }}
    >
      {children}
    </GiftContext.Provider>
  );
}

/**
 * Hook to access gift system context
 * Must be used within GiftProvider
 */
export function useGiftSystem() {
  const context = useContext(GiftContext);
  if (!context) {
    throw new Error('useGiftSystem must be used within GiftProvider');
  }
  return context;
}
