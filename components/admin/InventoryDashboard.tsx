'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, DollarSign, Clock, Truck } from 'lucide-react';
import { useWebSocket } from '@/lib/useWebSocket';
import { usePagination } from '@/lib/usePagination';
import Pagination from '@/components/Pagination';
import FilterBar from './FilterBar';

interface StockReport {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  expired: number;
  expiringSoon: number;
  totalValue: number;
  totalStockValue: number;
}

interface ProductDetails {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  totalSold: number;
  lowStockAlert: number;
  isInStock: boolean;
  lastRestockDate?: string;
  image: string;
  category: {
    name: string;
  };
  
  // Informații despre perisabilitate
  isPerishable: boolean;
  productionDate?: string;
  expiryInfo?: {
    expiryDate: string;
    daysUntilExpiry: number;
    isExpired: boolean;
    isExpiringSoon: boolean;
  };
  
  // Informații despre unități
  unitInfo: {
    unitType: string;
    unitName: string;
    minQuantity: number;
    quantityStep: number;
    allowFractional: boolean;
  };
  
  // Calculuri
  needsRestock: boolean;
  stockTurnover: number;
  stockValue: number;
  totalValue: number;
  status: string;
  
  // Informații despre livrare
  deliveryInfo: {
    customDeliveryRules: boolean;
    deliveryTimeHours?: number;
    deliveryTimeDays?: number;
    requiresAdvanceOrder: boolean;
    advanceOrderDays?: number;
    advanceOrderHours?: number;
  };
  
  // Mișcări recente
  recentMovements: Array<{
    type: string;
    quantity: number;
    reason: string;
    createdAt: string;
    user?: { name: string };
  }>;
}

