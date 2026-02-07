# Frontend - Platformă E-Commerce Live

Frontend modern construit cu Next.js 16 și TypeScript pentru platforma de e-commerce.

## 🚀 Caracteristici

- **Next.js 16** cu App Router
- **TypeScript** pentru type safety
- **Tailwind CSS** pentru styling
- **Actualizări live** - toate modificările din admin apar automat
- **Responsive design** - funcționează pe toate dispozitivele
- **Asistent AI** integrat pentru recomandări

## 📦 Instalare

```bash
npm install
```

## ⚙️ Configurare

Creează fișierul `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🏃 Rulare

### Development

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

### Production Build

```bash
npm run build
npm start
```

## 📱 Structura Aplicației

### Pagini Principale

- `/dashboard` - Pagina principală cu produse și carousel
- `/shop` - Catalog complet
- `/products/[id]` - Detalii produs
- `/cart` - Coș de cumpărături
- `/checkout` - Finalizare comandă (cu metode live din admin)
- `/orders` - Istoricul comenzilor
- `/profile` - Profil utilizator
- `/admin` - Panoul de administrare
- `/about` - Despre noi (editabil din admin)
- `/contact` - Contact (cu date live din admin)

### Componente Cheie

- `Navbar` - Header cu ceas românesc
- `Sidebar` - Categorii produse
- `Carousel` - Oferte și produse featured
- `AIChatbot` - Asistent AI
- `StockIndicator` - Indicator stoc în timp real
- `PaymentSimulator` - Simulator plată cu card

## 🔄 Actualizări Live

Toate componentele se actualizează automat când admin modifică:

### Checkout Page

- Metode de livrare din `GET /api/public/delivery-methods`
- Metode de plată din `GET /api/public/payment-methods`
- Locații de ridicare din `GET /api/public/delivery-locations`
- Calcul automat cost livrare și livrare gratuită

### Contact Page

- Email, telefon, adresă din `GET /api/public/site-config`
- Program de lucru actualizat automat

### Dashboard

- Produse în carousel (marcate cu `showInCarousel`)
- Ordine automată sau manuală

## 🛠️ Tehnologii

- **Next.js 16.0.1** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **React Context** - State management
- **Socket.IO Client** - Real-time updates

## 📝 Scripts Disponibile

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint check
```

## 🔗 API Integration

Frontend comunică cu backend prin:

- **REST API** - Pentru operații CRUD
- **Public API** - Pentru date fără autentificare
- **Protected API** - Pentru operații autentificate

### Exemple de integrare:

```typescript
// Fetch metode de livrare
const response = await fetch('/api/public/delivery-methods');
const methods = await response.json();

// Fetch informații contact
const response = await fetch('/api/public/contact-info');
const info = await response.json();
```

## 📚 Documentație

Pentru mai multe detalii, vezi README.md principal din root.

---

**Versiune:** 2.1  
**Framework:** Next.js 16.0.1  
**Status:** ✅ Funcțional cu actualizări live
