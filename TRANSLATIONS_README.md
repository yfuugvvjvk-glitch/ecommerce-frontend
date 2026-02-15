# Sistem de Traduceri Live

## Prezentare generală

Acest sistem oferă suport complet pentru traduceri multilingve în aplicație, incluzând:

- Traduceri statice pentru UI (butoane, etichete, mesaje)
- Traduceri dinamice pentru conținut (produse, categorii, mesaje chat)
- Cache inteligent pentru performanță
- Fallback hierarchy pentru robustețe
- Formatare locale-aware pentru prețuri, date și numere

## Arhitectură

### Componente principale

1. **TranslationContext** (`contexts/TranslationContext.tsx`)
   - Context React global pentru gestionarea traducerilor
   - Funcții: `t()` pentru traduceri statice, `tDynamic()` pentru traduceri dinamice

2. **TranslationCache** (`lib/TranslationCache.ts`)
   - Cache în memorie + sessionStorage
   - LRU eviction când cache > 1000 entries
   - TTL support pentru cache entries

3. **Hooks**
   - `useTranslation()` - acces la funcțiile de traducere
   - `useDynamicTranslation()` - traduceri dinamice cu progressive rendering

4. **Formatters** (`lib/formatters.ts`)
   - `formatCurrency()` - formatare prețuri
   - `formatDate()` - formatare date
   - `formatNumber()` - formatare numere
   - `formatTime()`, `formatDateTime()`, `formatRelativeTime()`

## Utilizare

### 1. Traduceri statice (UI)

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();

  return <button>{t('common.buttons.save')}</button>;
}
```

### 2. Traduceri dinamice (produse, categorii)

```tsx
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

function ProductCard({ product }) {
  const { value: translatedTitle } = useDynamicTranslation(
    'product',
    product.id,
    'title',
    product.title // fallback value
  );

  return <h3>{translatedTitle}</h3>;
}
```

### 3. Schimbare limbă

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function LanguageSelector() {
  const { locale, changeLanguage } = useTranslation();

  return <button onClick={() => changeLanguage('en')}>English</button>;
}
```

### 4. Formatare locale-aware

```tsx
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, formatDate } from '@/lib/formatters';

function PriceDisplay({ amount, date }) {
  const { locale } = useTranslation();

  return (
    <div>
      <p>{formatCurrency(amount, locale)}</p>
      <p>{formatDate(date, locale)}</p>
    </div>
  );
}
```

## Structura fișierelor de traduceri

```
frontend/locales/
  ro/
    common.json      # Butoane, navigare, mesaje
    auth.json        # Autentificare
    products.json    # Produse
    cart.json        # Coș
    admin.json       # Admin panel
    errors.json      # Mesaje de eroare
  en/
    common.json
    auth.json
    ...
```

### Exemplu fișier de traduceri

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "home": "Home",
    "products": "Products"
  }
}
```

## Fallback Hierarchy

Sistemul folosește următoarea ierarhie de fallback:

1. **Limba curentă** - încearcă să găsească traducerea în limba selectată
2. **Română (fallback)** - dacă nu există în limba curentă, folosește română
3. **Cheia** - dacă nu există nici în română, returnează cheia ca text

Exemplu:

```
Limba: en
Cheie: "common.buttons.save"

1. Caută în en/common.json → "Save" ✓
2. Dacă nu există, caută în ro/common.json → "Salvează"
3. Dacă nu există, returnează "common.buttons.save"
```

## Cache

### Funcționare

- **Memory cache**: Rapid, pentru sesiunea curentă
- **sessionStorage**: Persistență pentru tab-ul curent
- **LRU eviction**: Când cache > 1000 entries, elimină cele mai puțin folosite

### Invalidare cache

Cache-ul se invalidează automat când:

- Utilizatorul schimbă limba
- TTL-ul expiră (1 oră default)
- Cache-ul este plin (LRU eviction)

## API Backend

### Endpoints disponibile

```
GET /api/translations/:entityType/:entityId/:field?locale=:locale
POST /api/translations/batch
GET /api/translations/:entityType/:entityId?locale=:locale
PUT /api/translations/:id (admin only)
POST /api/translations/generate (admin only)
GET /api/translations/stats (admin only)
```

### Exemplu request

```javascript
const response = await fetch(
  '/api/translations/product/abc123/title?locale=en'
);
const data = await response.json();
// { value: "Premium Laptop", locale: "en", isAutomatic: true }
```

## Limbi suportate

- 🇷🇴 Română (ro) - limba implicită
- 🇬🇧 Engleză (en)
- 🇫🇷 Franceză (fr)
- 🇩🇪 Germană (de)
- 🇪🇸 Spaniolă (es)
- 🇮🇹 Italiană (it)

## Adăugare limbă nouă

1. Creează directorul `frontend/locales/{locale}/`
2. Adaugă fișierele JSON (common.json, auth.json, etc.)
3. Limba va apărea automat în Language Selector

## Best Practices

### 1. Folosește chei descriptive

```tsx
// ✓ Bine
t('products.addToCart');

// ✗ Rău
t('btn1');
```

### 2. Folosește parametri pentru valori dinamice

```tsx
// ✓ Bine
t('messages.welcome', { name: userName })
// JSON: "Welcome, {{name}}!"

// ✗ Rău
`Welcome, ${userName}!`;
```

### 3. Folosește useDynamicTranslation pentru conținut dinamic

```tsx
// ✓ Bine - progressive rendering
const { value } = useDynamicTranslation('product', id, 'title', defaultTitle);

// ✗ Rău - blocking
const title = await tDynamic('product', id, 'title');
```

### 4. Folosește formatters pentru date și prețuri

```tsx
// ✓ Bine - locale-aware
formatCurrency(price, locale)
// ✗ Rău - hardcoded format
`${price.toFixed(2)} RON`;
```

## Troubleshooting

### Traducerea nu apare

1. Verifică că cheia există în fișierul JSON
2. Verifică că limba este încărcată (check console)
3. Verifică că componenta folosește `useTranslation()`

### Cache nu se actualizează

1. Șterge cache-ul manual: `localStorage.clear()` + `sessionStorage.clear()`
2. Verifică TTL-ul în TranslationCache
3. Reîncarcă pagina

### Erori API

1. Verifică că backend-ul rulează
2. Verifică endpoint-ul în Network tab
3. Verifică că entitatea există în baza de date

## Performance

- **Cache hit rate**: > 80% pentru utilizare tipică
- **Translation load time**: < 100ms pentru cache hit
- **API response time**: < 1s pentru traducere nouă
- **Memory usage**: < 10MB pentru cache

## Contribuție

Pentru a adăuga traduceri noi:

1. Editează fișierele JSON din `frontend/locales/{locale}/`
2. Testează cu `changeLanguage(locale)`
3. Commit cu mesaj descriptiv: "Add translations for {feature}"
