'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  availableStock?: number;
  categoryId: string;
  image: string;
  category: { name: string };
  isPerishable: boolean;
  expirationDate?: string;
  productionDate?: string;
  advanceOrderDays?: number;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
  paymentMethods?: string[];
  isActive: boolean;
  unitType: string;
  unitName: string;
  minQuantity: number;
  quantityStep: number;
  allowFractional: boolean;
  availableQuantities?: number[];
}

interface DeliverySettings {
  id: string;
  name: string;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
  deliveryCost: number;
  isActive: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'delivery' | 'payment'>('products');

  // Form states
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: 0,
    oldPrice: undefined as number | undefined,
    stock: 0,
    categoryId: '',
    image: '',
    isPerishable: false,
    expirationDate: '',
    productionDate: '',
    advanceOrderDays: 1, // Implicit 1 zi înainte
    orderCutoffTime: '20:00',
    deliveryTimeHours: 0,
    deliveryTimeDays: 0,
    paymentMethods: [] as string[],
    isActive: true,
    unitType: 'piece',
    unitName: 'bucată',
    // Cantități fixe disponibile (nu mai permite fracționare)
    availableQuantities: [1], // Ex: [0.5, 1, 2] pentru 0.5kg, 1kg, 2kg
    allowFractional: false, // Întotdeauna false
    minQuantity: 1,
    quantityStep: 1
  });

  const [deliveryForm, setDeliveryForm] = useState({
    name: '',
    deliveryTimeHours: 0,
    deliveryTimeDays: 0,
    deliveryCost: 0,
    freeDeliveryThreshold: 0,
    isActive: true
  });

  const [paymentForm, setPaymentForm] = useState({
    name: '',
    type: 'CARD',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates
  const { isConnected } = useWebSocket({
    onInventoryUpdate: (data) => {
      console.log('Real-time inventory update:', data);
      // Refresh products when inventory changes
      fetchData();
    },
    onContentUpdate: (data) => {
      console.log('Real-time content update:', data);
      // Refresh data when content changes
      fetchData();
    }
  });

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, deliveryRes, paymentRes] = await Promise.all([
        apiClient.get('/api/data'),
        apiClient.get('/api/categories'),
        apiClient.get('/api/admin/delivery-settings'),
        apiClient.get('/api/admin/payment-methods')
      ]);
      
      // Fix: Extract data array from paginated response
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data || []);
      setDeliverySettings(deliveryRes.data || []);
      setPaymentMethods(paymentRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent map errors
      setProducts([]);
      setCategories([]);
      setDeliverySettings([]);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductUpdate = async (productId: string) => {
    try {
      // Validate required fields
      if (!productForm.title || !productForm.categoryId || productForm.price <= 0) {
        alert('Vă rugăm să completați toate câmpurile obligatorii (titlu, categorie, preț)');
        return;
      }

      // Update ALL product fields including price and oldPrice
      const productData = {
        title: productForm.title,
        description: productForm.description,
        content: productForm.description,
        price: productForm.price,
        oldPrice: productForm.oldPrice || null,
        stock: productForm.stock,
        categoryId: productForm.categoryId,
        image: productForm.image,
        
        // Advanced fields
        isPerishable: productForm.isPerishable,
        expirationDate: productForm.expirationDate || null,
        productionDate: productForm.productionDate || null,
        advanceOrderDays: productForm.advanceOrderDays,
        orderCutoffTime: productForm.orderCutoffTime,
        deliveryTimeHours: productForm.deliveryTimeHours,
        deliveryTimeDays: productForm.deliveryTimeDays,
        paymentMethods: productForm.paymentMethods,
        isActive: productForm.isActive,
        unitType: productForm.unitType,
        unitName: productForm.unitName,
        availableQuantities: productForm.availableQuantities,
        allowFractional: false,
        minQuantity: Math.min(...productForm.availableQuantities),
        quantityStep: 1,
        status: 'published'
      };

      await apiClient.put(`/api/data/${productId}`, productData);

      setShowModal(false);
      fetchData();
      alert('Produsul a fost actualizat cu succes!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Eroare la actualizarea produsului');
    }
  };

  const handleDeliveryCreate = async () => {
    try {
      await apiClient.post('/api/admin/delivery-settings', deliveryForm);
      setDeliveryForm({
        name: '',
        deliveryTimeHours: 0,
        deliveryTimeDays: 0,
        deliveryCost: 0,
        freeDeliveryThreshold: 0,
        isActive: true
      });
      fetchData();
      alert('Setările de livrare au fost create!');
    } catch (error) {
      console.error('Error creating delivery settings:', error);
      alert('Eroare la crearea setărilor de livrare');
    }
  };

  const handlePaymentCreate = async () => {
    try {
      await apiClient.post('/api/admin/payment-methods', paymentForm);
      setPaymentForm({
        name: '',
        type: 'CARD',
        description: '',
        isActive: true
      });
      fetchData();
      alert('Metoda de plată a fost creată!');
    } catch (error) {
      console.error('Error creating payment method:', error);
      alert('Eroare la crearea metodei de plată');
    }
  };

  const handleCreateProduct = async () => {
    try {
      // Validate required fields
      if (!productForm.title || !productForm.categoryId || productForm.price <= 0) {
        alert('Vă rugăm să completați toate câmpurile obligatorii (titlu, categorie, preț)');
        return;
      }

      // Create new product with all advanced fields
      const productData = {
        title: productForm.title,
        description: productForm.description,
        content: productForm.description, // Required by backend
        price: productForm.price,
        oldPrice: productForm.oldPrice,
        stock: productForm.stock,
        categoryId: productForm.categoryId,
        image: productForm.image || '/images/placeholder.jpg',
        
        // Advanced fields
        isPerishable: productForm.isPerishable,
        expirationDate: productForm.expirationDate || null,
        productionDate: productForm.productionDate || null,
        advanceOrderDays: productForm.advanceOrderDays,
        orderCutoffTime: productForm.orderCutoffTime,
        deliveryTimeHours: productForm.deliveryTimeHours,
        deliveryTimeDays: productForm.deliveryTimeDays,
        paymentMethods: productForm.paymentMethods,
        isActive: productForm.isActive,
        unitType: productForm.unitType,
        unitName: productForm.unitName,
        availableQuantities: productForm.availableQuantities,
        allowFractional: false, // Întotdeauna false
        minQuantity: Math.min(...productForm.availableQuantities),
        quantityStep: 1,
        
        // Set default status
        status: 'published'
      };

      await apiClient.post('/api/data', productData);
      setShowModal(false);
      resetProductForm();
      fetchData();
      alert('Produsul a fost creat cu succes!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Eroare la crearea produsului. Verificați că toate câmpurile sunt completate corect.');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      description: '',
      price: 0,
      oldPrice: undefined,
      stock: 0,
      categoryId: '',
      image: '',
      isPerishable: false,
      expirationDate: '',
      productionDate: '',
      advanceOrderDays: 1,
      orderCutoffTime: '20:00',
      deliveryTimeHours: 0,
      deliveryTimeDays: 0,
      paymentMethods: [],
      isActive: true,
      unitType: 'piece',
      unitName: 'bucată',
      availableQuantities: [1],
      allowFractional: false,
      minQuantity: 1,
      quantityStep: 1
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Sigur vrei să ștergi acest produs? Această acțiune nu poate fi anulată.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/data/${productId}`);
      fetchData();
      alert('Produsul a fost șters cu succes!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Eroare la ștergerea produsului');
    }
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || '',
      price: product.price,
      oldPrice: product.oldPrice || undefined,
      stock: product.stock,
      categoryId: product.categoryId,
      image: product.image,
      isPerishable: product.isPerishable || false,
      expirationDate: product.expirationDate || '',
      productionDate: product.productionDate || '',
      advanceOrderDays: product.advanceOrderDays || 0,
      orderCutoffTime: '20:00',
      deliveryTimeHours: product.deliveryTimeHours || 0,
      deliveryTimeDays: product.deliveryTimeDays || 0,
      paymentMethods: product.paymentMethods || [],
      isActive: product.isActive,
      unitType: product.unitType || 'piece',
      unitName: product.unitName || 'bucată',
      availableQuantities: product.availableQuantities || [1],
      allowFractional: false, // Întotdeauna false pentru cantități fixe
      minQuantity: product.minQuantity || 1,
      quantityStep: product.quantityStep || 1
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Produse
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'delivery'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🚚 Livrare
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'payment'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💳 Plăți
        </button>
        
        {/* Real-time status indicator */}
        <div className="ml-auto flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Gestionare Completă Produse</h3>
            <button
              onClick={() => {
                setSelectedProduct(null);
                resetProductForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Produs Nou
            </button>
          </div>
          
          <div className="grid gap-4">
            {products.map(product => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{product.title}</h4>
                    <p className="text-gray-600 mb-2">{product.category.name}</p>
                    
                    {/* Informații despre vânzare și preț */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-blue-600 font-medium">Tip Vânzare</p>
                        <p className="font-bold text-blue-800">
                          {product.unitType === 'piece' ? 'Bucată' : 
                           product.unitType === 'kg' ? 'Kilogram' :
                           product.unitType === 'liter' ? 'Litru' : 
                           product.unitType === 'meter' ? 'Metru' : product.unitName}
                        </p>
                      </div>
                      
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-green-600 font-medium">Preț per {product.unitName}</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-green-800">{product.price} RON/{product.unitName}</p>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <>
                            <span className="text-xs text-gray-400 line-through">{product.oldPrice} RON</span>
                            <span className="text-xs bg-red-500 text-white px-1 rounded">
                              -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                      
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="text-xs text-orange-600 font-medium">Stoc Disponibil</p>
                        <p className="font-bold text-orange-800">
                          {product.availableStock !== undefined ? product.availableStock : product.stock} {product.unitName}
                          {product.availableStock !== undefined && product.stock !== product.availableStock && (
                            <span className="text-xs text-gray-600 block">
                              (Total: {product.stock})
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-xs text-purple-600 font-medium">Valoare Totală Stoc</p>
                        <p className="font-bold text-purple-800">
                          {(product.stock * product.price).toFixed(2)} RON
                        </p>
                      </div>
                    </div>

                    {/* Informații suplimentare */}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {product.isPerishable && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          ⚠️ Perisabil
                        </span>
                      )}
                      {product.advanceOrderDays && product.advanceOrderDays > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          📅 Comandă cu {product.advanceOrderDays} {product.advanceOrderDays === 1 ? 'zi' : 'zile'} înainte
                        </span>
                      )}
                      {product.availableQuantities && product.availableQuantities.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          📦 Cantități: {product.availableQuantities.join(', ')} {product.unitName}
                        </span>
                      )}
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          🏷️ OFERTĂ -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProductModal(product)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      ⚙️ Configurează
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Setări de Livrare</h3>
          
          {/* Create New Delivery Setting */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">Adaugă Setare Nouă</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nume setare"
                value={deliveryForm.name}
                onChange={(e) => setDeliveryForm({...deliveryForm, name: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Ore livrare"
                value={deliveryForm.deliveryTimeHours}
                onChange={(e) => setDeliveryForm({...deliveryForm, deliveryTimeHours: parseInt(e.target.value)})}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Zile livrare"
                value={deliveryForm.deliveryTimeDays}
                onChange={(e) => setDeliveryForm({...deliveryForm, deliveryTimeDays: parseInt(e.target.value)})}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Cost livrare (RON)"
                value={deliveryForm.deliveryCost}
                onChange={(e) => setDeliveryForm({...deliveryForm, deliveryCost: parseFloat(e.target.value)})}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={handleDeliveryCreate}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Setare
            </button>
          </div>

          {/* Existing Delivery Settings */}
          <div className="grid gap-4">
            {deliverySettings.map(setting => (
              <div key={setting.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{setting.name}</h4>
                    <p className="text-gray-600">
                      {setting.deliveryTimeHours}h / {setting.deliveryTimeDays} zile
                    </p>
                    <p className="text-blue-600">{setting.deliveryCost} RON</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    setting.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {setting.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Metode de Plată</h3>
          
          {/* Create New Payment Method */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">Adaugă Metodă Nouă</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nume metodă"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <select
                value={paymentForm.type}
                onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}
                className="border rounded px-3 py-2"
              >
                <option value="CARD">Card</option>
                <option value="CASH">Numerar</option>
                <option value="TRANSFER">Transfer bancar</option>
                <option value="CRYPTO">Criptomonede</option>
              </select>
              <input
                type="text"
                placeholder="Descriere"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                className="border rounded px-3 py-2 col-span-2"
              />
            </div>
            <button
              onClick={handlePaymentCreate}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Metodă
            </button>
          </div>

          {/* Existing Payment Methods */}
          <div className="grid gap-4">
            {paymentMethods.map(method => (
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{method.name}</h4>
                    <p className="text-gray-600">{method.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {method.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {selectedProduct ? `Configurare: ${selectedProduct.title}` : 'Adaugă Produs Nou'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Product Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📝 Informații de Bază</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Titlu produs (ex: Mere Golden)"
                    value={productForm.title}
                    onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                    className="border rounded px-3 py-2"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preț per unitate (RON)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 15.50 pentru 15.50 RON/kg"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Acest preț va fi per {productForm.unitName || 'unitate'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preț original (pentru oferte) - opțional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 20.00 pentru a afișa discount"
                      value={productForm.oldPrice || ''}
                      onChange={(e) => setProductForm({...productForm, oldPrice: parseFloat(e.target.value) || undefined})}
                      className="w-full border rounded px-3 py-2"
                    />
                    {productForm.oldPrice && productForm.oldPrice > productForm.price && (
                      <p className="text-xs text-green-600 mt-1">
                        Discount: {Math.round(((productForm.oldPrice - productForm.price) / productForm.oldPrice) * 100)}%
                        ({(productForm.oldPrice - productForm.price).toFixed(2)} RON economie)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stoc {selectedProduct ? 'curent' : 'inițial'} ({productForm.unitName || 'unități'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ex: 50 pentru 50 kg în stoc"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                    {productForm.stock > 0 && productForm.price > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Valoare totală stoc: {(productForm.stock * productForm.price).toFixed(2)} RON
                      </p>
                    )}
                  </div>
                  
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                    className="border rounded px-3 py-2"
                    required
                  >
                    <option value="">Selectează categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="URL Imagine (opțional)"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    className="border rounded px-3 py-2 col-span-2"
                  />
                  
                  <textarea
                    placeholder="Descriere produs (opțional)"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="border rounded px-3 py-2 col-span-2"
                    rows={3}
                  />
                </div>
              </div>

              {/* Unit Settings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📏 Unități de Măsură și Cantități Disponibile</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipul de vânzare
                    </label>
                    <select
                      value={productForm.unitType}
                      onChange={(e) => {
                        const unitType = e.target.value;
                        let unitName = 'bucată';
                        let defaultQuantities = [1];
                        
                        if (unitType === 'kg') {
                          unitName = 'kg';
                          defaultQuantities = [0.5, 1, 2]; // Exemple: 0.5kg, 1kg, 2kg
                        } else if (unitType === 'liter') {
                          unitName = 'litru';
                          defaultQuantities = [0.5, 1, 2]; // Exemple: 0.5L, 1L, 2L
                        } else if (unitType === 'meter') {
                          unitName = 'metru';
                          defaultQuantities = [1, 2, 5]; // Exemple: 1m, 2m, 5m
                        }
                        
                        setProductForm({
                          ...productForm, 
                          unitType,
                          unitName,
                          availableQuantities: defaultQuantities
                        });
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="piece">Bucată (produse individuale)</option>
                      <option value="kg">Kilogram (produse în greutate)</option>
                      <option value="liter">Litru (lichide)</option>
                      <option value="meter">Metru (materiale pe lungime)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nume unitate (cum apare la client)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: kg, litru, bucată, metru"
                      value={productForm.unitName}
                      onChange={(e) => setProductForm({...productForm, unitName: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Important:</strong> Prețul introdus mai sus ({productForm.price} RON) va fi 
                    <strong> prețul per {productForm.unitName}</strong>. 
                    Clienții vor vedea: <strong>{productForm.price} RON/{productForm.unitName}</strong>
                  </p>
                </div>

                {/* Cantități fixe disponibile */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantități Fixe Disponibile
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Definește cantitățile exacte în care se vinde produsul (ex: 0.5kg, 1kg, 2kg)
                  </p>
                  
                  <div className="space-y-2">
                    {productForm.availableQuantities.map((quantity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={quantity}
                          onChange={(e) => {
                            const newQuantities = [...productForm.availableQuantities];
                            newQuantities[index] = parseFloat(e.target.value) || 0;
                            setProductForm({...productForm, availableQuantities: newQuantities});
                          }}
                          className="w-24 border rounded px-2 py-1"
                        />
                        <span className="text-sm text-gray-600">{productForm.unitName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newQuantities = productForm.availableQuantities.filter((_, i) => i !== index);
                            setProductForm({...productForm, availableQuantities: newQuantities});
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({
                          ...productForm, 
                          availableQuantities: [...productForm.availableQuantities, 1]
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ➕ Adaugă cantitate
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>📦 Exemplu:</strong> Pentru {productForm.unitName === 'kg' ? 'carne' : productForm.unitName === 'litru' ? 'lapte' : 'produs'}, 
                    clientul va putea alege doar din cantitățile: {productForm.availableQuantities.join(', ')} {productForm.unitName}
                  </p>
                </div>
              </div>

              {/* Perishable Settings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">🍎 Setări Perisabilitate</h4>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={productForm.isPerishable}
                    onChange={(e) => setProductForm({...productForm, isPerishable: e.target.checked})}
                  />
                  <span>Produs perisabil</span>
                </label>
                {productForm.isPerishable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data producției
                      </label>
                      <input
                        type="date"
                        value={productForm.productionDate}
                        onChange={(e) => setProductForm({...productForm, productionDate: e.target.value})}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data expirării
                      </label>
                      <input
                        type="date"
                        value={productForm.expirationDate}
                        onChange={(e) => setProductForm({...productForm, expirationDate: e.target.value})}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advance Order Settings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📅 Perioada de Comandă în Avans</h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Important pentru produse perisabile:</strong> Setează cu câte zile înainte trebuie plasată comanda pentru a evita deteriorarea produselor.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zile în avans pentru comandă
                    </label>
                    <select
                      value={productForm.advanceOrderDays}
                      onChange={(e) => setProductForm({...productForm, advanceOrderDays: parseInt(e.target.value)})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value={0}>Fără restricții (comandă oricând)</option>
                      <option value={1}>1 zi înainte</option>
                      <option value={2}>2 zile înainte</option>
                      <option value={3}>3 zile înainte</option>
                      <option value={7}>1 săptămână înainte</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ora limită pentru comenzi (ziua precedentă)
                    </label>
                    <input
                      type="time"
                      value={productForm.orderCutoffTime || '20:00'}
                      onChange={(e) => setProductForm({...productForm, orderCutoffTime: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                
                {productForm.advanceOrderDays > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>📋 Regulă:</strong> Clienții pot comanda acest produs doar cu minimum {productForm.advanceOrderDays} {productForm.advanceOrderDays === 1 ? 'zi' : 'zile'} înainte
                      {productForm.orderCutoffTime && `, până la ora ${productForm.orderCutoffTime}`}.
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Settings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">🚚 Setări Livrare</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={productForm.deliveryTimeHours}
                    onChange={(e) => setProductForm({...productForm, deliveryTimeHours: parseInt(e.target.value)})}
                    className="border rounded px-3 py-2"
                    placeholder="Ore livrare"
                  />
                  <input
                    type="number"
                    value={productForm.deliveryTimeDays}
                    onChange={(e) => setProductForm({...productForm, deliveryTimeDays: parseInt(e.target.value)})}
                    className="border rounded px-3 py-2"
                    placeholder="Zile livrare"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">💳 Metode de Plată Acceptate</h4>
                <div className="space-y-2">
                  {paymentMethods.filter(m => m.isActive).map(method => (
                    <label key={method.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={productForm.paymentMethods.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProductForm({
                              ...productForm,
                              paymentMethods: [...productForm.paymentMethods, method.id]
                            });
                          } else {
                            setProductForm({
                              ...productForm,
                              paymentMethods: productForm.paymentMethods.filter(id => id !== method.id)
                            });
                          }
                        }}
                      />
                      <span>{method.name} ({method.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({...productForm, isActive: e.target.checked})}
                  />
                  <span>Produs activ</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Anulează
              </button>
              <button
                onClick={() => selectedProduct ? handleProductUpdate(selectedProduct.id) : handleCreateProduct()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                💾 {selectedProduct ? 'Actualizează' : 'Creează'} Produs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}