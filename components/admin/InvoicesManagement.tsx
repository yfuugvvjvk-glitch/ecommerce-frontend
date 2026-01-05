'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Eye, User, Calendar, CreditCard, Copy, Trash2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: Array<{
    quantity: number;
    price: number;
    dataItem: {
      title: string;
    };
  }>;
}

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    fetchInvoices();
  }, [currentPage]);

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get(`/api/invoices/admin/all?page=${currentPage}&limit=50`);
      setInvoices(response.data.invoices);
      setFilteredInvoices(response.data.invoices);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrare și sortare
  useEffect(() => {
    let filtered = [...invoices];

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Filtrare după an
    if (yearFilter !== 'all') {
      filtered = filtered.filter(invoice => 
        new Date(invoice.createdAt).getFullYear().toString() === yearFilter
      );
    }

    // Sortare
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'value-desc':
          return b.total - a.total;
        case 'value-asc':
          return a.total - b.total;
        case 'name-asc':
          return a.user.name.localeCompare(b.user.name);
        case 'name-desc':
          return b.user.name.localeCompare(a.user.name);
        default:
          return 0;
      }
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, yearFilter, sortBy]);

  const handleViewInvoice = (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Nu ești autentificat. Te rog să te loghezi din nou.');
      return;
    }
    
    // Creează un form pentru a trimite token-ul via POST
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices/order/${orderId}/print`;
    form.target = '_blank';
    
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleDuplicateInvoice = async (orderId: string) => {
    if (!confirm('Ești sigur că vrei să duplici această factură?')) return;
    
    try {
      const response = await apiClient.post(`/api/invoices/admin/duplicate/${orderId}`);
      alert('Factură duplicată cu succes!');
      fetchInvoices(); // Refresh lista
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la duplicarea facturii');
    }
  };

  const handleDeleteInvoice = async (orderId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această factură? Această acțiune nu poate fi anulată!')) return;
    
    try {
      await apiClient.delete(`/api/invoices/admin/delete/${orderId}`);
      alert('Factură ștearsă cu succes!');
      fetchInvoices(); // Refresh lista
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la ștergerea facturii');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
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
      case 'PENDING':
        return 'În așteptare';
      case 'PROCESSING':
        return 'În procesare';
      case 'SHIPPED':
        return 'Expediată';
      case 'DELIVERED':
        return 'Livrată';
      case 'CANCELLED':
        return 'Anulată';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'cash':
        return '💵';
      case 'transfer':
        return '🏦';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Obține anii unici pentru filtru
  const uniqueYears = [...new Set(invoices.map(inv => new Date(inv.createdAt).getFullYear()))].sort((a, b) => b - a);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Gestionare Facturi</h2>
          <p className="text-gray-600">Toate facturile generate în sistem ({filteredInvoices.length} din {invoices.length})</p>
        </div>
        <button
          onClick={async () => {
            if (confirm('Vrei să generezi facturi pentru toate comenzile care nu au încă facturi?')) {
              try {
                const response = await apiClient.post('/api/invoices/admin/generate-missing');
                if (response.status === 200) {
                  alert(`Succes! Au fost generate ${response.data.generated} facturi noi.`);
                  fetchInvoices(); // Reîncarcă lista
                } else {
                  alert('Eroare la generarea facturilor');
                }
              } catch (error) {
                console.error('Error generating invoices:', error);
                alert('Eroare la generarea facturilor');
              }
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          📄 Generează Facturi Lipsă
        </button>
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
              placeholder="Nume, email, nr. factură..."
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate statusurile</option>
              <option value="PROCESSING">În procesare</option>
              <option value="PREPARING">Se pregătește</option>
              <option value="SHIPPING">În livrare</option>
              <option value="DELIVERED">Livrat</option>
              <option value="CANCELLED">Anulat</option>
            </select>
          </div>

          {/* Filtru An */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 An
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toți anii</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
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
              <option value="value-desc">Valoare (Mare → Mică)</option>
              <option value="value-asc">Valoare (Mică → Mare)</option>
              <option value="name-asc">Nume (A → Z)</option>
              <option value="name-desc">Nume (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Butoane Reset */}
        {(searchTerm || statusFilter !== 'all' || yearFilter !== 'all' || sortBy !== 'date-desc') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setYearFilter('all');
                setSortBy('date-desc');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              🔄 Resetează Filtrele
            </button>
          </div>
        )}
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nu există facturi</h3>
          <p className="text-gray-600">Facturile vor apărea aici după plasarea comenzilor.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        <span className="font-medium">{invoice.user.name}</span>
                        <span className="mx-2">•</span>
                        <span>{invoice.user.email}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(invoice.createdAt).toLocaleDateString('ro-RO')}
                        <span className="mx-2">•</span>
                        <span className="mr-1">{getPaymentMethodIcon(invoice.paymentMethod)}</span>
                        {invoice.paymentMethod === 'cash' ? 'Numerar' : 
                         invoice.paymentMethod === 'card' ? 'Card' : 'Transfer'}
                      </div>

                      <div className="text-sm text-gray-600">
                        <strong>Produse:</strong> {invoice.orderItems.map(item => 
                          `${item.dataItem.title} (${item.quantity}x)`
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {invoice.total.toFixed(2)} RON
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vizualizează
                      </button>
                      <button
                        onClick={() => handleDuplicateInvoice(invoice.id)}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplică
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Șterge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Următorul
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}