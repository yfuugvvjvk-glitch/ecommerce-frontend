'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface TestCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardType: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  transactions: any[];
}

export default function TestCardsManagement() {
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCard, setEditingCard] = useState<TestCard | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState<{[key: string]: boolean}>({});
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [cardTypeFilter, setCardTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: new Date().getMonth() + 1,
    expiryYear: new Date().getFullYear() + 2,
    cvv: '',
    cardType: 'VISA',
    balance: 1000
  });

  useEffect(() => {
    fetchTestCards();
  }, []);
  
  // Filtrare și sortare
  useEffect(() => {
    let filtered = [...testCards];

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.cardHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber.includes(searchTerm) ||
        card.cardType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(card => 
        statusFilter === 'active' ? card.isActive : !card.isActive
      );
    }

    // Filtrare după tip card
    if (cardTypeFilter !== 'all') {
      filtered = filtered.filter(card => card.cardType === cardTypeFilter);
    }

    // Sortare
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'balance-desc':
          return b.balance - a.balance;
        case 'balance-asc':
          return a.balance - b.balance;
        case 'holder-asc':
          return a.cardHolder.localeCompare(b.cardHolder);
        case 'holder-desc':
          return b.cardHolder.localeCompare(a.cardHolder);
        default:
          return 0;
      }
    });

    setFilteredCards(filtered);
  }, [testCards, searchTerm, statusFilter, cardTypeFilter, sortBy]);

  const fetchTestCards = async () => {
    try {
      const response = await apiClient.get('/api/test-cards/admin/all');
      setTestCards(response.data);
      setFilteredCards(response.data);
    } catch (error) {
      console.error('Error fetching test cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/test-cards/admin/create', formData);
      setShowCreateForm(false);
      setFormData({
        cardNumber: '',
        cardHolder: '',
        expiryMonth: new Date().getMonth() + 1,
        expiryYear: new Date().getFullYear() + 2,
        cvv: '',
        cardType: 'VISA',
        balance: 1000
      });
      fetchTestCards();
      alert('Card de test creat cu succes!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea cardului');
    }
  };

  const handleUpdateCard = async (cardId: string, updateData: any) => {
    try {
      await apiClient.put(`/api/test-cards/admin/${cardId}`, updateData);
      fetchTestCards();
      alert('Card actualizat cu succes!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la actualizarea cardului');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest card de test?')) return;
    
    try {
      await apiClient.delete(`/api/test-cards/admin/${cardId}`);
      fetchTestCards();
      alert('Card șters cu succes!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la ștergerea cardului');
    }
  };

  const handleGenerateDefaults = async () => {
    try {
      await apiClient.post('/api/test-cards/admin/generate-defaults');
      fetchTestCards();
      alert('Carduri de test predefinite generate cu succes!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la generarea cardurilor');
    }
  };

  const toggleSensitiveData = (cardId: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const maskCardNumber = (cardNumber: string, show: boolean) => {
    if (show) return cardNumber;
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4');
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType) {
      case 'VISA': return 'bg-blue-100 text-blue-800';
      case 'MASTERCARD': return 'bg-red-100 text-red-800';
      case 'AMEX': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Paginare
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carduri de Test</h2>
          <p className="text-gray-600">Gestionează cardurile de test pentru simularea plăților ({filteredCards.length} din {testCards.length})</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateDefaults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generează Carduri Predefinite
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Card Nou
          </button>
        </div>
      </div>

      {/* Filtre și Căutare */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Căutare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Caută
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nume, număr card, tip..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtru Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate statusurile</option>
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
            </select>
          </div>

          {/* Filtru Tip Card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💳 Tip Card
            </label>
            <select
              value={cardTypeFilter}
              onChange={(e) => setCardTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate tipurile</option>
              <option value="VISA">VISA</option>
              <option value="MASTERCARD">MASTERCARD</option>
              <option value="AMEX">AMEX</option>
            </select>
          </div>

          {/* Sortare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⬇️ Sortare
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Data (Nou → Vechi)</option>
              <option value="date-asc">Data (Vechi → Nou)</option>
              <option value="balance-desc">Balanță (Mare → Mică)</option>
              <option value="balance-asc">Balanță (Mică → Mare)</option>
              <option value="holder-asc">Purtător (A → Z)</option>
              <option value="holder-desc">Purtător (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Butoane Reset */}
        {(searchTerm || statusFilter !== 'all' || cardTypeFilter !== 'all' || sortBy !== 'date-desc') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCardTypeFilter('all');
                setSortBy('date-desc');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              🔄 Resetează Filtrele
            </button>
          </div>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-4">Creează Card de Test</h3>
          <form onSubmit={handleCreateCard} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numărul Cardului
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                placeholder="4111111111111111"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numele Purtătorului
              </label>
              <input
                type="text"
                value={formData.cardHolder}
                onChange={(e) => setFormData({...formData, cardHolder: e.target.value})}
                placeholder="Test User"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Luna Expirării
              </label>
              <select
                value={formData.expiryMonth}
                onChange={(e) => setFormData({...formData, expiryMonth: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anul Expirării
              </label>
              <select
                value={formData.expiryYear}
                onChange={(e) => setFormData({...formData, expiryYear: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 10}, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={formData.cvv}
                onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipul Cardului
              </label>
              <select
                value={formData.cardType}
                onChange={(e) => setFormData({...formData, cardType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="VISA">VISA</option>
                <option value="MASTERCARD">MASTERCARD</option>
                <option value="AMEX">AMEX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balanța Inițială (RON)
              </label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Creează Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards List */}
      <div className="grid gap-6">
        {paginatedCards.map((card) => (
          <div key={card.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCardTypeColor(card.cardType)}`}>
                    {card.cardType}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {card.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Numărul Cardului:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {maskCardNumber(card.cardNumber, showSensitiveData[card.id])}
                      </span>
                      <button
                        onClick={() => toggleSensitiveData(card.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showSensitiveData[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Purtător:</span>
                    <p>{card.cardHolder}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expirare:</span>
                    <p>{String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">CVV:</span>
                    <p className="font-mono">
                      {showSensitiveData[card.id] ? card.cvv : '***'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Balanța:</span>
                    <p className="text-lg font-semibold text-green-600">
                      {card.balance.toFixed(2)} RON
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tranzacții:</span>
                    <p>{card.transactions.length} tranzacții</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateCard(card.id, { isActive: !card.isActive })}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    card.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {card.isActive ? 'Dezactivează' : 'Activează'}
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Paginare */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ← Anterior
          </button>
          
          <span className="text-sm text-gray-600">
            Pagina {currentPage} din {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Următorul →
          </button>
        </div>
      )}

      {testCards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Niciun card de test</h3>
          <p className="text-gray-600 mb-4">Creează primul card de test pentru simularea plăților</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Creează Card de Test
          </button>
        </div>
      )}
    </div>
  );
}