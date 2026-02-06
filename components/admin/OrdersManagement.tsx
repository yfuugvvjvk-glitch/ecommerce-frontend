'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

export default function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Filtre avansate
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    deliveryMethod: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Real-time updates
  const { isConnected } = useWebSocket({
    onOrderUpdate: (data) => {
      console.log('Real-time order update:', data);
      // Refresh orders when an order is updated
      fetchOrders();
    },
    onNewOrder: (data) => {
      console.log('Real-time new order:', data);
      // Refresh orders when a new order is created
      fetchOrders();
      // Show notification for new order
      if (data.order) {
        setToast({
          message: `🆕 Comandă nouă: #${data.order.id.slice(-6)} - ${data.order.total} RON`,
          type: 'success'
        });
      }
    }
  });

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await apiClient.get('/api/admin/orders', { params });
      // Fix: Backend returns { orders: [...] }
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Căutare text
    if (filters.search) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.shippingAddress?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtrare după status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Filtrare după metodă de plată
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }

    // Filtrare după metodă de livrare
    if (filters.deliveryMethod !== 'all') {
      filtered = filtered.filter(order => order.deliveryMethod === filters.deliveryMethod);
    }

    // Filtrare după dată
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Filtrare după sumă
    if (filters.minAmount) {
      filtered = filtered.filter(order => order.total >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(order => order.total <= parseFloat(filters.maxAmount));
    }

    // Sortare
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'amount':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredOrders = applyFilters();

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentMethod: 'all',
      deliveryMethod: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    console.log('Changing status:', { orderId, newStatus });
    try {
      const response = await apiClient.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      console.log('Status changed successfully:', response.data);
      setToast({ message: 'Status actualizat!', type: 'success' });
      await fetchOrders();
    } catch (error: any) {
      console.error('Status change error:', error);
      setToast({ message: error.response?.data?.error || 'Eroare la actualizare status', type: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div>
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Filtre Avansate */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🔍 Filtre și Căutare Avansată</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
          >
            {showFilters ? 'Ascunde Filtre' : 'Arată Filtre'}
          </button>
        </div>

        {/* Căutare rapidă */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Caută după ID comandă, nume client, email sau adresă..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {showFilters && (
          <div className="space-y-4">
            {/* Filtre principale */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">Toate</option>
                  <option value="pending">În așteptare</option>
                  <option value="processing">În procesare</option>
                  <option value="shipped">Expediat</option>
                  <option value="delivered">Livrat</option>
                  <option value="cancelled">Anulat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metodă Plată</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">Toate</option>
                  <option value="cash">Numerar</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metodă Livrare</label>
                <select
                  value={filters.deliveryMethod}
                  onChange={(e) => setFilters({...filters, deliveryMethod: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">Toate</option>
                  <option value="courier">Curier</option>
                  <option value="pickup">Ridicare personală</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sortare</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 border rounded px-3 py-2"
                  >
                    <option value="date">Data</option>
                    <option value="amount">Sumă</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border rounded hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filtre de dată și sumă */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de la</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data până la</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sumă minimă (RON)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sumă maximă (RON)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Butoane acțiuni */}
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                🔄 Resetează Filtre
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                Afișate: <strong className="ml-1">{filteredOrders.length}</strong> din <strong>{orders.length}</strong> comenzi
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded ${!filter ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Toate
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded ${filter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          ⏳ În așteptare
        </button>
        <button
          onClick={() => setFilter('PROCESSING')}
          className={`px-4 py-2 rounded ${filter === 'PROCESSING' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          📦 În procesare
        </button>
        <button
          onClick={() => setFilter('SHIPPED')}
          className={`px-4 py-2 rounded ${filter === 'SHIPPED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          🚚 Expediate
        </button>
        <button
          onClick={() => setFilter('DELIVERED')}
          className={`px-4 py-2 rounded ${filter === 'DELIVERED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          ✅ Livrate
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">Comandă #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-600">{order.user.name} ({order.user.email})</p>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString('ro-RO')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">{order.total.toFixed(2)} RON</p>
                <select
                  value={order.status}
                  onChange={(e) => {
                    e.preventDefault();
                    handleStatusChange(order.id, e.target.value);
                  }}
                  className={`mt-2 px-3 py-1 rounded text-sm font-medium border cursor-pointer ${getStatusColor(order.status)}`}
                  title="Schimbă statusul comenzii"
                >
                  <option value="PENDING">⏳ În așteptare</option>
                  <option value="PROCESSING">📦 În procesare</option>
                  <option value="SHIPPED">🚚 Expediată</option>
                  <option value="DELIVERED">✅ Livrată</option>
                  <option value="CANCELLED">❌ Anulată</option>
                </select>
              </div>
            </div>
            <div className="text-sm mb-3">
              <strong>Produse:</strong>
              {order.orderItems.map((item: any) => (
                <div key={item.id} className="ml-4">
                  • {item.dataItem.title} x {item.quantity} = {(item.price * item.quantity).toFixed(2)} RON
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <p><strong>Adresă:</strong> {order.shippingAddress}</p>
              <p><strong>Plată:</strong> {order.paymentMethod}</p>
              <p><strong>Livrare:</strong> {order.deliveryMethod}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={async () => {
                  if (confirm('Sigur vrei să ștergi această comandă?')) {
                    try {
                      await apiClient.delete(`/api/admin/orders/${order.id}`);
                      setToast({ message: 'Comandă ștearsă!', type: 'success' });
                      fetchOrders();
                    } catch (error: any) {
                      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
                    }
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                🗑️ Șterge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
