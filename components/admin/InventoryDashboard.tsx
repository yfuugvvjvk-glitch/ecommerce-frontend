'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface StockReport {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
}

interface LowStockProduct {
  id: string;
  title: string;
  stock: number;
  lowStockAlert: number;
  isInStock: boolean;
  image: string;
  category: {
    name: string;
  };
}

export default function InventoryDashboard() {
  const [report, setReport] = useState<StockReport | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [reportRes, lowStockRes] = await Promise.all([
        fetch('/api/inventory/admin/report', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/admin/low-stock', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReport(reportData);
      }

      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json();
        setLowStockProducts(lowStockData);
      }
    } catch (error) {
      console.error('Eroare încărcare date inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/admin/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });

      if (response.ok) {
        // Reîncarcă datele
        fetchInventoryData();
      }
    } catch (error) {
      console.error('Eroare actualizare stoc:', error);
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
      {/* Statistici Generale */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Produse</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">În Stoc</p>
                <p className="text-2xl font-bold text-green-600">{report.inStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stoc Scăzut</p>
                <p className="text-2xl font-bold text-yellow-600">{report.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fără Stoc</p>
                <p className="text-2xl font-bold text-red-600">{report.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Produse cu Stoc Scăzut */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Produse cu Stoc Scăzut ({lowStockProducts.length})
          </h3>
        </div>
        
        {lowStockProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nu există produse cu stoc scăzut</p>
          </div>
        ) : (
          <div className="divide-y">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.title}</h4>
                    <p className="text-sm text-gray-500">{product.category.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      product.stock === 0 ? 'text-red-600' : 
                      product.stock <= product.lowStockAlert ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {product.stock === 0 ? 'Fără stoc' : `${product.stock} bucăți`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Alertă la {product.lowStockAlert} bucăți
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      defaultValue={product.stock}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      onBlur={(e) => {
                        const newStock = parseInt(e.target.value);
                        if (newStock !== product.stock && !isNaN(newStock)) {
                          updateStock(product.id, newStock);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector(`input[defaultValue="${product.stock}"]`) as HTMLInputElement;
                        if (input) {
                          const newStock = parseInt(input.value);
                          if (!isNaN(newStock)) {
                            updateStock(product.id, newStock);
                          }
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Actualizează
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}