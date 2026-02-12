'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI, voucherAPI, orderAPI } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useStockCheck } from '@/components/StockIndicator';
import StockIndicator from '@/components/StockIndicator';
import PaymentSimulator from '@/components/PaymentSimulator';

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshCartCount } = useCart();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('');
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [deliveryLocations, setDeliveryLocations] = useState<any[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showPaymentSimulator, setShowPaymentSimulator] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  
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
    fetchDeliveryMethods();
    fetchPaymentMethods();
    fetchContactInfo();
    if (user?.address) {
      setShippingAddress(user.address);
    }
  }, [user]);

  // Refresh cart when returning to page
  useEffect(() => {
    const handleFocus = () => {
      fetchCart();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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

  const fetchDeliveryLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      const locations = await response.json();
      setDeliveryLocations(locations);
      
      // Set main location as default
      const mainLocation = locations.find((loc: any) => loc.isMainLocation);
      if (mainLocation) {
        setSelectedDeliveryLocation(mainLocation.id);
        calculateDeliveryFee(mainLocation.id);
      }
    } catch (error) {
      console.error('Failed to fetch delivery locations:', error);
    }
  };

  const fetchDeliveryMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-methods`);
      const methods = await response.json();
      setDeliveryMethods(methods);
      
      // Set first method as default
      if (methods.length > 0) {
        setDeliveryMethod(methods[0].id);
        setDeliveryFee(methods[0].deliveryCost || 0);
      }
    } catch (error) {
      console.error('Failed to fetch delivery methods:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/payment-methods`);
      const methods = await response.json();
      setPaymentMethods(methods);
      
      // Set first method as default
      if (methods.length > 0) {
        setPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/contact-info`);
      const data = await response.json();
      setContactInfo(data);
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  const calculateDeliveryFee = (locationId?: string) => {
    if (!cart) {
      setDeliveryFee(0);
      return;
    }

    // Găsește metoda de livrare selectată
    const selectedMethod = deliveryMethods.find(m => m.id === deliveryMethod);
    if (!selectedMethod) {
      setDeliveryFee(0);
      return;
    }

    // Verifică dacă livrarea este gratuită peste un anumit prag
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.dataItem?.price || 0) * item.quantity;
    }, 0);

    if (selectedMethod.freeDeliveryThreshold && subtotal >= selectedMethod.freeDeliveryThreshold) {
      setDeliveryFee(0);
      return;
    }

    setDeliveryFee(selectedMethod.deliveryCost || 0);
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

  const handleDeliveryMethodChange = (methodId: string) => {
    setDeliveryMethod(methodId);
    const method = deliveryMethods.find(m => m.id === methodId);
    if (method) {
      setDeliveryFee(method.deliveryCost || 0);
      // Recalculează taxa dacă există prag de livrare gratuită
      if (selectedDeliveryLocation) {
        calculateDeliveryFee(selectedDeliveryLocation);
      }
    }
  };

  const handleDeliveryLocationChange = (locationId: string) => {
    setSelectedDeliveryLocation(locationId);
    if (deliveryMethod === 'courier') {
      calculateDeliveryFee(locationId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validare adresă pentru courier
    if (selectedMethod?.type === 'courier') {
      if (useCustomAddress && !shippingAddress.trim()) {
        alert('Te rog introdu adresa de livrare personalizată');
        return;
      }
      if (!useCustomAddress && !selectedDeliveryLocation) {
        alert('Te rog selectează o locație de livrare sau introdu o adresă personalizată');
        return;
      }
    }

    // Validare locație pentru pickup
    if (selectedMethod?.type === 'pickup' && !selectedDeliveryLocation) {
      alert('Te rog selectează o locație de ridicare');
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

      const orderData = {
        items: cart.items.map((item: any) => ({
          dataItemId: item.dataItemId || item.dataItem?.id,
          quantity: item.quantity,
          price: item.dataItem?.price || item.price,
        })),
        total: appliedVoucher ? appliedVoucher.finalTotal : cart.total,
        shippingAddress: useCustomAddress ? shippingAddress : (
          selectedDeliveryLocation ? 
            deliveryLocations.find(loc => loc.id === selectedDeliveryLocation)?.address : 
            shippingAddress
        ),
        paymentMethod,
        deliveryMethod,
        deliveryLocationId: selectedDeliveryLocation || null,
        voucherCode: appliedVoucher ? voucherCode : undefined,
        orderLocalTime,
        orderLocation,
        orderTimezone,
      };

      console.log('Creating order:', orderData);
      const orderResponse = await orderAPI.create(orderData);
      console.log('Order created:', orderResponse.data);
      
      // Dacă metoda de plată este card, afișează simulatorul de plată
      const selectedPaymentMethod = paymentMethods.find(m => m.id === paymentMethod);
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
  const selectedMethod = deliveryMethods.find(m => m.id === deliveryMethod);

  // Review Modal
  if (showReview) {
    // Calculate delivery cost based on selected method
    const selectedMethod = deliveryMethods.find(m => m.id === deliveryMethod);
    const deliveryCost = selectedMethod?.deliveryCost || 0;
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
                    <span>{item.dataItem.title} x {item.quantity}</span>
                    <span className="font-semibold">{(item.quantity * item.dataItem.price).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-3">🚚 Livrare</h2>
              <div className="text-sm space-y-1">
                <p><strong>Metodă:</strong> {deliveryMethods.find(m => m.id === deliveryMethod)?.name || 'Necunoscută'}</p>
                {selectedMethod?.type === 'courier' && (
                  <>
                    {useCustomAddress ? (
                      <div>
                        <p><strong>Adresă personalizată:</strong></p>
                        <p className="ml-4 text-gray-600">{shippingAddress}</p>
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
                  </>
                )}
                {selectedMethod?.type === 'pickup' && selectedDeliveryLocation && (
                  <div>
                    <p><strong>Locația de ridicare:</strong></p>
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
                )}
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🛍️ Finalizare comandă</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Produse ({cart.itemCount})</h2>
              <button
                onClick={() => router.push('/cart')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ✏️ Editează coșul
              </button>
            </div>
            <div className="space-y-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center border-b pb-4 last:border-b-0">
                  <img
                    src={item.dataItem.image}
                    alt={item.dataItem.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.dataItem.title}</h3>
                    <StockIndicator 
                      productId={item.dataItemId || item.dataItem?.id} 
                      quantity={item.quantity}
                      showDetails={true}
                      className="mb-2"
                    />
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await cartAPI.updateQuantity(item.id, Math.max(1, item.quantity - 1));
                              fetchCart();
                            } catch (error) {
                              console.error('Failed to update quantity:', error);
                            }
                          }}
                          className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={async () => {
                            try {
                              await cartAPI.updateQuantity(item.id, item.quantity + 1);
                              fetchCart();
                            } catch (error) {
                              console.error('Failed to update quantity:', error);
                            }
                          }}
                          className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                          disabled={item.quantity >= item.dataItem.stock}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.dataItem.price.toFixed(2)} RON / buc
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600 mb-2">
                      {(item.quantity * item.dataItem.price).toFixed(2)} RON
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
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">🚚 Metodă de livrare</h2>
            <div className="space-y-3">
              {deliveryMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="delivery"
                    value={method.id}
                    checked={deliveryMethod === method.id}
                    onChange={(e) => handleDeliveryMethodChange(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{method.name}</div>
                    <div className="text-sm text-gray-600">
                      {method.deliveryCost === 0 ? 'GRATUIT' : `${method.deliveryCost} RON`}
                      {method.freeDeliveryThreshold && method.deliveryCost > 0 && (
                        <span className="text-green-600 ml-2">
                          (Gratuit peste {method.freeDeliveryThreshold} RON)
                        </span>
                      )}
                    </div>
                    {method.deliveryTimeHours && (
                      <div className="text-xs text-gray-500 mt-1">
                        Timp livrare: {method.deliveryTimeHours}h
                        {method.deliveryTimeDays > 0 && ` - ${method.deliveryTimeDays} zile`}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-blue-600">
                    {method.deliveryCost === 0 ? 'GRATUIT' : `${method.deliveryCost} RON`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Location Selection - For ALL delivery types */}
          {selectedMethod && deliveryLocations.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">
                {selectedMethod.type === 'pickup' ? '📍 Locația de ridicare' : '📍 Locația de livrare'}
              </h2>
              
              {/* Toggle pentru adresă personalizată (doar pentru courier) */}
              {selectedMethod.type === 'courier' && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAddress}
                      onChange={(e) => {
                        setUseCustomAddress(e.target.checked);
                        if (!e.target.checked) {
                          // Resetează la locația principală când se dezactivează adresa personalizată
                          const mainLocation = deliveryLocations.find(loc => loc.isMainLocation);
                          if (mainLocation) {
                            setSelectedDeliveryLocation(mainLocation.id);
                          }
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-blue-900">
                      Vreau să introduc o adresă personalizată
                    </span>
                  </label>
                  <p className="text-xs text-blue-700 mt-1 ml-6">
                    Bifează dacă adresa ta nu este în lista de locații standard
                  </p>
                </div>
              )}

              {/* Locații standard */}
              {!useCustomAddress && (
                <div className="space-y-3">
                  {deliveryLocations.map((location) => (
                    <label key={location.id} className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryLocation"
                        value={location.id}
                        checked={selectedDeliveryLocation === location.id}
                        onChange={(e) => handleDeliveryLocationChange(e.target.value)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {location.name}
                          {location.isMainLocation && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              Principală
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          📍 {location.address}, {location.city}
                        </div>
                        {location.phone && (
                          <div className="text-sm text-gray-600">
                            📞 {location.phone}
                          </div>
                        )}
                        {selectedMethod.type === 'courier' && location.deliveryFee !== undefined && (
                          <div className="text-sm font-medium text-green-600 mt-1">
                            💰 Cost livrare: {location.deliveryFee === 0 ? 'GRATUIT' : `${location.deliveryFee} RON`}
                            {location.freeDeliveryThreshold && location.deliveryFee > 0 && (
                              <span className="text-xs ml-1">
                                (Gratuit peste {location.freeDeliveryThreshold} RON)
                              </span>
                            )}
                          </div>
                        )}
                        {location.specialInstructions && (
                          <div className="text-sm text-blue-600 mt-1">
                            ℹ️ {location.specialInstructions}
                          </div>
                        )}
                        {location.workingHours && (
                          <div className="text-xs text-gray-500 mt-1">
                            🕒 Program: {(() => {
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
                            })()}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Adresă personalizată */}
              {useCustomAddress && selectedMethod.type === 'courier' && (
                <div className="space-y-3">
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-4 py-3 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Introdu adresa completă de livrare (Stradă, Număr, Bloc, Scară, Apartament, Oraș, Județ, Cod poștal)"
                    required
                  />
                  <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      ⚠️ Adresă Personalizată - Taxă Suplimentară
                    </p>
                    <p className="text-sm text-orange-800 mb-3">
                      Pentru adrese în afara locațiilor standard, <strong>se percepe o taxă suplimentară de livrare</strong> care variază în funcție de:
                    </p>
                    <ul className="text-sm text-orange-800 mb-3 ml-4 space-y-1">
                      <li>📍 <strong>Locație</strong> - distanța față de magazin</li>
                      <li>📅 <strong>Data</strong> - ziua livrării</li>
                      <li>🕐 <strong>Ora</strong> - intervalul orar dorit</li>
                    </ul>
                    <div className="bg-orange-100 p-3 rounded border border-orange-300">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        📞 Contactează-ne pentru confirmare și calcul taxă:
                      </p>
                      <p className="text-sm text-orange-800">
                        <strong>Telefon:</strong> {contactInfo?.phone || '+40 753615752'}<br/>
                        <strong>Email:</strong> {contactInfo?.email || 'crys.cristi@yahoo.com'}
                      </p>
                      <p className="text-xs text-orange-700 mt-2 italic">
                        * Comanda va fi confirmată telefonic înainte de procesare
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Address - REMOVED, now integrated above */}

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">💳 Metodă de plată</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {method.icon || '💳'} {method.name}
                    </div>
                    {method.description && (
                      <div className="text-sm text-gray-600">{method.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="space-y-6">
          {/* Voucher */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">🎟️ Voucher</h2>
            {!appliedVoucher ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Cod voucher"
                />
                <button
                  onClick={applyVoucher}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aplică
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-semibold text-green-700">
                    {appliedVoucher.voucher.code}
                  </span>
                  <button
                    onClick={removeVoucher}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-green-600">
                  Discount: -{appliedVoucher.discount.toFixed(2)} RON
                </p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">💰 Sumar</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal produse:</span>
                <span>{cart.total.toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between">
                <span>Livrare:</span>
                <span>{selectedMethod?.deliveryCost?.toFixed(2) || '0.00'} RON</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-green-600">
                  <span>Discount voucher:</span>
                  <span>-{appliedVoucher.discount.toFixed(2)} RON</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-xl font-bold">
                <span>Total de plată:</span>
                <span className="text-blue-600">
                  {(finalTotal + (selectedMethod?.deliveryCost || 0)).toFixed(2)} RON
                </span>
              </div>
            </div>
            {stockErrors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm font-medium">Probleme cu stocul:</p>
                <ul className="text-red-600 text-sm mt-1">
                  {stockErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setShowReview(true)}
              disabled={submitting || checking || stockErrors.length > 0 || 
                       (selectedMethod?.type === 'courier' && useCustomAddress && !shippingAddress.trim()) ||
                       (selectedMethod?.type === 'courier' && !useCustomAddress && !selectedDeliveryLocation) ||
                       (selectedMethod?.type === 'pickup' && !selectedDeliveryLocation)}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {checking ? 'Verificare stoc...' : 'Continuă la verificare →'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Simulator Modal */}
      {showPaymentSimulator && pendingOrderId && (
        <PaymentSimulator
          orderId={pendingOrderId}
          amount={finalTotal + (selectedMethod?.deliveryCost || 0)}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
