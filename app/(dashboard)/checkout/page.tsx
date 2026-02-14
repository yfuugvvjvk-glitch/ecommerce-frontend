'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI, voucherAPI, orderAPI } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useGiftSystem } from '@/lib/gift-context';
import { useStockCheck } from '@/components/StockIndicator';
import StockIndicator from '@/components/StockIndicator';
import PaymentSimulator from '@/components/PaymentSimulator';

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Calculează distanța între două puncte GPS folosind formula Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raza Pământului în km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshCartCount } = useCart();
  const { evaluateGifts, eligibleRules, selectGift, isEvaluating } = useGiftSystem();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customCounty, setCustomCounty] = useState('');
  const [customStreet, setCustomStreet] = useState('');
  const [customStreetNumber, setCustomStreetNumber] = useState('');
  const [customAddressDetails, setCustomAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [deliveryLocations, setDeliveryLocations] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showPaymentSimulator, setShowPaymentSimulator] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [deliverySchedule, setDeliverySchedule] = useState<any>(null);
  const [isDeliveryBlocked, setIsDeliveryBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockedPaymentMethods, setBlockedPaymentMethods] = useState<string[]>([]);
  const [blockedDeliveryLocations, setBlockedDeliveryLocations] = useState<string[]>([]);
  const [addressValidationMessage, setAddressValidationMessage] = useState<string>('');
  const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  
  // Stock check hook
  const { stockErrors, checking, checkAllStock } = useStockCheck(
    cart?.items?.map((item: any) => ({
      productId: item.dataItemId || item.dataItem?.id,
      quantity: item.quantity
    })) || []
  );

  useEffect(() => {
    fetchCart();
    fetchDeliveryLocations();
    fetchPaymentMethods();
    fetchContactInfo();
    fetchDeliverySchedule();
    
    // Inițializează câmpurile de adresă cu valorile din profil
    if (user) {
      setCustomCity(user.city || '');
      setCustomCounty(user.county || '');
      setCustomStreet(user.street || '');
      setCustomStreetNumber(user.streetNumber || '');
      setCustomAddressDetails(user.addressDetails || '');
    }
  }, [user]);

  // Calculează subtotal când se schimbă cart-ul
  useEffect(() => {
    if (cart && cart.items) {
      const calculatedSubtotal = cart.items.reduce((sum: number, item: any) => {
        return sum + (item.dataItem?.price || 0) * item.quantity;
      }, 0);
      setSubtotal(calculatedSubtotal);
    }
  }, [cart]);

  // Verifică regulile de blocare când se schimbă subtotal
  useEffect(() => {
    if (subtotal > 0) {
      fetchBlockRules();
    }
  }, [subtotal]);

  // Refresh cart when returning to page
  useEffect(() => {
    const handleFocus = () => {
      fetchCart();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Selectează automat prima metodă de plată disponibilă (neblocată)
  useEffect(() => {
    if (paymentMethods.length > 0 && blockedPaymentMethods.length >= 0) {
      // Găsește prima metodă care NU este blocată
      const availableMethod = paymentMethods.find(m => !blockedPaymentMethods.includes(m.id));
      
      if (availableMethod) {
        console.log('🔓 Selecting first available payment method:', availableMethod.name);
        setPaymentMethod(availableMethod.id);
      } else {
        console.warn('⚠️ No available payment methods!');
      }
    }
  }, [paymentMethods, blockedPaymentMethods]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data);
      
      // Evaluează regulile de cadouri după încărcarea coșului
      await evaluateGifts();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryLocations = async () => {
    try {
      // Fetch fără cache-busting timestamp pentru a evita CORS preflight
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      const locations = await response.json();
      console.log('📍 All delivery locations loaded (DYNAMIC):', locations);
      console.log('📍 Detailed location data:', JSON.stringify(locations, null, 2));
      setDeliveryLocations(locations);
      
      // Set main location as default
      const mainLocation = locations.find((loc: any) => loc.isMainLocation);
      console.log('🏠 Main location (used in checkout message):', mainLocation);
      if (mainLocation) {
        setSelectedDeliveryLocation(mainLocation.id);
        calculateDeliveryFee(mainLocation.id);
        
        // Verifică dacă locația principală este "Localități limitrofe" - verificare mai flexibilă
        const locationNameLower = mainLocation.name.toLowerCase();
        const isCustomLocation = locationNameLower.includes('limitrofe') || 
                                locationNameLower.includes('personalizat') ||
                                locationNameLower.includes('alta') ||
                                mainLocation.name === 'Localități limitrofe';
        console.log('🔍 Is main location custom?', isCustomLocation, '| Name:', mainLocation.name);
        if (isCustomLocation) {
          console.log('✅ Setting useCustomAddress to true on page load');
          setUseCustomAddress(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch delivery locations:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/payment-methods`);
      const methods = await response.json();
      setPaymentMethods(methods);
      
      // Așteaptă ca blockedPaymentMethods să fie setat, apoi selectează prima metodă disponibilă
      // Această logică va fi executată după ce fetchBlockRules se termină
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/contact-info`);
      const data = await response.json();
      console.log('📞 Contact info loaded (DYNAMIC - used in checkout):', data);
      setContactInfo(data);
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  const fetchDeliverySchedule = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-schedules`);
      const data = await response.json();
      
      console.log('📅 Delivery schedules loaded (DYNAMIC):', data);
      
      // Verifică dacă data este array sau obiect
      let schedules = Array.isArray(data) ? data : (data.schedules || []);
      
      console.log('📅 Schedules array:', schedules);
      
      // Găsește programul activ
      const activeSchedule = schedules.find((s: any) => s.isActive);
      console.log('✅ Active schedule (used in checkout message):', activeSchedule);
      
      if (activeSchedule) {
        setDeliverySchedule(activeSchedule);
        console.log('📅 Delivery days:', activeSchedule.deliveryDays);
        console.log('⏰ Time slots:', activeSchedule.deliveryTimeSlots);
        checkIfDeliveryBlocked(activeSchedule);
      } else {
        console.warn('⚠️ No active delivery schedule found');
      }
    } catch (error) {
      console.error('❌ Failed to fetch delivery schedule:', error);
    }
  };

  const checkIfDeliveryBlocked = (schedule: any) => {
    console.log('🔍 Checking if delivery is blocked...');
    console.log('📋 Schedule received:', JSON.stringify(schedule, null, 2));
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Duminică, 1 = Luni, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('🕐 Current day:', currentDay, '(0=Duminică, 1=Luni, etc.)');
    console.log('🕐 Current time:', currentTime);
    console.log('📅 Current date:', currentDate);
    console.log('📅 Delivery days:', schedule.deliveryDays);

    // Verifică dacă data curentă este în datele speciale blocate
    console.log('📅 Special dates:', JSON.stringify(schedule.specialDates, null, 2));
    
    if (schedule.specialDates && schedule.specialDates.length > 0) {
      const blockedDate = schedule.specialDates.find((d: any) => {
        const specialDate = d.date.split('T')[0]; // Extrage doar data (YYYY-MM-DD)
        console.log(`  Checking special date: ${specialDate} (blocked: ${d.isBlocked}, reason: "${d.reason}") vs current: ${currentDate}`);
        return d.isBlocked && specialDate === currentDate;
      });

      if (blockedDate) {
        setIsDeliveryBlocked(true);
        const reason = blockedDate.reason || 'Comenzile sunt blocate în această zi';
        console.log('🚫 BLOCAT - Data curentă este blocată:', reason);
        console.log('🚫 Blocked date object:', JSON.stringify(blockedDate, null, 2));
        setBlockReason(reason);
        return;
      }
    }

    // LOGICA INVERSATĂ: Verifică dacă ziua curentă ȘI ora curentă sunt ÎN intervalul de livrare
    // Dacă DA, blochează comenzile (comenzile pot fi plasate doar în afara intervalului)
    
    const isDeliveryDay = schedule.deliveryDays && schedule.deliveryDays.includes(currentDay);
    console.log('📅 Este zi de livrare?', isDeliveryDay);

    if (isDeliveryDay) {
      // Este zi de livrare, verifică ora
      const timeSlot = schedule.deliveryTimeSlots?.[0]; // Folosim primul interval (simplificat)
      console.log('⏰ Time slot:', timeSlot);
      
      if (timeSlot) {
        const isInTimeSlot = currentTime >= timeSlot.startTime && currentTime <= timeSlot.endTime;
        console.log('⏰ Este în intervalul orar?', isInTimeSlot, `(${currentTime} între ${timeSlot.startTime} - ${timeSlot.endTime})`);
        
        if (isInTimeSlot) {
          // Este în intervalul de livrare, BLOCHEAZĂ comenzile
          setIsDeliveryBlocked(true);
          const reason = `Comenzile NU pot fi plasate în intervalul de livrare (${timeSlot.startTime} - ${timeSlot.endTime})`;
          console.log('🚫 BLOCAT - Ora curentă este ÎN intervalul de livrare:', reason);
          setBlockReason(reason);
          return;
        }
      }
    }

    // Dacă nu este zi de livrare SAU nu este în intervalul orar, comenzile sunt permise
    console.log('✅ Comenzile sunt PERMISE (în afara intervalului de livrare)');
    setIsDeliveryBlocked(false);
    setBlockReason('');
  };

  const fetchBlockRules = async () => {
    try {
      console.log('🔍 Fetching active block rules...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/block-rules`);
      const rules = await response.json();
      
      console.log('📋 Block rules response:', rules);
      
      const now = new Date();
      const blockedPayments: string[] = [];
      const blockedDeliveries: string[] = [];
      
      // Verifică fiecare regulă activă
      rules.forEach((rule: any) => {
        if (!rule.isActive) return;
        
        // Verifică dacă regula este în intervalul de timp specificat
        const isInTimeRange = rule.blockFrom && rule.blockUntil 
          ? now >= new Date(rule.blockFrom) && now <= new Date(rule.blockUntil)
          : true; // Dacă nu există interval, regula este mereu activă
        
        if (!isInTimeRange) {
          console.log(`❌ Rule "${rule.name}" is NOT in time range`);
          return;
        }
        
        console.log(`✅ Rule "${rule.name}" is ACTIVE in time range`);
        
        // Verifică dacă blochează toate comenzile noi
        if (rule.blockNewOrders) {
          setIsDeliveryBlocked(true);
          setBlockReason(rule.blockReason || 'Comenzile sunt blocate temporar');
          console.log(`🚫 BLOCAT - Toate comenzile noi sunt blocate: ${rule.blockReason}`);
          return;
        }
        
        // Verifică valoarea minimă a comenzii
        if (rule.minimumOrderValue && rule.minimumOrderValue > 0 && subtotal < rule.minimumOrderValue) {
          setIsDeliveryBlocked(true);
          setBlockReason(rule.blockReason || `Valoarea minimă a comenzii este ${rule.minimumOrderValue.toFixed(2)} RON`);
          console.log(`🚫 BLOCAT - Valoarea comenzii (${subtotal.toFixed(2)} RON) este sub minimul de ${rule.minimumOrderValue.toFixed(2)} RON`);
          return;
        }
        
        // Adaugă metodele de plată blocate
        if (rule.blockedPaymentMethods && rule.blockedPaymentMethods.length > 0) {
          blockedPayments.push(...rule.blockedPaymentMethods);
          console.log('🔒 Blocked payment methods:', rule.blockedPaymentMethods);
        }
        
        // Adaugă locațiile de livrare blocate
        if (rule.blockedDeliveryLocations && rule.blockedDeliveryLocations.length > 0) {
          blockedDeliveries.push(...rule.blockedDeliveryLocations);
          console.log('📍 Blocked delivery locations:', rule.blockedDeliveryLocations);
        }
      });
      
      // Elimină duplicatele
      const uniqueBlockedPayments = [...new Set(blockedPayments)];
      const uniqueBlockedDeliveries = [...new Set(blockedDeliveries)];
      
      console.log('🔒 Final blocked payment methods:', uniqueBlockedPayments);
      console.log('📍 Final blocked delivery locations:', uniqueBlockedDeliveries);
      
      setBlockedPaymentMethods(uniqueBlockedPayments);
      setBlockedDeliveryLocations(uniqueBlockedDeliveries);
    } catch (error) {
      console.error('❌ Failed to fetch block rules:', error);
    }
  };

  const calculateDeliveryFee = (locationId?: string) => {
    if (!cart || !locationId) {
      setDeliveryFee(0);
      return;
    }

    // Găsește locația selectată
    const location = deliveryLocations.find(loc => loc.id === locationId);
    if (!location) {
      setDeliveryFee(0);
      return;
    }

    // Verifică dacă livrarea este gratuită peste un anumit prag
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.dataItem?.price || 0) * item.quantity;
    }, 0);

    if (location.freeDeliveryThreshold && subtotal >= location.freeDeliveryThreshold) {
      setDeliveryFee(0);
      return;
    }

    setDeliveryFee(location.deliveryFee || 0);
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;

    try {
      const response = await voucherAPI.validate(voucherCode, cart.total);
      setAppliedVoucher(response.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Voucher invalid');
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const handleDeliveryLocationChange = (locationId: string) => {
    setSelectedDeliveryLocation(locationId);
    calculateDeliveryFee(locationId);
  };

  // Validare adresă în timp real
  const validateCustomAddress = async () => {
    console.log('🔍 validateCustomAddress called');
    console.log('  useCustomAddress:', useCustomAddress);
    console.log('  customCity:', customCity);
    console.log('  customStreet:', customStreet);
    console.log('  customStreetNumber:', customStreetNumber);
    console.log('  selectedDeliveryLocation:', selectedDeliveryLocation);
    
    if (!useCustomAddress || !customCity.trim() || !customStreet.trim() || !customStreetNumber.trim()) {
      console.log('  ❌ Validare oprită - câmpuri incomplete');
      setAddressValidationMessage('');
      setIsAddressValid(null);
      return;
    }

    const selectedLocation = deliveryLocations.find(loc => loc.id === selectedDeliveryLocation);
    console.log('  📍 Selected location:', selectedLocation);
    console.log('  📏 Delivery radius:', selectedLocation?.deliveryRadius);
    
    if (!selectedLocation) {
      console.log('  ❌ Nu există locație selectată');
      setAddressValidationMessage('');
      setIsAddressValid(null);
      return;
    }
    
    // Verifică dacă locația are rază setată (inclusiv 0 înseamnă că nu verificăm)
    if (selectedLocation.deliveryRadius === null || selectedLocation.deliveryRadius === undefined) {
      console.log('  ❌ Raza de livrare nu este setată');
      setAddressValidationMessage('');
      setIsAddressValid(null);
      return;
    }
    
    // Dacă raza este 0, înseamnă sediu fix - nu verificăm distanța
    if (selectedLocation.deliveryRadius === 0) {
      console.log('  ⚠️ Raza este 0 - sediu fix, nu se verifică distanța');
      setAddressValidationMessage('⚠️ Această locație nu oferă livrare la domiciliu (sediu fix - ridicare personală)');
      setIsAddressValid(false);
      return;
    }

    console.log('  ✅ Începe validarea distanței...');
    setValidatingAddress(true);
    
    // Detectează tipul de stradă și construiește query-ul corect
    let streetPrefix = 'Strada';
    const streetLower = customStreet.toLowerCase();
    if (streetLower.startsWith('bulevardul') || streetLower.startsWith('bulevard') || streetLower.startsWith('bd.') || streetLower.startsWith('bd ')) {
      streetPrefix = ''; // Bulevardul este deja în nume
    } else if (streetLower.startsWith('aleea') || streetLower.startsWith('alee')) {
      streetPrefix = ''; // Aleea este deja în nume
    } else if (streetLower.startsWith('strada') || streetLower.startsWith('str.') || streetLower.startsWith('str ')) {
      streetPrefix = ''; // Strada este deja în nume
    } else if (streetLower.startsWith('calea')) {
      streetPrefix = ''; // Calea este deja în nume
    } else {
      streetPrefix = 'Strada'; // Adaugă "Strada" pentru nume simple
    }
    
    // Detectează tipul de localitate pentru județ/oraș
    const countyLower = customCounty.toLowerCase();
    const hasCountyPrefix = countyLower.startsWith('sat ') || 
                           countyLower.startsWith('comuna ') || 
                           countyLower.startsWith('oraș ') || 
                           countyLower.startsWith('municipiul ');
    
    // Construiește query-ul cu toate detaliile disponibile
    const addressParts = [];
    
    // Adaugă strada cu prefix dacă e necesar
    if (streetPrefix) {
      addressParts.push(`${streetPrefix} ${customStreet} ${customStreetNumber}`);
    } else {
      addressParts.push(`${customStreet} ${customStreetNumber}`);
    }
    
    // Adaugă orașul
    addressParts.push(customCity);
    
    // Adaugă județul (cu sau fără prefix, așa cum a fost introdus)
    if (customCounty) {
      addressParts.push(customCounty);
    }
    
    addressParts.push('România');
    
    const customerAddress = addressParts.join(', ');
    console.log('  📮 Adresa client (query):', customerAddress);

    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customerAddress)}&limit=1&countrycodes=ro`;
      console.log('  🌐 Geocoding URL:', geocodeUrl);
      
      const response = await fetch(
        geocodeUrl,
        {
          headers: {
            'User-Agent': 'DeliveryLocationManager/1.0'
          }
        }
      );
      const data = await response.json();
      console.log('  🌍 Geocoding response (RAW):', data);
      console.log('  🌍 Geocoding response (JSON):', JSON.stringify(data, null, 2));

      if (data && data.length > 0) {
        const customerLat = parseFloat(data[0].lat);
        const customerLng = parseFloat(data[0].lon);
        console.log('  📍 Coordonate client:', customerLat, customerLng);
        console.log('  📍 Display name găsit:', data[0].display_name);
        console.log('  📍 Type:', data[0].type);
        console.log('  📍 Class:', data[0].class);

        let storeLat = 45.4268;
        let storeLng = 28.0425;

        if (selectedLocation.coordinates) {
          try {
            const coords = JSON.parse(selectedLocation.coordinates);
            storeLat = coords.lat;
            storeLng = coords.lng;
            console.log('  🏠 Coordonate sediu (din DB):', storeLat, storeLng);
          } catch (e) {
            console.warn('  ⚠️ Nu s-au putut parsa coordonatele sediului');
          }
        } else {
          console.log('  🏠 Coordonate sediu (default Galați):', storeLat, storeLng);
        }

        const distance = calculateDistance(storeLat, storeLng, customerLat, customerLng);
        console.log('  📏 Distanță calculată (Haversine):', distance.toFixed(2), 'km');
        console.log('  📏 Rază maximă permisă:', selectedLocation.deliveryRadius, 'km');
        console.log('  📏 Diferență:', (distance - selectedLocation.deliveryRadius).toFixed(2), 'km');

        if (distance > selectedLocation.deliveryRadius) {
          console.log('  ❌ ADRESA ÎN AFARA RAZEI');
          setIsAddressValid(false);
          setAddressValidationMessage(
            `❌ Adresa ta este în afara razei de livrare! Distanța: ${distance.toFixed(1)} km (maxim ${selectedLocation.deliveryRadius} km)`
          );
        } else {
          console.log('  ✅ ADRESA ÎN RAZĂ');
          setIsAddressValid(true);
          setAddressValidationMessage(
            `✅ Adresa ta este în raza de livrare! Distanța: ${distance.toFixed(1)} km`
          );
        }
      } else {
        console.log('  ⚠️ Nu s-au găsit coordonate pentru adresă');
        setIsAddressValid(null);
        setAddressValidationMessage('⚠️ Nu am putut verifica adresa. Vom verifica manual.');
      }
    } catch (error) {
      console.error('  ❌ Eroare la validarea adresei:', error);
      setIsAddressValid(null);
      setAddressValidationMessage('⚠️ Nu am putut verifica adresa. Vom verifica manual.');
    } finally {
      setValidatingAddress(false);
    }
  };

  // Validare automată când se schimbă adresa - ELIMINATĂ
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     validateCustomAddress();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [customCity, customCounty, customStreet, customStreetNumber, useCustomAddress, selectedDeliveryLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validare adresă personalizată (câmpuri separate)
    if (useCustomAddress) {
      if (!customCity.trim() || !customCounty.trim() || !customStreet.trim() || !customStreetNumber.trim()) {
        alert('Te rog completează toate câmpurile obligatorii pentru adresa personalizată (Oraș, Județ, Stradă, Număr)');
        return;
      }
      
      // VERIFICARE RAZĂ DE LIVRARE pentru adrese personalizate
      const selectedLocation = deliveryLocations.find(loc => loc.id === selectedDeliveryLocation);
      if (selectedLocation && selectedLocation.deliveryRadius && selectedLocation.deliveryRadius > 0) {
        // Construiește adresa clientului pentru geocoding
        const customerAddress = `${customStreet} ${customStreetNumber}, ${customCity}, ${customCounty}, România`;
        
        console.log('📍 Verificare rază de livrare...');
        console.log('  Adresa client:', customerAddress);
        console.log('  Raza maximă:', selectedLocation.deliveryRadius, 'km');
        
        try {
          // Geocodează adresa clientului
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customerAddress)}&limit=1&countrycodes=ro`,
            {
              headers: {
                'User-Agent': 'DeliveryLocationManager/1.0'
              }
            }
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            const customerLat = parseFloat(data[0].lat);
            const customerLng = parseFloat(data[0].lon);
            
            console.log('  Coordonate client:', customerLat, customerLng);
            
            // Obține coordonatele sediului principal
            let storeLat = 45.4268; // Default Galați
            let storeLng = 28.0425;
            
            if (selectedLocation.coordinates) {
              try {
                const coords = JSON.parse(selectedLocation.coordinates);
                storeLat = coords.lat;
                storeLng = coords.lng;
              } catch (e) {
                console.warn('Nu s-au putut parsa coordonatele sediului');
              }
            }
            
            console.log('  Coordonate sediu:', storeLat, storeLng);
            
            // Calculează distanța folosind formula Haversine
            const distance = calculateDistance(storeLat, storeLng, customerLat, customerLng);
            
            console.log('  Distanță calculată:', distance.toFixed(2), 'km');
            
            if (distance > selectedLocation.deliveryRadius) {
              alert(`❌ Adresa ta este în afara razei de livrare!\n\n` +
                    `📍 Distanța de la magazin: ${distance.toFixed(1)} km\n` +
                    `📏 Raza maximă de livrare: ${selectedLocation.deliveryRadius} km\n\n` +
                    `Te rugăm să alegi o altă adresă sau să ne contactezi pentru opțiuni suplimentare.`);
              return;
            }
            
            console.log('✅ Adresa este în raza de livrare');
          } else {
            // Nu s-au găsit coordonate - avertizează dar permite comanda
            console.warn('⚠️ Nu s-au putut verifica coordonatele adresei');
            const proceed = confirm(
              '⚠️ Nu am putut verifica automat dacă adresa ta este în raza de livrare.\n\n' +
              'Vrei să continui cu comanda? (Vom verifica manual și te vom contacta dacă este necesar)'
            );
            if (!proceed) return;
          }
        } catch (error) {
          console.error('Eroare la verificarea razei de livrare:', error);
          // Permite comanda să continue în caz de eroare
          const proceed = confirm(
            '⚠️ Nu am putut verifica automat dacă adresa ta este în raza de livrare.\n\n' +
            'Vrei să continui cu comanda? (Vom verifica manual și te vom contacta dacă este necesar)'
          );
          if (!proceed) return;
        }
      }
    }

    // Validare locație de livrare
    if (!useCustomAddress && !selectedDeliveryLocation) {
      alert('Te rog selectează o locație de livrare sau completează adresa personalizată');
      return;
    }

    // Verifică stocul înainte de a plasa comanda
    const stockAvailable = await checkAllStock();
    if (!stockAvailable) {
      alert('Unele produse nu mai sunt disponibile în cantitatea dorită. Te rugăm să verifici coșul.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Obține timpul local și locația
      const now = new Date();
      const orderLocalTime = now.toLocaleString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      const orderTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Obține locația - versiune simplificată și robustă
      let orderLocation = 'București, România'; // Default pentru România
      
      console.log('🌍 Începe obținerea locației...');
      
      try {
        // Încearcă API-ul de geolocație cu timeout scurt
        const response = await Promise.race([
          fetch('https://ipapi.co/json/', {
            headers: { 'Accept': 'application/json' }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]) as Response;
        
        if (response && response.ok) {
          const data = await response.json();
          console.log('📍 Date API locație:', data);
          
          if (data && !data.error) {
            if (data.city && data.country_name) {
              orderLocation = `${data.city}, ${data.country_name}`;
            } else if (data.country_name) {
              orderLocation = data.country_name;
            } else if (data.city) {
              orderLocation = `${data.city}, România`;
            }
            console.log('✅ Locație obținută din API:', orderLocation);
          }
        }
      } catch (error) {
        console.log('⚠️ Nu s-a putut obține locația din API:', error);
        
        // Fallback la timezone
        if (orderTimezone.includes('Bucharest')) {
          orderLocation = 'București, România';
        } else if (orderTimezone.includes('Europe')) {
          orderLocation = 'Europa';
        }
        console.log('🕐 Folosesc locația din timezone:', orderLocation);
      }
      
      console.log('🎯 LOCAȚIE FINALĂ PENTRU SALVARE:', orderLocation);

      // Construiește adresa pentru comandă
      let finalShippingAddress = '';
      if (useCustomAddress) {
        // Construiește adresa din câmpurile separate
        const addressParts = [];
        if (customStreet) addressParts.push(customStreet);
        if (customStreetNumber) addressParts.push(`nr. ${customStreetNumber}`);
        if (customAddressDetails) addressParts.push(customAddressDetails);
        if (customCity) addressParts.push(customCity);
        if (customCounty) addressParts.push(`Județul ${customCounty}`);
        finalShippingAddress = addressParts.join(', ');
      } else if (selectedDeliveryLocation) {
        // Folosește adresa locației selectate
        finalShippingAddress = deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)?.address || '';
      } else {
        finalShippingAddress = shippingAddress;
      }
      
      // Găsește metoda de plată selectată și extrage tipul
      const selectedPaymentMethod = paymentMethods.find(m => m.id === paymentMethod);
      const paymentMethodType = (selectedPaymentMethod?.type || 'cash').toLowerCase(); // Convertește la lowercase pentru validare
      
      const orderData = {
        items: cart.items.map((item: any) => ({
          dataItemId: item.dataItemId || item.dataItem?.id,
          quantity: item.quantity,
          price: item.dataItem?.price || item.price,
        })),
        total: appliedVoucher ? appliedVoucher.finalTotal : cart.total,
        shippingAddress: finalShippingAddress,
        paymentMethod: paymentMethodType, // Trimite tipul, nu ID-ul
        deliveryMethod: 'courier', // Setăm automat la courier
        deliveryLocationId: selectedDeliveryLocation || null,
        voucherCode: appliedVoucher ? voucherCode : undefined,
        orderLocalTime,
        orderLocation,
        orderTimezone,
      };

      console.log('Creating order:', orderData);
      console.log('📦 Order details:');
      console.log('  - Items:', orderData.items);
      console.log('  - Total:', orderData.total);
      console.log('  - Shipping address:', orderData.shippingAddress);
      console.log('  - Payment method:', orderData.paymentMethod);
      console.log('  - Delivery method:', orderData.deliveryMethod);
      console.log('  - Delivery location ID:', orderData.deliveryLocationId);
      
      const orderResponse = await orderAPI.create(orderData);
      console.log('Order created:', orderResponse.data);
      
      // Dacă metoda de plată este card, afișează simulatorul de plată (folosim variabila declarată mai sus)
      if (selectedPaymentMethod && selectedPaymentMethod.type === 'card') {
        setPendingOrderId(orderResponse.data.id);
        setShowPaymentSimulator(true);
        return; // Nu continuă cu finalizarea comenzii încă
      }
      
      // Pentru alte metode de plată, finalizează comanda direct
      await finalizeOrder();
    } catch (error: any) {
      console.error('Order error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Eroare la plasare comandă';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const finalizeOrder = async () => {
    try {
      // Try to clear cart, but don't fail if it's already empty
      try {
        await cartAPI.clearCart();
        console.log('Cart cleared');
      } catch (cartError) {
        console.warn('Cart clear failed (may already be empty):', cartError);
      }
      
      // Refresh cart count in navbar
      await refreshCartCount();
      
      alert('Comandă plasată cu succes!');
      router.push('/orders?success=true');
    } catch (error) {
      console.error('Finalize order error:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentSimulator(false);
    setPendingOrderId(null);
    finalizeOrder();
  };

  const handlePaymentCancel = () => {
    setShowPaymentSimulator(false);
    setPendingOrderId(null);
    // Opțional: anulează comanda dacă a fost creată
    alert('Plata a fost anulată. Comanda nu a fost finalizată.');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-4">Coșul tău este gol</h1>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continuă cumpărăturile
        </button>
      </div>
    );
  }

  const finalTotal = appliedVoucher ? appliedVoucher.finalTotal : cart.total;

  // Review Modal
  if (showReview) {
    // Calculate delivery cost
    const deliveryCost = deliveryFee;
    const totalWithDelivery = finalTotal + deliveryCost;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">✅ Verifică comanda</h1>
          
          {/* Order Summary */}
          <div className="space-y-6">
            {/* Products */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-3">📦 Produse comandate</h2>
              <div className="space-y-2">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{stripHtml(item.dataItem.title)} x {item.quantity}</span>
                    <span className="font-semibold">{(item.quantity * item.dataItem.price).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-3">🚚 Livrare</h2>
              <div className="text-sm space-y-1">
                {useCustomAddress ? (
                  <div>
                    <p><strong>Adresă personalizată:</strong></p>
                    <p className="ml-4 text-gray-600">
                      {[
                        customStreet,
                        customStreetNumber && `nr. ${customStreetNumber}`,
                        customAddressDetails,
                        customCity,
                        customCounty && `Județul ${customCounty}`
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ) : selectedDeliveryLocation ? (
                  <div>
                    <p><strong>Locația de livrare:</strong></p>
                    {(() => {
                      const location = deliveryLocations.find(loc => loc.id === selectedDeliveryLocation);
                      return location ? (
                        <div className="ml-4 text-gray-600">
                          <p>{location.name}</p>
                          <p>📍 {location.address}, {location.city}</p>
                          {location.phone && <p>📞 {location.phone}</p>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : null}
                <p><strong>Cost livrare:</strong> {deliveryCost.toFixed(2)} RON</p>
              </div>
            </div>

            {/* Payment */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-3">💳 Plată</h2>
              <p className="text-sm">
                <strong>Metodă:</strong> {
                  paymentMethods.find(m => m.id === paymentMethod)?.name || 'Necunoscută'
                }
              </p>
            </div>

            {/* Total */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal produse:</span>
                  <span>{cart.total.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livrare:</span>
                  <span>{deliveryCost.toFixed(2)} RON</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedVoucher.voucher.code}):</span>
                    <span>-{appliedVoucher.discount.toFixed(2)} RON</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-xl font-bold">
                  <span>Total de plată:</span>
                  <span className="text-blue-600">{totalWithDelivery.toFixed(2)} RON</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                ← Înapoi la editare
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Se procesează...' : '✓ Confirmă comanda'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <span className="text-3xl">🛍️</span>
          Finalizare comandă
        </h1>
        <p className="text-blue-100 mt-2 text-sm">Verifică și confirmă detaliile comenzii tale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-blue-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Produse ({cart.itemCount})
              </h2>
              <button
                onClick={() => router.push('/cart')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                ✏️ Editează coșul
              </button>
            </div>
            <div className="space-y-3">
              {cart.items.map((item: any) => {
                // Verifică dacă este produs cadou
                const isGiftProduct = item.isGift === true || item.giftRuleId != null;
                
                return (
                <div key={item.id} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  <img
                    src={item.dataItem.image}
                    alt={stripHtml(item.dataItem.title)}
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{stripHtml(item.dataItem.title)}</h3>
                      {isGiftProduct && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          🎁 CADOU
                        </span>
                      )}
                    </div>
                    <StockIndicator 
                      productId={item.dataItemId || item.dataItem?.id} 
                      quantity={item.quantity}
                      showDetails={true}
                      className="mb-2"
                    />
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {!isGiftProduct ? (
                        // Butoane normale pentru produse obișnuite
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 shadow-sm">
                          <button
                            onClick={async () => {
                              try {
                                // Calculează step-ul corect bazat pe priceType
                                const step = item.dataItem.priceType === 'fixed' 
                                  ? 1 
                                  : (item.dataItem.availableQuantities?.[0] || item.dataItem.minQuantity || 0.5);
                                const minQty = step;
                                const newQuantity = Math.max(minQty, item.quantity - step);
                                await cartAPI.updateQuantity(item.id, newQuantity);
                                fetchCart();
                              } catch (error) {
                                console.error('Failed to update quantity:', error);
                              }
                            }}
                            className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center rounded-l-lg transition-colors disabled:opacity-50"
                            disabled={item.quantity <= (item.dataItem.priceType === 'fixed' ? 1 : (item.dataItem.availableQuantities?.[0] || item.dataItem.minQuantity || 0.5))}
                          >
                            <span className="text-lg font-bold">−</span>
                          </button>
                          <span className="w-12 text-center font-bold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={async () => {
                              try {
                                // Calculează step-ul corect bazat pe priceType
                                const step = item.dataItem.priceType === 'fixed' 
                                  ? 1 
                                  : (item.dataItem.availableQuantities?.[0] || item.dataItem.minQuantity || 0.5);
                                const newQuantity = item.quantity + step;
                                await cartAPI.updateQuantity(item.id, newQuantity);
                                fetchCart();
                              } catch (error) {
                                console.error('Failed to update quantity:', error);
                              }
                            }}
                            className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center rounded-r-lg transition-colors disabled:opacity-50"
                            disabled={item.quantity >= (item.dataItem.availableStock || item.dataItem.stock)}
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                        </div>
                      ) : (
                        // Afișare cantitate fixă pentru produse cadou
                        <div className="flex items-center gap-2 bg-green-50 rounded-lg border border-green-300 px-3 py-2">
                          <span className="text-sm font-semibold text-green-800">Cantitate: {item.quantity}</span>
                          <span className="text-xs text-green-600">(cadou - cantitate fixă)</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
                        💰 {isGiftProduct ? '0.00' : item.dataItem.price.toFixed(2)} RON / buc
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className={`font-bold text-lg px-3 py-1 rounded-lg ${
                      isGiftProduct ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
                    }`}>
                      {isGiftProduct ? 'GRATUIT' : `${(item.quantity * item.dataItem.price).toFixed(2)} RON`}
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Sigur vrei să ștergi acest produs?')) {
                          try {
                            await cartAPI.removeFromCart(item.id);
                            fetchCart();
                          } catch (error) {
                            console.error('Failed to remove item:', error);
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Gift Products Section */}
          {eligibleRules.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-md border-2 border-green-300">
              <h2 className="text-xl font-bold mb-3 text-green-800 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                Produse Cadou Disponibile
              </h2>
              <p className="text-sm text-green-700 mb-4 bg-white bg-opacity-60 p-3 rounded-lg">
                ✨ Felicitări! Coșul tău îndeplinește condițiile pentru următoarele cadouri:
              </p>
              
              {eligibleRules.map((eligibleRule) => (
                <div key={eligibleRule.rule.id} className="bg-white p-4 rounded-lg mb-4 last:mb-0">
                  <h3 className="font-semibold text-lg mb-2">{eligibleRule.rule.name}</h3>
                  {eligibleRule.rule.description && (
                    <p className="text-sm text-gray-600 mb-3">{eligibleRule.rule.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eligibleRule.availableProducts.map((giftProduct) => (
                      <div 
                        key={giftProduct.id} 
                        className="border rounded-lg p-3 hover:border-green-500 transition-colors"
                      >
                        <div className="flex gap-3">
                          <img
                            src={giftProduct.product.image}
                            alt={stripHtml(giftProduct.product.title)}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{stripHtml(giftProduct.product.title)}</h4>
                            <p className="text-xs text-gray-500 line-through">
                              {giftProduct.product.price.toFixed(2)} RON
                            </p>
                            <p className="text-sm font-bold text-green-600">GRATUIT</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await selectGift(eligibleRule.rule.id, giftProduct.productId);
                              await fetchCart();
                            } catch (error) {
                              console.error('Failed to select gift:', error);
                            }
                          }}
                          disabled={isEvaluating}
                          className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                        >
                          {isEvaluating ? 'Se adaugă...' : 'Adaugă Cadou'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Location Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-blue-100 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              Locația de livrare
            </h2>
            
            {/* Toate locațiile (inclusiv "Localități limitrofe" din baza de date) */}
            {deliveryLocations.length > 0 && (
                <div className="space-y-3">
                  {deliveryLocations.map((location) => {
                    // Verifică dacă această locație este "Localități limitrofe" - verificare mai flexibilă
                    const locationNameLower = location.name.toLowerCase();
                    const isCustomLocation = locationNameLower.includes('limitrofe') || 
                                            locationNameLower.includes('personalizat') ||
                                            locationNameLower.includes('alta') ||
                                            location.name === 'Localități limitrofe';
                    
                    // Verifică dacă locația este blocată
                    const isBlocked = blockedDeliveryLocations.includes(location.id);
                    
                    console.log('📍 Location:', location.name, '| isCustomLocation:', isCustomLocation, '| useCustomAddress:', useCustomAddress, '| isBlocked:', isBlocked);
                    
                    return (
                      <label key={location.id} className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                        isBlocked 
                          ? 'bg-gray-100 opacity-60 cursor-not-allowed border-gray-300' 
                          : 'cursor-pointer hover:bg-blue-50 hover:border-blue-400 bg-white shadow-sm'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryLocation"
                          value={location.id}
                          checked={selectedDeliveryLocation === location.id}
                          onChange={(e) => {
                            console.log('🔄 Location changed to:', location.name, '| isCustomLocation:', isCustomLocation);
                            handleDeliveryLocationChange(e.target.value);
                            // Dacă este locația "Localități limitrofe", activează textarea
                            if (isCustomLocation) {
                              console.log('✅ Activating custom address textarea');
                              setUseCustomAddress(true);
                            } else {
                              console.log('❌ Deactivating custom address textarea');
                              setUseCustomAddress(false);
                            }
                          }}
                          disabled={isBlocked}
                          className="w-5 h-5 mt-1 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
                            {location.name}
                            {location.isMainLocation && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                ⭐ Principală
                              </span>
                            )}
                            {isBlocked && (
                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                🚫 Temporar indisponibilă
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                            <span>📍</span>
                            <span>{location.address}, {location.city}</span>
                          </div>
                          {location.phone && (
                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <span>📞</span>
                              <span>{location.phone}</span>
                            </div>
                          )}
                          {isBlocked && (
                            <div className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                              Această locație de livrare este temporar blocată
                            </div>
                          )}
                          {!isBlocked && location.deliveryFee !== undefined && (
                            <div className="text-sm font-medium text-green-700 mt-2 bg-green-50 px-3 py-1 rounded-lg inline-block">
                              💰 Cost livrare: {location.deliveryFee === 0 ? 'GRATUIT' : `${location.deliveryFee} RON`}
                              {location.freeDeliveryThreshold && location.deliveryFee > 0 && (
                                <span className="text-xs ml-1">
                                  (Gratuit peste {location.freeDeliveryThreshold} RON)
                                </span>
                              )}
                            </div>
                          )}
                          {!isBlocked && location.specialInstructions && (
                            <div className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
                              <span>ℹ️</span>
                              <span>{location.specialInstructions}</span>
                            </div>
                          )}
                          {!isBlocked && location.workingHours && (
                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <span>🕒</span>
                              <span>Program: {(() => {
                                try {
                                  // workingHours vine deja ca obiect din API
                                  const hours = location.workingHours;
                                  
                                  const today = new Date().getDay();
                                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                  const todayHours = hours[dayNames[today]];
                                  
                                  // Verifică dacă este string simplu (ex: "09:00-18:00" sau "Închis")
                                  if (typeof todayHours === 'string') {
                                    return todayHours === 'Închis' || todayHours === 'Closed' 
                                      ? 'Astăzi: Închis' 
                                      : `Astăzi: ${todayHours}`;
                                  } 
                                  // Sau obiect cu isOpen, start, end
                                  else if (todayHours?.isOpen) {
                                    return `Astăzi: ${todayHours.start}-${todayHours.end}`;
                                  } else {
                                    return 'Astăzi: Închis';
                                  }
                                } catch (error) {
                                  console.error('Error parsing working hours:', error);
                                  return 'Program disponibil la locație';
                                }
                              })()}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Adresă personalizată - afișată doar când se selectează locația "Localități limitrofe" */}
              {useCustomAddress && (
                <div className="space-y-4 mt-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                  <div className="p-3 bg-blue-100 border-l-4 border-blue-600 rounded">
                    <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      Introdu adresa ta completă pentru livrare în localități limitrofe
                    </p>
                  </div>
                  
                  {/* Câmpuri separate pentru adresă */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🏙️</span>
                        Oraș *
                      </label>
                      <input
                        type="text"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Galați"
                        required
                      />
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🗺️</span>
                        Județ *
                      </label>
                      <input
                        type="text"
                        value={customCounty}
                        onChange={(e) => setCustomCounty(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Galați"
                        required
                      />
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🛣️</span>
                        Stradă *
                      </label>
                      <input
                        type="text"
                        value={customStreet}
                        onChange={(e) => setCustomStreet(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Garii"
                        required
                      />
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🔢</span>
                        Număr *
                      </label>
                      <input
                        type="text"
                        value={customStreetNumber}
                        onChange={(e) => setCustomStreetNumber(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: 65"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🏢</span>
                        Detalii (Bloc, Scară, Apartament)
                      </label>
                      <input
                        type="text"
                        value={customAddressDetails}
                        onChange={(e) => setCustomAddressDetails(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Bloc A3, Scara 2, Ap. 15"
                      />
                    </div>
                  </div>
                  
                  {/* Buton de verificare manuală */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={validateCustomAddress}
                      disabled={validatingAddress || !customCity.trim() || !customStreet.trim() || !customStreetNumber.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      {validatingAddress ? (
                        <>
                          <span className="animate-spin">🔄</span>
                          Se verifică...
                        </>
                      ) : (
                        <>
                          📍 Verifică Locația
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Mesaj validare adresă */}
                  {validatingAddress && (
                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                      <p className="text-sm text-gray-600">
                        🔄 Se verifică adresa...
                      </p>
                    </div>
                  )}
                  
                  {!validatingAddress && addressValidationMessage && (
                    <div className={`p-3 border-2 rounded-lg ${
                      isAddressValid === true ? 'bg-green-50 border-green-300' :
                      isAddressValid === false ? 'bg-red-50 border-red-300' :
                      'bg-yellow-50 border-yellow-300'
                    }`}>
                      <p className={`text-sm font-medium ${
                        isAddressValid === true ? 'text-green-800' :
                        isAddressValid === false ? 'text-red-800' :
                        'text-yellow-800'
                      }`}>
                        {addressValidationMessage}
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      🚚 Informații Livrare la Domiciliu
                    </p>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>
                        <strong>Livram la domiciliu clientului pe o rază de {
                          (() => {
                            const selectedLoc = deliveryLocations.find(loc => loc.id === selectedDeliveryLocation);
                            console.log('🔍 Selected location for radius display:', selectedLoc);
                            console.log('🔍 Delivery radius value:', selectedLoc?.deliveryRadius);
                            return selectedLoc?.deliveryRadius || 0;
                          })()
                        } km</strong> a localității <strong>{
                          deliveryLocations.find(loc => loc.isMainLocation)?.city || 'Galați'
                        }</strong>.
                      </p>
                      <p>
                        📍 Distanța se calculează de la adresa: <strong>{
                          deliveryLocations.find(loc => loc.isMainLocation)?.address || 'Str. Garii nr. 69, Galați, Județul Galați'
                        }</strong>
                      </p>
                      <p>
                        💰 Costul de livrare este de <strong>{
                          deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)?.deliveryFee || 30
                        } RON</strong>
                        {deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)?.freeDeliveryThreshold && 
                         deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)!.freeDeliveryThreshold! > 0 && (
                          <span> (gratuită peste {deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)!.freeDeliveryThreshold} RON)</span>
                        )}
                      </p>
                      <p>
                        📅 Livrarea se va face în ziua de <strong>{
                          deliverySchedule?.deliveryDays?.length > 0 ? 
                            deliverySchedule.deliveryDays.map((day: number) => 
                              ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'][day]
                            ).join(', ') :
                            'conform programului stabilit'
                        }</strong>
                        {deliverySchedule?.deliveryTimeSlots?.[0] && (
                          <span>, între orele <strong>{deliverySchedule.deliveryTimeSlots[0].startTime}-{deliverySchedule.deliveryTimeSlots[0].endTime}</strong></span>
                        )}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded border border-blue-300 mt-3">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        📞 Contact pentru detalii:
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Telefon:</strong> {contactInfo?.phone || '+40 753615752'}<br/>
                        <strong>Email:</strong> {contactInfo?.email || 'crys.cristi@yahoo.com'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Shipping Address - REMOVED, now integrated above */}

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-blue-100 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Metodă de plată
            </h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isBlocked = blockedPaymentMethods.includes(method.id);
                return (
                  <label 
                    key={method.id} 
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                      isBlocked 
                        ? 'bg-gray-100 opacity-60 cursor-not-allowed border-gray-300' 
                        : 'cursor-pointer hover:bg-blue-50 hover:border-blue-400 bg-white shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isBlocked}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">{method.icon || '💳'}</span>
                        <span>{method.name}</span>
                        {isBlocked && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                            🚫 Temporar indisponibil
                          </span>
                        )}
                      </div>
                      {method.description && (
                        <div className="text-sm text-gray-600 mt-1">{method.description}</div>
                      )}
                      {isBlocked && (
                        <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                          Această metodă de plată este temporar blocată
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="space-y-6">
          {/* Voucher */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-blue-100 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎟️</span>
              Voucher
            </h2>
            {!appliedVoucher ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Cod voucher"
                />
                <button
                  onClick={applyVoucher}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
                >
                  ✓ Aplică
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                  <span className="font-bold text-green-800 flex items-center gap-2">
                    <span className="text-xl">✓</span>
                    {appliedVoucher.voucher.code}
                  </span>
                  <button
                    onClick={removeVoucher}
                    className="text-red-600 hover:text-red-800 font-bold text-lg px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-green-700 font-medium bg-green-50 p-3 rounded-lg">
                  💰 Discount: -{appliedVoucher.discount.toFixed(2)} RON
                </p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border-2 border-blue-300">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-blue-200 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Sumar comandă
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700 bg-white p-3 rounded-lg">
                <span className="font-medium">Subtotal produse:</span>
                <span className="font-semibold">{cart.total.toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between text-gray-700 bg-white p-3 rounded-lg">
                <span className="font-medium">Livrare:</span>
                <span className="font-semibold">{deliveryFee.toFixed(2)} RON</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-green-700 bg-green-50 p-3 rounded-lg border border-green-300">
                  <span className="font-medium">Discount voucher:</span>
                  <span className="font-semibold">-{appliedVoucher.discount.toFixed(2)} RON</span>
                </div>
              )}
              <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-xl font-bold bg-white p-4 rounded-lg shadow-sm">
                <span className="text-gray-800">Total de plată:</span>
                <span className="text-blue-600">
                  {(finalTotal + deliveryFee).toFixed(2)} RON
                </span>
              </div>
            </div>
            {stockErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-800 text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Probleme cu stocul:
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  {stockErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isDeliveryBlocked && (
              <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                <p className="text-orange-900 text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="text-lg">🚫</span>
                  Comenzile sunt temporar blocate
                </p>
                <p className="text-orange-800 text-sm">{blockReason}</p>
              </div>
            )}
            {user?.role === 'guest' && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-yellow-900 text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="text-lg">👁️</span>
                  Cont Vizitator
                </p>
                <p className="text-yellow-800 text-sm">Nu poți plasa comenzi cu un cont de vizitator. Creează un cont real pentru a cumpăra.</p>
              </div>
            )}
            <button
              onClick={() => setShowReview(true)}
              disabled={submitting || checking || stockErrors.length > 0 || isDeliveryBlocked ||
                       (useCustomAddress && !shippingAddress.trim()) ||
                       (!useCustomAddress && !selectedDeliveryLocation) ||
                       user?.role === 'guest'}
              className={`w-full mt-4 px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg ${
                user?.role === 'guest'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105'
              }`}
              title={user?.role === 'guest' ? 'Contul de vizitator nu poate plasa comenzi' : (isDeliveryBlocked ? blockReason : '')}
            >
              {user?.role === 'guest' ? '🔒 Blocat pentru vizitatori' : (checking ? '🔄 Verificare stoc...' : isDeliveryBlocked ? '🚫 Comenzi blocate' : '✓ Continuă la verificare →')}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Simulator Modal */}
      {showPaymentSimulator && pendingOrderId && (
        <PaymentSimulator
          orderId={pendingOrderId}
          amount={finalTotal + deliveryFee}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
