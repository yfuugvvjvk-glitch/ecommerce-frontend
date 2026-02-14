# GiftContext Implementation

## Overview

This module implements the React Context and Provider for the gift products system, enabling frontend components to interact with the gift rule evaluation and selection functionality.

## Files

- `gift-context.tsx` - Main implementation of GiftContext, GiftProvider, and useGiftSystem hook
- `gift-context.test.tsx` - Unit tests (placeholder for future comprehensive tests)

## Components

### GiftContext

React Context that provides gift system state and actions to child components.

**State:**

- `eligibleRules: EligibleRule[]` - List of gift rules that the current cart qualifies for
- `selectedGifts: Map<string, string>` - Map of ruleId to selected productId
- `isEvaluating: boolean` - Loading state during gift evaluation
- `error: string | null` - Current error message, if any

**Actions:**

- `evaluateGifts()` - Evaluates which gift rules are eligible based on current cart
- `selectGift(ruleId, productId)` - Selects a gift product and adds it to cart
- `removeGift(cartItemId)` - Removes a gift product from cart
- `clearError()` - Clears the current error message

### GiftProvider

Provider component that wraps the application (or relevant sections) to provide gift system functionality.

**Usage:**

```tsx
import { GiftProvider } from '@/lib/gift-context';

function App() {
  return <GiftProvider>{/* Your app components */}</GiftProvider>;
}
```

### useGiftSystem Hook

Custom hook to access the gift system context.

**Usage:**

```tsx
import { useGiftSystem } from '@/lib/gift-context';

function CheckoutPage() {
  const {
    eligibleRules,
    selectedGifts,
    isEvaluating,
    error,
    evaluateGifts,
    selectGift,
    removeGift,
    clearError,
  } = useGiftSystem();

  // Use the gift system functionality
}
```

**Error:** Throws an error if used outside of GiftProvider.

## API Integration

The context integrates with the following backend endpoints:

1. **POST /api/cart/evaluate-gift-rules**
   - Evaluates eligible gift rules for current cart
   - Called by: `evaluateGifts()`

2. **POST /api/cart/add-gift-product**
   - Adds a selected gift product to cart
   - Called by: `selectGift(ruleId, productId)`
   - Body: `{ giftRuleId, productId }`

3. **DELETE /api/cart/gift-product/:cartItemId**
   - Removes a gift product from cart
   - Called by: `removeGift(cartItemId)`

## Error Handling

The context provides comprehensive error handling with user-friendly messages in Romanian:

| Error Code            | User Message                                             |
| --------------------- | -------------------------------------------------------- |
| CONDITIONS_NOT_MET    | Coșul tău nu îndeplinește condițiile pentru acest cadou. |
| RULE_NOT_ACTIVE       | Această ofertă de cadou nu mai este activă.              |
| RULE_EXPIRED          | Această ofertă de cadou a expirat.                       |
| USAGE_LIMIT_REACHED   | Ai atins limita de utilizări pentru această ofertă.      |
| GIFT_ALREADY_SELECTED | Ai selectat deja un cadou din această ofertă.            |
| PRODUCT_OUT_OF_STOCK  | Produsul cadou selectat nu mai este în stoc.             |
| INSUFFICIENT_STOCK    | Stoc insuficient pentru produsul cadou selectat.         |
| Generic Error         | A apărut o eroare. Te rugăm să încerci din nou.          |

## Requirements Validation

This implementation validates the following requirements:

- **2.4.1**: Gift rules are evaluated and eligible gifts are displayed at checkout
- **2.4.3**: One gift per rule can be selected (enforced by backend, reflected in UI)
- **2.4.6**: Gift products are added to cart with price 0 (handled by backend)
- **2.4.7**: Gift products are marked as gifts (handled by backend)
- **2.5.1**: Dynamic re-evaluation when cart changes (via `evaluateGifts()`)
- **2.5.2**: Automatic gift removal when conditions not met (handled by backend, reflected via re-evaluation)
- **2.5.3**: User notification when gifts are removed (error messages)

## Type Definitions

```typescript
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
  eligibleRules: EligibleRule[];
  selectedGifts: Map<string, string>;
  isEvaluating: boolean;
  error: string | null;
  evaluateGifts: () => Promise<void>;
  selectGift: (ruleId: string, productId: string) => Promise<void>;
  removeGift: (cartItemId: string) => Promise<void>;
  clearError: () => void;
}
```

## Next Steps

To complete the gift system frontend implementation:

1. **Integrate GiftProvider** into the app layout (task 12.2)
2. **Create UI Components**:
   - GiftSection component (task 13.1)
   - GiftRuleSection component (task 13.2)
   - GiftProductCard component (task 13.3)
   - GiftCartItem component (task 14.1)
3. **Update Cart Component** to trigger gift evaluation (task 14.2)
4. **Add Notifications** for gift removal (task 14.3)
5. **Add Comprehensive Tests** when testing infrastructure is set up

## Testing

Basic test structure is in place in `gift-context.test.tsx`. Comprehensive tests should be added when:

- React Testing Library is configured for the frontend
- API mocking infrastructure is set up
- Integration tests can be run

Test coverage should include:

- State initialization
- API call success and error scenarios
- Error message mapping
- Loading states
- Re-evaluation triggers