export default function InventoryDashboard() {
  const [report, setReport] = useState<StockReport | null>(null);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expired' | 'expiring_soon'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Real-time updates
  const { isConnected } = useWebSocket({
    onInventoryUpdate: (data) => {
      console.log('📦 Inventory update received:', data);
      fetchInventoryData();
    },
    onLowStockAlert: (data) => {
      console.log('⚠️ Low stock alert:', data);
      // Afișează notificare în interfață
      showNotification(`Stoc scăzut: ${data.productName} (${data.currentStock} ${getUnitName(data.productId)} rămase)`, 'warning');
    }
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, filter, searchTerm, sortBy, categoryFilter]);

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/stock/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        
        // Calculează statisticile
        const totalProducts = data.length;
        const inStock = data.filter((p: ProductDetails) => p.status === 'IN_STOCK').length;
        const outOfStock = data.filter((p: ProductDetails) => p.status === 'OUT_OF_STOCK').length;
        const lowStock = data.filter((p: ProductDetails) => p.status === 'LOW_STOCK').length;
        const expired = data.filter((p: ProductDetails) => p.status === 'EXPIRED').length;
        const expiringSoon = data.filter((p: ProductDetails) => p.status === 'EXPIRING_SOON').length;
        const totalValue = data.reduce((sum: number, p: ProductDetails) => sum + p.totalValue, 0);
        const totalStockValue = data.reduce((sum: number, p: ProductDetails) => sum + p.stockValue, 0);
        
        setReport({
          totalProducts,
          inStock,
          outOfStock,
          lowStock,
          expired,
          expiringSoon,
          totalValue,
          totalStockValue
        });
      }
    } catch (error) {
      console.error('Eroare încărcare date inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrare după status
    if (filter !== 'all') {
      filtered = filtered.filter(product => {
        switch (filter) {
          case 'low_stock':
            return product.status === 'LOW_STOCK';
          case 'out_of_stock':
            return product.status === 'OUT_OF_STOCK';
          case 'expired':
            return product.status === 'EXPIRED';
          case 'expiring_soon':
            return product.status === 'EXPIRING_SOON';
          default:
            return true;
        }
      });
    }

    // Filtrare după categorie
    if (categoryFilter) {
      filtered = filtered.filter(product =>
        product.category.name.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sortare
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'stock':
        filtered.sort((a, b) => b.availableStock - a.availableStock);
        break;
      case 'value':
        filtered.sort((a, b) => b.stockValue - a.stockValue);
        break;
      case 'sold':
        filtered.sort((a, b) => b.totalSold - a.totalSold);
        break;
    }

    setFilteredProducts(filtered);
  };

  // Pagination
  const { 
    paginatedItems, 
    currentPage, 
    totalPages, 
    goToPage, 
    totalItems 
  } = usePagination({ 
    items: filteredProducts, 
    itemsPerPage: 5 
  });

  const updateStock = async (productId: string, newStock: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/stock/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId, 
          quantity: newStock, 
          reason: 'Manual stock update from inventory dashboard' 
        })
      });

      if (response.ok) {
        fetchInventoryData();
        showNotification('Stocul a fost actualizat cu succes!', 'success');
      } else {
        const errorData = await response.json();
        showNotification(`Eroare: ${errorData.error || 'Nu s-a putut actualiza stocul'}`, 'error');
      }
    } catch (error) {
      console.error('Eroare actualizare stoc:', error);
      showNotification('Eroare la actualizarea stocului', 'error');
    }
  };

  const getUnitName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product?.unitInfo.unitName || 'bucăți';
  };

  const showNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    // Implementare simplă de notificare - poate fi îmbunătățită cu un sistem de toast
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'text-green-600 bg-green-100';
      case 'LOW_STOCK': return 'text-yellow-600 bg-yellow-100';
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-100';
      case 'EXPIRED': return 'text-red-800 bg-red-200';
      case 'EXPIRING_SOON': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'În Stoc';
      case 'LOW_STOCK': return 'Stoc Scăzut';
      case 'OUT_OF_STOCK': return 'Fără Stoc';
      case 'EXPIRED': return 'Expirat';
      case 'EXPIRING_SOON': return 'Expiră Curând';
      default: return 'Necunoscut';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu status real-time */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Inventar</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Statistici Generale */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Produse</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalProducts}</p>
                <p className="text-xs text-gray-500">Valoare totală: {report.totalValue.toFixed(2)} RON</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">În Stoc</p>
                <p className="text-2xl font-bold text-green-600">{report.inStock}</p>
                <p className="text-xs text-gray-500">Valoare stoc: {report.totalStockValue.toFixed(2)} RON</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Probleme</p>
                <p className="text-2xl font-bold text-yellow-600">{report.lowStock + report.outOfStock}</p>
                <p className="text-xs text-gray-500">Stoc scăzut: {report.lowStock}, Fără stoc: {report.outOfStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expirare</p>
                <p className="text-2xl font-bold text-red-600">{report.expired + report.expiringSoon}</p>
                <p className="text-xs text-gray-500">Expirate: {report.expired}, Expiră curând: {report.expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtre și căutare */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Caută produse sau categorii..."
          filters={[
            {
              label: 'Status',
              value: filter,
              onChange: (value) => setFilter(value as any),
              options: [
                { value: 'all', label: `Toate (${products.length})` },
                { value: 'low_stock', label: `⚠️ Stoc Scăzut (${report?.lowStock || 0})` },
                { value: 'out_of_stock', label: `❌ Fără Stoc (${report?.outOfStock || 0})` },
                { value: 'expired', label: `🚫 Expirate (${report?.expired || 0})` },
                { value: 'expiring_soon', label: `⏰ Expiră Curând (${report?.expiringSoon || 0})` }
              ]
            },
            {
              label: 'Categorie',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: '', label: 'Toate categoriile' },
                ...Array.from(new Set(products.map(p => p.category.name))).map(cat => ({
                  value: cat,
                  label: cat
                }))
              ]
            }
          ]}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: 'name', label: '📝 Nume (A-Z)' },
            { value: 'stock', label: '📦 Stoc' },
            { value: 'value', label: '💰 Valoare' },
            { value: 'sold', label: '📊 Vândute' }
          ]}
          onReset={() => {
            setSearchTerm('');
            setFilter('all');
            setCategoryFilter('');
            setSortBy('name');
          }}
          showReset={searchTerm !== '' || filter !== 'all' || categoryFilter !== '' || sortBy !== 'name'}
        />
      </div>
      {/* Lista detaliată de produse */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Produse ({totalItems} {totalItems !== filteredProducts.length && `din ${filteredProducts.length} filtrate`})
          </h3>
        </div>
        
        {paginatedItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nu există produse care să corespundă filtrelor selectate</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {paginatedItems.map((product) => (
              <div key={product.id} className="p-6">
                <div className="flex items-start justify-between">
                  {/* Informații principale */}
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={product.image || '/images/logo.jpg'}
                      alt={product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{product.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{product.description || 'Fără descriere'}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {/* Tip vânzare și preț per unitate */}
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-600 font-medium">Tip Vânzare</p>
                          <p className="font-bold text-blue-800">
                            {product.unitInfo.unitType === 'piece' ? 'Bucată' : 
                             product.unitInfo.unitType === 'kg' ? 'Kilogram' :
                             product.unitInfo.unitType === 'liter' ? 'Litru' : 
                             product.unitInfo.unitType === 'meter' ? 'Metru' : product.unitInfo.unitName}
                          </p>
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-green-600 font-medium">Preț per {product.unitInfo.unitName}</p>
                          <p className="font-bold text-green-800">{product.price.toFixed(2)} RON/{product.unitInfo.unitName}</p>
                        </div>
                        
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-xs text-orange-600 font-medium">Stoc Disponibil</p>
                          <p className="font-bold text-orange-800">
                            {product.availableStock} {product.unitInfo.unitName}
                            {product.reservedStock > 0 && (
                              <span className="text-xs text-red-600 block">
                                (Rezervat: {product.reservedStock})
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-xs text-purple-600 font-medium">Valoare Totală Stoc</p>
                          <p className="font-bold text-purple-800">{product.stockValue.toFixed(2)} RON</p>
                        </div>
                        
                        {/* Informații suplimentare */}
                        <div>
                          <p className="text-gray-500">Categorie</p>
                          <p className="font-medium">{product.category.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Stoc Total</p>
                          <p className="font-medium">{product.stock} {product.unitInfo.unitName}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Vândut Total</p>
                          <p className="font-medium">{product.totalSold} {product.unitInfo.unitName}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Alertă la</p>
                          <p className="font-medium">{product.lowStockAlert} {product.unitInfo.unitName}</p>
                        </div>
                      </div>
                      
                      {/* Informații despre unități */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">📏 Unități de Măsură</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Tip:</span> {product.unitInfo.unitType}
                          </div>
                          <div>
                            <span className="text-gray-500">Nume:</span> {product.unitInfo.unitName}
                          </div>
                          <div>
                            <span className="text-gray-500">Min:</span> {product.unitInfo.minQuantity}
                          </div>
                          <div>
                            <span className="text-gray-500">Pas:</span> {product.unitInfo.quantityStep}
                          </div>
                        </div>
                        {product.unitInfo.allowFractional && (
                          <p className="text-xs text-blue-600 mt-1">✓ Permite cantități fracționare</p>
                        )}
                      </div>
                      
                      {/* Informații despre perisabilitate */}
                      {product.isPerishable && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                          <h5 className="text-sm font-medium text-orange-700 mb-2">🍎 Produs Perisabil</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {product.productionDate && (
                              <div>
                                <span className="text-orange-600">Fabricat:</span> {new Date(product.productionDate).toLocaleDateString('ro-RO')}
                              </div>
                            )}
                            {product.expiryInfo && (
                              <>
                                <div>
                                  <span className="text-orange-600">Expiră:</span> {new Date(product.expiryInfo.expiryDate).toLocaleDateString('ro-RO')}
                                </div>
                                <div>
                                  <span className="text-orange-600">Zile rămase:</span> {product.expiryInfo.daysUntilExpiry}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Informații despre livrare */}
                      {product.deliveryInfo.customDeliveryRules && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-700 mb-2">🚚 Reguli de Livrare</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {product.deliveryInfo.deliveryTimeHours && (
                              <div>
                                <span className="text-blue-600">Timp livrare:</span> {product.deliveryInfo.deliveryTimeHours}h
                              </div>
                            )}
                            {product.deliveryInfo.deliveryTimeDays && (
                              <div>
                                <span className="text-blue-600">Zile livrare:</span> {product.deliveryInfo.deliveryTimeDays}
                              </div>
                            )}
                            {product.deliveryInfo.requiresAdvanceOrder && (
                              <div className="col-span-2">
                                <span className="text-blue-600">Comandă în avans:</span> {product.deliveryInfo.advanceOrderDays} zile
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Acțiuni */}
                  <div className="ml-4 flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        step={product.unitInfo.allowFractional ? "0.1" : "1"}
                        defaultValue={product.availableStock}
                        className="w-24 px-2 py-1 border rounded text-sm"
                        placeholder="Nou stoc"
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const newStock = parseFloat(input.value);
                          if (!isNaN(newStock)) {
                            updateStock(product.id, newStock);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Actualizează
                      </button>
                    </div>
                    
                    {/* Mișcări recente */}
                    {product.recentMovements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Mișcări recente:</p>
                        <div className="space-y-1">
                          {product.recentMovements.slice(0, 3).map((movement, index) => (
                            <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                              <div className="flex justify-between">
                                <span className={`font-medium ${
                                  movement.type === 'IN' ? 'text-green-600' : 
                                  movement.type === 'OUT' ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '~'}{Math.abs(movement.quantity)}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(movement.createdAt).toLocaleDateString('ro-RO')}
                                </span>
                              </div>
                              <p className="text-gray-600 truncate">{movement.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={5}
              totalItems={totalItems}
            />
          </div>
          </>
        )}
      </div>
    </div>
  );
}