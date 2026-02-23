'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import DeliveryLocationItem from '@/components/DeliveryLocationItem';

interface PageContent {
  title: string;
  content: string;
  slug?: string;
  isActive?: boolean;
}

export default function AboutPage() {
  const { t } = useTranslation();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [deliveryLocations, setDeliveryLocations] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [giftRules, setGiftRules] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nu mai încărcăm conținutul paginii din backend - folosim conținut implicit
    fetchContactInfo();
    fetchDeliveryLocations();
    fetchPaymentMethods();
    fetchGiftRules();
    fetchVouchers();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const locationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      let mainLocation = null;
      
      if (locationsResponse.ok) {
        const locations = await locationsResponse.json();
        mainLocation = locations.find((loc: any) => loc.isMainLocation);
      }

      const configResponse = await fetch('/api/public/site-config?keys=contact_email,contact_phone,contact_address');
      let siteConfig = null;
      
      if (configResponse.ok) {
        siteConfig = await configResponse.json();
      }

      setContactInfo({
        email: mainLocation?.email || siteConfig?.contact_email || 'crys.cristi@yahoo.com',
        phone: mainLocation?.phone || siteConfig?.contact_phone || '+40753615752',
        address: mainLocation?.address || siteConfig?.contact_address || 'Str. Garii nr. 69, Galați, România'
      });
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      if (response.ok) {
        const locations = await response.json();
        setDeliveryLocations(locations);
      }
    } catch (error) {
      console.error('Failed to fetch delivery locations:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/payment-methods`);
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchGiftRules = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/gift-rules`);
      if (response.ok) {
        const rules = await response.json();
        console.log('🎁 Gift rules loaded:', rules);
        setGiftRules(rules);
      }
    } catch (error) {
      console.error('Failed to fetch gift rules:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/vouchers`);
      if (response.ok) {
        const vouchersData = await response.json();
        console.log('🎟️ Vouchers loaded:', vouchersData);
        setVouchers(vouchersData);
      }
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t('pages.aboutUs')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('pages.aboutUsSubtitle')}
          </p>
        </div>

        {/* Despre Fermă */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">🌱</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.aboutFarm')}</h2>
          </div>
          
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>{t('pages.aboutFarmContent')}</p>
          </div>
        </div>

        {/* Metode de Livrare */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">🚚</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.deliveryMethods')}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {deliveryLocations.length > 0 ? (
              deliveryLocations.map((location) => (
                <DeliveryLocationItem key={location.id} location={location}>
                  {(translatedName, translatedInstructions) => (
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                      <h3 className="font-bold text-gray-800 mb-2 text-lg">{translatedName}</h3>
                      <p className="text-gray-700 mb-2">📍 {location.address}</p>
                      {location.deliveryRadius > 0 && (
                        <p className="text-gray-700">🎯 {t('pages.deliveryRadius')}: <strong>{location.deliveryRadius} km</strong></p>
                      )}
                      {location.deliveryFee !== undefined && (
                        <p className="text-gray-700">💰 {t('pages.deliveryCost')}: <strong>{location.deliveryFee === 0 ? t('pages.personalPickup') : `${location.deliveryFee} RON`}</strong></p>
                      )}
                      {location.freeDeliveryThreshold > 0 && (
                        <p className="text-green-600 font-medium">🎁 {t('pages.freeDeliveryOver')} {location.freeDeliveryThreshold} RON</p>
                      )}
                      {(location.deliveryRadius === 0 || !location.deliveryRadius) && location.isMainLocation && (
                        <p className="text-green-600 font-medium">✅ {t('pages.personalPickup')}</p>
                      )}
                    </div>
                  )}
                </DeliveryLocationItem>
              ))
            ) : (
              <p className="text-gray-600">{t('pages.howToOrderAnswer')}</p>
            )}
          </div>
        </div>

        {/* Metode de Plată */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">💳</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.paymentMethods')}</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <div key={method.id} className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-center border border-purple-200">
                  <div className="text-4xl mb-3">
                    {method.name.toLowerCase().includes('card') ? '💳' : 
                     method.name.toLowerCase().includes('cash') || method.name.toLowerCase().includes('ramburs') ? '💵' : 
                     method.name.toLowerCase().includes('transfer') ? '🏦' : '💰'}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{method.name}</h3>
                  {method.description && (
                    <p className="text-gray-600 text-sm mt-2">{method.description}</p>
                  )}
                </div>
              ))
            ) : (
              <>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-center">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="font-bold text-gray-800">Card Bancar</h3>
                  <p className="text-gray-600 text-sm mt-2">Plată securizată online</p>
                </div>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-center">
                  <div className="text-4xl mb-3">🏦</div>
                  <h3 className="font-bold text-gray-800">Transfer Bancar</h3>
                  <p className="text-gray-600 text-sm mt-2">Transfer direct în cont</p>
                </div>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-center">
                  <div className="text-4xl mb-3">💵</div>
                  <h3 className="font-bold text-gray-800">Ramburs</h3>
                  <p className="text-gray-600 text-sm mt-2">Plată la livrare</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Adresa */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-red-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">📍</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.whereToFindUs')}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">{t('pages.address')}</h3>
                  <p className="text-gray-600">{contactInfo?.address || 'Str. Garii nr. 69, Galați, România'}</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">📞</span>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">{t('pages.phone')}</h3>
                  <a href={`tel:${contactInfo?.phone || '+40753615752'}`} className="text-blue-600 hover:underline">
                    {contactInfo?.phone || '+40753615752'}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">📧</span>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">{t('pages.email')}</h3>
                  <a href={`mailto:${contactInfo?.email || 'crys.cristi@yahoo.com'}`} className="text-blue-600 hover:underline">
                    {contactInfo?.email || 'crys.cristi@yahoo.com'}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-6 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🏡</span>
                <p className="text-gray-700 font-medium">{t('pages.visitUs')}</p>
                <p className="text-gray-600 text-sm mt-2">{t('pages.welcomeToFarm')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vouchere */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-pink-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">🎟️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.vouchers')}</h2>
          </div>
          
          <div className="text-gray-700 leading-relaxed space-y-4">
            {vouchers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {vouchers.map((voucher) => {
                  const now = new Date();
                  const validUntil = voucher.validUntil ? new Date(voucher.validUntil) : null;
                  const isExpired = validUntil && now > validUntil;
                  
                  return (
                  <div key={voucher.id} className="p-5 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border-l-4 border-pink-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-2">🎟️</span>
                      <h3 className="font-bold text-gray-800 text-lg">{voucher.code}</h3>
                    </div>
                    
                    {voucher.description && (
                      <p className="text-gray-600 text-sm mb-3">{voucher.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-green-600 font-semibold">
                        💰 {voucher.discountType === 'percentage' 
                          ? `${voucher.discountValue}% reducere` 
                          : `${voucher.discountValue} RON reducere`}
                      </p>
                      
                      {voucher.minPurchase && (
                        <p className="text-gray-700">
                          <strong>Comandă minimă:</strong> {voucher.minPurchase} RON
                        </p>
                      )}
                      
                      {validUntil && (
                        <p className="text-gray-700">
                          <strong>Valabil până:</strong> {validUntil.toLocaleDateString('ro-RO')}
                        </p>
                      )}
                      
                      {!isExpired ? (
                        <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                          ✓ Activ
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-gray-400 text-white text-xs rounded-full font-medium">
                          Expirat
                        </span>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg text-center border border-pink-200">
                <span className="text-4xl block mb-3">🎟️</span>
                <h3 className="font-bold text-gray-800 text-lg">{t('pages.vouchers')}</h3>
                <p className="text-gray-600 text-sm mt-2">{t('pages.vouchersDesc')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Produse Cadou */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-yellow-100 p-3 rounded-lg mr-3">
              <span className="text-4xl">🎁</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{t('pages.giftProducts')}</h2>
          </div>
          
          <div className="text-gray-700 leading-relaxed space-y-4">
            {giftRules.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {giftRules.map((rule) => {
                  const now = new Date();
                  const validFrom = rule.validFrom ? new Date(rule.validFrom) : null;
                  const validUntil = rule.validUntil ? new Date(rule.validUntil) : null;
                  
                  const isNotYetValid = validFrom && now < validFrom;
                  const isExpired = validUntil && now > validUntil;
                  const isCurrentlyValid = !isNotYetValid && !isExpired;
                  
                  return (
                  <div key={rule.id} className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-2">🎁</span>
                      <h3 className="font-bold text-gray-800 text-lg">{rule.name}</h3>
                    </div>
                    
                    {rule.description && (
                      <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {isCurrentlyValid ? (
                        <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                          ✓ {t('pages.active')}
                        </span>
                      ) : isNotYetValid ? (
                        <span className="inline-block px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                          ⏳ {t('pages.comingSoon')}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-gray-400 text-white text-xs rounded-full font-medium">
                          {t('pages.inactive')}
                        </span>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg text-center border border-yellow-200">
                  <span className="text-4xl block mb-3">🎟️</span>
                  <h3 className="font-bold text-gray-800 text-lg">{t('pages.vouchers')}</h3>
                  <p className="text-gray-600 text-sm mt-2">{t('pages.vouchersDesc')}</p>
                </div>
                
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg text-center border border-yellow-200">
                  <span className="text-4xl block mb-3">🎁</span>
                  <h3 className="font-bold text-gray-800 text-lg">{t('pages.giftProducts')}</h3>
                  <p className="text-gray-600 text-sm mt-2">{t('pages.giftProductsDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
