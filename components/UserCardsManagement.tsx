'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

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

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  cardLast4: string;
  cardType: string;
  description: string;
  createdAt: string;
}

export default function UserCardsManagement() {
  const { token } = useAuth();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [fictiveCards, setFictiveCards] = useState<FictiveCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'transactions'>('cards');

  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cardType: 'VISA'
  });

  useEffect(() => {
    if (token) {
      fetchCards();
      fetchTransactions();
    }
  }, [token]);

  const fetchCards = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/user-cards/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/user-cards/add-real-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCard,
          expiryMonth: parseInt(newCard.expiryMonth),
          expiryYear: parseInt(newCard.expiryYear)
        }),
      });

      if (response.ok) {
        await fetchCards();
        setShowAddCard(false);
        setNewCard({
          cardNumber: '',
          cardHolder: '',
          expiryMonth: '',
          expiryYear: '',
          cardType: 'VISA'
        });
        alert('Card adăugat cu succes!');
      } else {
        const error = await response.json();
        alert(`Eroare: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Eroare la adăugarea cardului');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Sigur vrei să ștergi acest card?')) return;

    try {
      const response = await fetch(`/api/user-cards/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCards();
        alert('Card șters cu succes!');
      } else {
        const error = await response.json();
        alert(`Eroare: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Eroare la ștergerea cardului');
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      const response = await fetch(`/api/user-cards/cards/${cardId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCards();
        alert('Card setat ca default!');
      } else {
        const error = await response.json();
        alert(`Eroare: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting default card:', error);
      alert('Eroare la setarea cardului default');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('cards')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💳 Cardurile Mele
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Istoric Tranzacții
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'cards' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Cardurile Mele</h2>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Adaugă Card Real
                </button>
              </div>

              {/* Carduri Reale Salvate */}
              {savedCards.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">🏦 Carduri Reale</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {savedCards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm opacity-90">{card.cardType}</span>
                          {card.isDefault && (
                            <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-mono mb-2">{card.cardNumber}</div>
                        <div className="text-sm opacity-90 mb-3">{card.cardHolder}</div>
                        <div className="text-sm opacity-90 mb-4">
                          {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                        </div>
                        <div className="flex gap-2">
                          {!card.isDefault && (
                            <button
                              onClick={() => handleSetDefault(card.id)}
                              className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30"
                            >
                              Setează Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="bg-red-500 bg-opacity-80 text-white px-3 py-1 rounded text-sm hover:bg-opacity-100"
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Carduri Fictive pentru Test */}
              {fictiveCards.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">🧪 Carduri Test (Fictive)</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {fictiveCards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm opacity-90">{card.cardType}</span>
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            TEST
                          </span>
                        </div>
                        <div className="text-lg font-mono mb-2">{card.cardNumber}</div>
                        <div className="text-sm opacity-90 mb-2">{card.cardHolder}</div>
                        <div className="text-lg font-bold">
                          Balanță: {card.balance.toFixed(2)} RON
                        </div>
                        <div className="text-xs opacity-75 mt-2">
                          * Card fictiv pentru testarea aplicației
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedCards.length === 0 && fictiveCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">💳</div>
                  <p>Nu ai carduri salvate încă.</p>
                  <p className="text-sm">Adaugă un card real sau folosește cardurile de test.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Istoric Tranzacții</h2>
              
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suma
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Card
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descriere
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString('ro-RO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'PAYMENT' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.type === 'PAYMENT' ? '💸 Plată' : '💰 Rambursare'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.type === 'PAYMENT' ? '-' : '+'}{transaction.amount.toFixed(2)} RON
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.cardType} ****{transaction.cardLast4}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status === 'COMPLETED' ? '✅ Completă' : '⏳ În așteptare'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p>Nu ai tranzacții încă.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal pentru adăugarea cardului */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adaugă Card Real</h3>
            <form onSubmit={handleAddCard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numărul Cardului
                </label>
                <input
                  type="text"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                  placeholder="1234567890123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={16}
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Se vor salva doar ultimele 4 cifre pentru securitate
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numele Titularului
                </label>
                <input
                  type="text"
                  value={newCard.cardHolder}
                  onChange={(e) => setNewCard({...newCard, cardHolder: e.target.value})}
                  placeholder="JOHN DOE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Luna
                  </label>
                  <select
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({...newCard, expiryMonth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Luna</option>
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{String(i+1).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anul
                  </label>
                  <select
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({...newCard, expiryYear: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Anul</option>
                    {Array.from({length: 10}, (_, i) => (
                      <option key={2024+i} value={2024+i}>{2024+i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip
                  </label>
                  <select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({...newCard, cardType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="AMEX">AMEX</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Adaugă Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}