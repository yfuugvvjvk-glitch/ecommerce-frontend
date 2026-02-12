'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DeliveryMethod {
  id: string;
  name: string;
  isActive: boolean;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
  availableDeliveryDays?: number[];
  deliveryAreas?: string[];
  minimumOrderValue?: number;
  deliveryCost: number;
  freeDeliveryThreshold?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  description?: string;
  icon?: string;
  settings?: any;
}

interface TimeSlot {
  day: string;
  dayLabel: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export default function DeliveryPaymentSettings() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'payment'>('delivery');
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [filteredDeliveryMethods, setFilteredDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryMethod | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const daysOfWeek = [
    { value: 1, label: 'Luni' },
    { value: 2, label: 'Marți' },
    { value: 3, label: 'Miercuri' },
    { value: 4, label: 'Joi' },
    { value: 5, label: 'Vineri' },
    { value: 6, label: 'Sâmbătă' },
    { value: 0, label: 'Duminică' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);
  
  // Filtrare și sortare
  useEffect(() => {
    if (activeTab === 'delivery') {
      let filtered = [...deliveryMethods];

      // Filtrare după termen de căutare
      if (searchTerm) {
        filtered = filtered.filter(method =>
          method.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtrare după status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(method =>
          statusFilter === 'active' ? method.isActive : !method.isActive
        );
      }

      // Sortare
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'cost-asc':
            return a.deliveryCost - b.deliveryCost;
          case 'cost-desc':
            return b.deliveryCost - a.deliveryCost;
          default:
            return 0;
        }
      });

      setFilteredDeliveryMethods(filtered);
    } else {
      let filtered = [...paymentMethods];

      // Filtrare după termen de căutare
      if (searchTerm) {
        filtered = filtered.filter(method =>
          method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          method.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtrare după status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(method =>
          statusFilter === 'active' ? method.isActive : !method.isActive
        );
      }

      // Sortare
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'type-asc':
            return a.type.localeCompare(b.type);
          case 'type-desc':
            return b.type.localeCompare(a.type);
          default:
            return 0;
        }
      });

      setFilteredPaymentMethods(filtered);
    }
  }, [deliveryMethods, paymentMethods, searchTerm, statusFilter, sortBy, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'delivery') {
        const response = await fetch(`${API_URL}/api/admin/delivery-settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDeliveryMethods(data);
          setFilteredDeliveryMethods(data);
        }
      } else {
        const response = await fetch(`${API_URL}/api/admin/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data);
          setFilteredPaymentMethods(data);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;

    try {
      const token = localStorage.getItem('token');
      const url = editingDelivery.id 
        ? `${API_URL}/api/admin/delivery-settings/${editingDelivery.id}`
        : `${API_URL}/api/admin/delivery-settings`;
      
      const method = editingDelivery.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingDelivery)
      });

      if (response.ok) {
        alert('Salvat cu succes!');
        setShowDeliveryForm(false);
        setEditingDelivery(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Eroare la salvare');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Eroare la salvare');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      const token = localStorage.getItem('token');
      const url = editingPayment.id 
        ? `${API_URL}/api/admin/payment-methods/${editingPayment.id}`
        : `${API_URL}/api/admin/payment-methods`;
      
      const method = editingPayment.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingPayment)
      });

      if (response.ok) {
        alert('Salvat cu succes!');
        setShowPaymentForm(false);
        setEditingPayment(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Eroare la salvare');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Eroare la salvare');
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți această metodă de livrare?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/delivery-settings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Șters cu succes!');
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Eroare la ștergere');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Eroare la ștergere');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți această metodă de plată?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Șters cu succes!');
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Eroare la ștergere');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Eroare la ștergere');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Se încarcă...</div>;
  }
  
  // Paginare
  const totalPages = activeTab === 'delivery' 
    ? Math.ceil(filteredDeliveryMethods.length / itemsPerPage)
    : Math.ceil(filteredPaymentMethods.length / itemsPerPage);
    
  const paginatedItems = activeTab === 'delivery'
    ? filteredDeliveryMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredPaymentMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Setări Livrare și Plată</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded ${
            activeTab === 'delivery'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Metode de Livrare
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 rounded ${
            activeTab === 'payment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Metode de Plată
        </button>
      </div>

      {activeTab === 'delivery' ? (
        <div>
          {/* Filtre și Căutare */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Căutare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Caută
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nume metodă..."
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
                  <option value="name-asc">Nume (A → Z)</option>
                  <option value="name-desc">Nume (Z → A)</option>
                  <option value="cost-asc">Cost (Mic → Mare)</option>
                  <option value="cost-desc">Cost (Mare → Mic)</option>
                </select>
              </div>
            </div>

            {/* Butoane Reset */}
            {(searchTerm || statusFilter !== 'all' || sortBy !== 'name-asc') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('name-asc');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  🔄 Resetează Filtrele
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setEditingDelivery({
                id: '',
                name: '',
                isActive: true,
                deliveryCost: 0
              });
              setShowDeliveryForm(true);
            }}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Adaugă Metodă de Livrare
          </button>

          <div className="grid gap-4">
            {paginatedItems.map((method: any) => (
              <div key={method.id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{method.name}</h3>
                    <p className="text-sm text-gray-600">
                      Cost: {method.deliveryCost} RON
                      {method.freeDeliveryThreshold && 
                        ` (Gratuit peste ${method.freeDeliveryThreshold} RON)`}
                    </p>
                    <p className="text-sm">
                      Status: {method.isActive ? '✅ Activ' : '❌ Inactiv'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingDelivery(method);
                        setShowDeliveryForm(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDeleteDelivery(method.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Șterge
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

          {showDeliveryForm && editingDelivery && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingDelivery.id ? 'Editează' : 'Adaugă'} Metodă de Livrare
                </h2>
                <form onSubmit={handleSaveDelivery} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nume</label>
                    <input
                      type="text"
                      value={editingDelivery.name}
                      onChange={(e) =>
                        setEditingDelivery({ ...editingDelivery, name: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cost Livrare (RON)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingDelivery.deliveryCost}
                      onChange={(e) =>
                        setEditingDelivery({
                          ...editingDelivery,
                          deliveryCost: parseFloat(e.target.value)
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Livrare Gratuită peste (RON)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingDelivery.freeDeliveryThreshold || ''}
                      onChange={(e) =>
                        setEditingDelivery({
                          ...editingDelivery,
                          freeDeliveryThreshold: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingDelivery.isActive}
                        onChange={(e) =>
                          setEditingDelivery({
                            ...editingDelivery,
                            isActive: e.target.checked
                          })
                        }
                      />
                      <span className="text-sm font-medium">Activ</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeliveryForm(false);
                        setEditingDelivery(null);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Anulează
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Salvează
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Filtre și Căutare pentru Payment */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Căutare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Caută
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nume sau tip metodă..."
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
                  <option value="name-asc">Nume (A → Z)</option>
                  <option value="name-desc">Nume (Z → A)</option>
                  <option value="type-asc">Tip (A → Z)</option>
                  <option value="type-desc">Tip (Z → A)</option>
                </select>
              </div>
            </div>

            {/* Butoane Reset */}
            {(searchTerm || statusFilter !== 'all' || sortBy !== 'name-asc') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('name-asc');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  🔄 Resetează Filtrele
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setEditingPayment({
                id: '',
                name: '',
                type: 'card',
                isActive: true
              });
              setShowPaymentForm(true);
            }}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Adaugă Metodă de Plată
          </button>

          <div className="grid gap-4">
            {paginatedItems.map((method: any) => (
              <div key={method.id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{method.name}</h3>
                    <p className="text-sm text-gray-600">Tip: {method.type}</p>
                    {method.description && (
                      <p className="text-sm text-gray-600">{method.description}</p>
                    )}
                    <p className="text-sm">
                      Status: {method.isActive ? '✅ Activ' : '❌ Inactiv'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPayment(method);
                        setShowPaymentForm(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDeletePayment(method.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Șterge
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

          {showPaymentForm && editingPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingPayment.id ? 'Editează' : 'Adaugă'} Metodă de Plată
                </h2>
                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nume</label>
                    <input
                      type="text"
                      value={editingPayment.name}
                      onChange={(e) =>
                        setEditingPayment({ ...editingPayment, name: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tip</label>
                    <select
                      value={editingPayment.type}
                      onChange={(e) =>
                        setEditingPayment({ ...editingPayment, type: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="card">Card</option>
                      <option value="cash">Numerar</option>
                      <option value="bank_transfer">Transfer Bancar</option>
                      <option value="crypto">Criptomonede</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Altele</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sau introdu un tip personalizat în câmpul Nume
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Descriere</label>
                    <textarea
                      value={editingPayment.description || ''}
                      onChange={(e) =>
                        setEditingPayment({
                          ...editingPayment,
                          description: e.target.value
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPayment.isActive}
                        onChange={(e) =>
                          setEditingPayment({
                            ...editingPayment,
                            isActive: e.target.checked
                          })
                        }
                      />
                      <span className="text-sm font-medium">Activ</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setEditingPayment(null);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Anulează
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Salvează
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
