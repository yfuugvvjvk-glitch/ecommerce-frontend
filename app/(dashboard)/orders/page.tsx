'use client';

import { useEffect, useState } from 'react';
import { orderAPI } from '@/lib/api-client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      PENDING: '⏳ În așteptare',
      PROCESSING: '📦 În procesare',
      SHIPPED: '🚚 Expediată',
      DELIVERED: '✅ Livrată',
      CANCELLED: '❌ Anulată',
      COMPLETED: '✓ Finalizată',
    };
    return labels[status] || status;
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: 'PENDING', label: 'Plasată', icon: '📝' },
      { key: 'PROCESSING', label: 'În procesare', icon: '📦' },
      { key: 'SHIPPED', label: 'Expediată', icon: '🚚' },
      { key: 'DELIVERED', label: 'Livrată', icon: '✅' },
    ];

    const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📦 Comenzile mele</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-lg mb-4">Nu ai comenzi încă</p>
          <a
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Începe cumpărăturile
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Comandă #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {order.orderLocation && (
                      <span className="ml-2">
                        📍 {order.orderLocation}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Produse:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.dataItem.title} x {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toFixed(2)} RON
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {order.total.toFixed(2)} RON
                </span>
              </div>

              {/* Status Tracking */}
              {order.status !== 'CANCELLED' && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-4">Status comandă:</h4>
                  <div className="flex items-center justify-between">
                    {getStatusSteps(order.status).map((step, index) => (
                      <div key={step.key} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                              step.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span
                            className={`text-xs mt-2 text-center ${
                              step.completed ? 'text-green-600 font-semibold' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < getStatusSteps(order.status).length - 1 && (
                          <div
                            className={`flex-1 h-1 ${
                              step.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p><strong>Adresă livrare:</strong> {order.shippingAddress}</p>
                <p><strong>Metodă plată:</strong> {
                  order.paymentMethod === 'cash' ? '💵 Numerar' :
                  order.paymentMethod === 'card' ? '💳 Card' :
                  '🏦 Transfer'
                }</p>
                <p><strong>Metodă livrare:</strong> {
                  order.deliveryMethod === 'courier' ? '🚚 Curier' : '🏪 Ridicare personală'
                }</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
