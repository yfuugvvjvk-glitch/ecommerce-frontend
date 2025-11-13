'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/api/orders/${params.id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPING':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return 'În procesare';
      case 'PREPARING':
        return 'Se pregătește';
      case 'SHIPPING':
        return 'În livrare';
      case 'DELIVERED':
        return 'Livrat';
      case 'CANCELLED':
        return 'Anulat';
      default:
        return status;
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: 'PROCESSING', label: 'Plasată', icon: '📝' },
      { key: 'PREPARING', label: 'Se pregătește', icon: '📦' },
      { key: 'SHIPPING', label: 'În livrare', icon: '🚚' },
      { key: 'DELIVERED', label: 'Livrată', icon: '✅' },
    ];

    const statusOrder = ['PROCESSING', 'PREPARING', 'SHIPPING', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus.toUpperCase());

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

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Comandă negăsită</h2>
        <button
          onClick={() => router.push('/order-history')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Înapoi la comenzi
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-700"
      >
        ← Înapoi
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Comandă #{order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString('ro-RO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        {/* Status Tracking */}
        {order.status.toUpperCase() !== 'CANCELLED' && (
          <div className="mb-8 pb-8 border-b">
            <h3 className="font-semibold mb-4 text-lg">Urmărire comandă:</h3>
            <div className="flex items-center justify-between">
              {getStatusSteps(order.status).map((step, index) => (
                <div key={step.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-sm mt-2 text-center ${
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

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4 text-lg">Produse comandate:</h3>
          <div className="space-y-4">
            {order.orderItems?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {item.dataItem?.image && (
                  <img
                    src={item.dataItem.image}
                    alt={item.dataItem.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.dataItem?.title || 'Produs'}</h4>
                  <p className="text-sm text-gray-600">Cantitate: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Preț unitar: {item.price} RON</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{(item.price * item.quantity).toFixed(2)} RON</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">{order.total} RON</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-blue-600 mt-4">
            <span>Total:</span>
            <span>{order.total} RON</span>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4 text-lg">Informații livrare:</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Nume:</strong> {order.deliveryName || 'N/A'}</p>
            <p><strong>Telefon:</strong> {order.deliveryPhone || 'N/A'}</p>
            <p><strong>Adresă:</strong> {order.shippingAddress}</p>
            <p>
              <strong>Metodă plată:</strong>{' '}
              {order.paymentMethod === 'cash' ? '💵 Numerar' :
               order.paymentMethod === 'card' ? '💳 Card' : '🏦 Transfer'}
            </p>
            <p>
              <strong>Metodă livrare:</strong>{' '}
              {order.deliveryMethod === 'courier' ? '🚚 Curier' : '🏪 Ridicare personală'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
