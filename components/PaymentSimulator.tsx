'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { CreditCard, Lock, CheckCircle, XCircle, Plus } from 'lucide-react';

interface SavedCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: number;
  expiryYear: number;
  cardType: string;
  isDefault: boolean;
}

interface FictiveCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  balance: number;
  cardType: string;
  isFictive: boolean;
}

interface PaymentSimulatorProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentSimulator({ orderId, amount, onSuccess, onCancel }: PaymentSimulatorProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<'select' | 'form' | 'processing' | 'success' | 'error'>('select');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [fictiveCards, setFictiveCards] = useState<FictiveCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<{id: string, type: 'real' | 'fictive'} | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserCards();
    }
  }, [token]);

  const fetchUserCards = async () => {
    try {
      const response = await fetch('/api/user-cards/my-cards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedCards(data.savedCards || []);
        setFictiveCards(data.fictiveCards || []);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'VISA';
    if (number.startsWith('5') || number.startsWith('2')) return 'MASTERCARD';
    if (number.startsWith('3')) return 'AMEX';
    return 'UNKNOWN';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      setCardData({ ...cardData, cardNumber: formatted });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setStep('processing');

    try {
      // Simulează procesarea plății
      await new Promise(resolve => setTimeout(resolve, 2000));

      let paymentData;

      if (selectedCard) {
        // Folosește card salvat sau fictiv
        paymentData = {
          cardId: selectedCard.id,
          cardType: selectedCard.type,
          amount,
          orderId
        };

        const response = await fetch('/api/user-cards/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          setStep('success');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          throw new Error(result.error || 'Plata a eșuat');
        }
      } else if (useNewCard) {
        // Folosește card nou
        paymentData = {
          orderId,
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          cardHolder: cardData.cardHolder,
          expiryMonth: parseInt(cardData.expiryMonth),
          expiryYear: parseInt(cardData.expiryYear),
          cvv: cardData.cvv,
          amount
        };

        const response = await apiClient.post('/api/test-cards/process-payment', paymentData);
        
        if (response.data.success) {
          setStep('success');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          throw new Error(response.data.error || 'Plata a eșuat');
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Eroare la procesarea plății');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  const cardType = getCardType(cardData.cardNumber);

  // Ecranul de selectare a cardului
  if (step === 'select') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Selectează Metoda de Plată</h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <XCircle size={24} />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">Suma de plată: <span className="font-bold text-lg">{amount.toFixed(2)} RON</span></p>
          </div>

          {/* Carduri Reale Salvate */}
          {savedCards.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">🏦 Cardurile Tale Reale</h4>
              <div className="grid gap-3">
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCard({id: card.id, type: 'real'});
                      setStep('processing');
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm opacity-90">{card.cardType}</span>
                      {card.isDefault && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-mono mb-1">{card.cardNumber}</div>
                    <div className="text-sm opacity-90">{card.cardHolder}</div>
                    <div className="text-xs opacity-75 mt-2">
                      * Verificare fonduri prin bancă
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Carduri Fictive pentru Test */}
          {fictiveCards.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">🧪 Carduri Test (Fictive)</h4>
              <div className="grid gap-3">
                {fictiveCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (card.balance >= amount) {
                        setSelectedCard({id: card.id, type: 'fictive'});
                        setStep('processing');
                        handleSubmit(new Event('submit') as any);
                      }
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      card.balance >= amount 
                        ? 'hover:bg-green-50 hover:border-green-300 bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm opacity-90">{card.cardType}</span>
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        TEST
                      </span>
                    </div>
                    <div className="text-lg font-mono mb-1">{card.cardNumber}</div>
                    <div className="text-sm opacity-90 mb-2">{card.cardHolder}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-bold">
                        Balanță: {card.balance.toFixed(2)} RON
                      </div>
                      {card.balance < amount && (
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          Fonduri insuficiente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opțiunea de card nou */}
          <div className="border-t pt-4">
            <button
              onClick={() => {
                setUseNewCard(true);
                setStep('form');
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Folosește un Card Nou
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Anulează
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Procesare plată...</h3>
            <p className="text-gray-600">Vă rugăm să așteptați</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-green-600">Plată reușită!</h3>
            <p className="text-gray-600 mb-4">Tranzacția a fost procesată cu succes</p>
            <p className="text-sm text-gray-500">Suma: {amount.toFixed(2)} RON</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-600">Plată eșuată</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Încearcă din nou
              </button>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Plată cu cardul</h3>
          <Lock className="h-5 w-5 text-green-500" />
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Suma de plată:</span>
            <span className="text-2xl font-bold text-blue-600">{amount.toFixed(2)} RON</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numărul cardului
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
              <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {cardType !== 'UNKNOWN' && (
                <span className={`absolute right-3 top-2.5 text-xs font-bold ${
                  cardType === 'VISA' ? 'text-blue-600' : 
                  cardType === 'MASTERCARD' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {cardType}
                </span>
              )}
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numele purtătorului
            </label>
            <input
              type="text"
              value={cardData.cardHolder}
              onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
              placeholder="NUME PRENUME"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Luna
              </label>
              <select
                value={cardData.expiryMonth}
                onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anul
              </label>
              <select
                value={cardData.expiryYear}
                onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">YY</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) {
                    setCardData({ ...cardData, cvv: value });
                  }
                }}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Procesare...' : `Plătește ${amount.toFixed(2)} RON`}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 text-center">
            🔒 Plata este securizată și criptată
          </p>
        </div>
      </div>
    </div>
  );
}