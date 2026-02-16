'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Download, Eye, Calendar, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ProductTitle from '@/components/ProductTitle';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderItems: Array<{
    quantity: number;
    price: number;
    dataItem: {
      title: string;
      titleEn?: string;
      titleFr?: string;
      titleDe?: string;
      titleEs?: string;
      titleIt?: string;
    };
  }>;
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [invoices, searchQuery, statusFilter, yearFilter, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get('/api/invoices/my-invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];

    // Filter by search query (invoice number, products)
    if (searchQuery) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.orderItems.some(item => 
          item.dataItem.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Filter by year
    if (yearFilter !== 'all') {
      filtered = filtered.filter(invoice => 
        new Date(invoice.createdAt).getFullYear().toString() === yearFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredInvoices(filtered);
  };

  const getAvailableYears = () => {
    const years = invoices.map(invoice => new Date(invoice.createdAt).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const handleViewInvoice = (orderId: string) => {
    window.open(`/api/invoices/order/${orderId}/print`, '_blank');
  };

  const handleDownloadInvoice = async (orderId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/order/${orderId}/print`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
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
        return t('invoices.statusPending');
      case 'PROCESSING':
        return t('invoices.statusProcessing');
      case 'PREPARING':
        return t('invoices.statusPreparing');
      case 'SHIPPING':
        return t('invoices.statusShipping');
      case 'SHIPPED':
        return t('invoices.statusShipped');
      case 'DELIVERED':
        return t('invoices.statusDelivered');
      case 'CANCELLED':
        return t('invoices.statusCancelled');
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return t('invoices.paymentCash');
      case 'card':
        return t('invoices.paymentCard');
      case 'transfer':
        return t('invoices.paymentTransfer');
      default:
        return method;
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 {t('invoices.title')}</h1>
        <p className="text-gray-600">{t('invoices.subtitle')} ({filteredInvoices.length} {t('invoices.of')} {invoices.length})</p>
      </div>

      {/* Filters and Search */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🔍 {t('invoices.filtersTitle')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('invoices.search')}</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('invoices.searchPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('invoices.status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('invoices.allStatuses')}</option>
                <option value="PROCESSING">{t('invoices.statusProcessing')}</option>
                <option value="PREPARING">{t('invoices.statusPreparing')}</option>
                <option value="SHIPPING">{t('invoices.statusShipping')}</option>
                <option value="DELIVERED">{t('invoices.statusDelivered')}</option>
                <option value="CANCELLED">{t('invoices.statusCancelled')}</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('invoices.year')}</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('invoices.allYears')}</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('invoices.sort')}</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">{t('invoices.date')}</option>
                  <option value="amount">{t('invoices.amount')}</option>
                  <option value="status">{t('invoices.status')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  title={sortOrder === 'asc' ? t('invoices.ascending') : t('invoices.descending')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== 'all' || yearFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <span className="text-sm text-gray-600">{t('invoices.activeFilters')}:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {t('invoices.searchFilter')}: "{searchQuery}" 
                  <button onClick={() => setSearchQuery('')} className="ml-1 text-blue-500">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('invoices.statusFilter')}: {getStatusText(statusFilter)}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 text-green-500">×</button>
                </span>
              )}
              {yearFilter !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {t('invoices.yearFilter')}: {yearFilter}
                  <button onClick={() => setYearFilter('all')} className="ml-1 text-purple-500">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setYearFilter('all');
                }}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                {t('invoices.clearAll')}
              </button>
            </div>
          )}
        </div>
      )}

      {filteredInvoices.length === 0 && invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('invoices.noInvoices')}</h3>
          <p className="text-gray-600">{t('invoices.noInvoicesDesc')}</p>
        </div>
      ) : (
        <>
          {filteredInvoices.length === 0 && invoices.length > 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('invoices.noResults')}</h3>
              <p className="text-gray-600">{t('invoices.noResultsDesc')}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t('invoices.invoice')} {invoice.invoiceNumber}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(invoice.createdAt).toLocaleDateString('ro-RO')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {invoice.total.toFixed(2)} RON
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-1">{getPaymentMethodIcon(invoice.paymentMethod)}</span>
                          {getPaymentMethodText(invoice.paymentMethod)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">{t('invoices.products')}:</h4>
                    <div className="space-y-1">
                      {invoice.orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <ProductTitle product={item.dataItem}>
                            {(translatedTitle) => (
                              <span className="text-gray-600">
                                {translatedTitle} x {item.quantity}
                              </span>
                            )}
                          </ProductTitle>
                          <span className="font-medium">
                            {(item.price * item.quantity).toFixed(2)} RON
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('invoices.view')}
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                      className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('invoices.download')}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🖨️ {t('invoices.print')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}