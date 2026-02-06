'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/config';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Scale, 
  Truck, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  totalSold: number;
  lowStockAlert: number;
  isPerishable: boolean;
  requiresAdvanceOrder: boolean;
  unitType: string;
  unitName: string;
  minQuantity: number;
  quantityStep: number;
  allowFractional: boolean;
  advanceOrderDays: number;
  advanceOrderHours: number;
  shelfLifeDays?: number;
  expiryDate?: string;
  warrantyDays?: number;
  customDeliveryRules: boolean;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
}

interface DeliverySettings {
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
}

export default function AdvancedProductManager() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'products':
          await loadProducts();
          break;
        case 'delivery':
          await loadDeliverySettings();
          break;
        case 'payments':
          await loadPaymentMethods();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const response = await fetch(`${API_URL}/api/admin/stock/statistics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const loadDeliverySettings = async () => {
    const response = await fetch(`${API_URL}/api/admin/delivery-settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setDeliverySettings(data);
    }
  };

  const loadPaymentMethods = async () => {
    const response = await fetch(`${API_URL}/api/admin/payment-methods`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setPaymentMethods(data);
    }
  };

  const addStock = async (productId: string, quantity: number, reason: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stock/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity, reason })
      });

      if (response.ok) {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acces interzis</h2>
        <p className="text-gray-600">Doar administratorii pot accesa această pagină.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'products', name: 'Produse', icon: Package },
            { id: 'delivery', name: 'Livrări', icon: Truck },
            { id: 'payments', name: 'Plăți', icon: Settings }
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Se încarcă...</p>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && !loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Produse cu Setări Avansate</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stoc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unitate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Setări Speciale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.availableStock} / {product.stock}
                        </div>
                        <div className="text-xs text-gray-500">
                          Rezervat: {product.reservedStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.unitName} ({product.unitType})
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {product.minQuantity}, Pas: {product.quantityStep}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {product.isPerishable && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Perisabil
                            </span>
                          )}
                          {product.requiresAdvanceOrder && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Calendar className="h-3 w-3 mr-1" />
                              Avans {product.advanceOrderDays}z
                            </span>
                          )}
                          {product.customDeliveryRules && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Truck className="h-3 w-3 mr-1" />
                              Livrare Specială
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsEditing(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Cantitate de adăugat:');
                            const reason = prompt('Motiv:') || 'Manual addition';
                            if (quantity && !isNaN(Number(quantity))) {
                              addStock(product.id, Number(quantity), reason);
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && !loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Setări Livrare</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Setare
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timp Livrare
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliverySettings.map((setting) => (
                    <tr key={setting.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{setting.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          setting.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {setting.isActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {setting.deliveryTimeDays ? `${setting.deliveryTimeDays} zile` : ''}
                          {setting.deliveryTimeHours ? ` ${setting.deliveryTimeHours} ore` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{setting.deliveryCost} RON</div>
                        {setting.freeDeliveryThreshold && (
                          <div className="text-xs text-gray-500">
                            Gratuit peste {setting.freeDeliveryThreshold} RON
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && !loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Metode de Plată</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Metodă
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descriere
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {method.icon && <span className="mr-2">{method.icon}</span>}
                          <div className="text-sm font-medium text-gray-900">{method.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {method.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          method.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {method.isActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{method.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isEditing && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editează Produs: {selectedProduct.title}
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tip Unitate</label>
                  <select 
                    defaultValue={selectedProduct.unitType}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="piece">Bucată</option>
                    <option value="kg">Kilogram</option>
                    <option value="liter">Litru</option>
                    <option value="gram">Gram</option>
                    <option value="ml">Mililitru</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nume Unitate</label>
                  <input 
                    type="text" 
                    defaultValue={selectedProduct.unitName}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantitate Minimă</label>
                  <input 
                    type="number" 
                    step="0.1"
                    defaultValue={selectedProduct.minQuantity}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pas Cantitate</label>
                  <input 
                    type="number" 
                    step="0.1"
                    defaultValue={selectedProduct.quantityStep}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked={selectedProduct.isPerishable}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Produs Perisabil</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked={selectedProduct.requiresAdvanceOrder}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Necesită Comandă în Avans</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked={selectedProduct.allowFractional}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Permite Fracții</span>
                </label>
              </div>

              {selectedProduct.requiresAdvanceOrder && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zile în Avans</label>
                    <input 
                      type="number" 
                      defaultValue={selectedProduct.advanceOrderDays}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ore în Avans</label>
                    <input 
                      type="number" 
                      defaultValue={selectedProduct.advanceOrderHours}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  onClick={() => {
                    // Save logic here
                    setIsEditing(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}