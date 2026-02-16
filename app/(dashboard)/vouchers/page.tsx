'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Ticket } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function VouchersPage() {
  const { t } = useTranslation();
  const [myVouchers, setMyVouchers] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Voucher request form fields
  const [voucherCode, setVoucherCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchMyVouchers();
    fetchAvailableVouchers();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMyVouchers = async () => {
    try {
      const response = await apiClient.get('/api/vouchers');
      console.log('My vouchers:', response.data);
      setMyVouchers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch my vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVouchers = async () => {
    try {
      const response = await apiClient.get('/api/vouchers/active');
      console.log('Available vouchers:', response.data);
      setAvailableVouchers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available vouchers:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/api/vouchers/my-requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch voucher requests:', error);
    }
  };

  const requestVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voucherCode.trim() || !discountValue) {
      setToast({ message: t('vouchers.fillRequired'), type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingRequest) {
        await apiClient.put(`/api/vouchers/my-requests/${editingRequest.id}`, {
          code: voucherCode.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          minPurchase: minPurchase ? parseFloat(minPurchase) : null,
          validUntil: validUntil || null,
          description: description.trim(),
        });
        setToast({ message: t('vouchers.updateSuccess'), type: 'success' });
        setEditingRequest(null);
      } else {
        await apiClient.post('/api/vouchers/request', {
          code: voucherCode.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          minPurchase: minPurchase ? parseFloat(minPurchase) : null,
          validUntil: validUntil || null,
          description: description.trim(),
        });
        setToast({ message: t('vouchers.requestSuccess'), type: 'success' });
      }
      
      // Reset form
      setVoucherCode('');
      setDiscountType('PERCENTAGE');
      setDiscountValue('');
      setMinPurchase('');
      setValidUntil('');
      setDescription('');
      
      fetchRequests();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('vouchers.requestError');
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRequest = (request: any) => {
    setEditingRequest(request);
    setVoucherCode(request.code);
    setDiscountType(request.discountType);
    setDiscountValue(request.discountValue.toString());
    setMinPurchase(request.minPurchase ? request.minPurchase.toString() : '');
    setValidUntil(request.validUntil ? new Date(request.validUntil).toISOString().slice(0, 16) : '');
    setDescription(request.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm(t('vouchers.confirmDelete'))) return;
    try {
      await apiClient.delete(`/api/vouchers/my-requests/${requestId}`);
      setToast({ message: t('vouchers.deleteSuccess'), type: 'success' });
      fetchRequests();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || t('vouchers.deleteError'), type: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setVoucherCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMinPurchase('');
    setValidUntil('');
    setDescription('');
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
      <h1 className="text-3xl font-bold mb-6">🎟️ {t('vouchers.title')}</h1>

      {/* Available Public Vouchers */}
      {availableVouchers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎁 {t('vouchers.availableVouchers')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableVouchers.map((voucher: any) => {
              if (!voucher) return null;
              return (
                <div key={voucher.id} className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-white">
                  <p className="font-mono font-bold text-lg text-purple-600">{voucher.code}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {voucher.discountType === 'PERCENTAGE' 
                      ? `${voucher.discountValue}% ${t('vouchers.percentDiscount')}` 
                      : `${voucher.discountValue} RON ${t('vouchers.percentDiscount')}`}
                  </p>
                  {voucher.minPurchase && (
                    <p className="text-xs text-gray-500">
                      {t('vouchers.minPurchase')} {voucher.minPurchase} RON
                    </p>
                  )}
                  {voucher.validUntil && (
                    <p className="text-xs text-gray-500">
                      {t('vouchers.validUntil')}: {new Date(voucher.validUntil).toLocaleDateString('ro-RO')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* My Vouchers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🎟️ {t('vouchers.myVouchers')}</h2>
          
          {myVouchers.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('vouchers.noVouchers')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('vouchers.noVouchersDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myVouchers.map((userVoucher: any) => {
                if (!userVoucher?.voucher) return null;
                return (
                  <div key={userVoucher.id} className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-lg text-blue-600">{userVoucher.voucher.code}</p>
                        <p className="text-sm text-gray-600">
                          {userVoucher.voucher.discountType === 'PERCENTAGE' 
                            ? `${userVoucher.voucher.discountValue}% ${t('vouchers.percentDiscount')}` 
                            : `${userVoucher.voucher.discountValue} RON ${t('vouchers.percentDiscount')}`}
                        </p>
                        {userVoucher.usedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('vouchers.used')}: {new Date(userVoucher.usedAt).toLocaleDateString('ro-RO')}
                          </p>
                        )}
                      </div>
                      {!userVoucher.usedAt && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          {t('vouchers.use')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`mb-4 p-4 rounded-lg ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {toast.message}
          </div>
        )}

        {/* Request Voucher */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRequest ? `✏️ ${t('vouchers.editRequest')}` : `✨ ${t('vouchers.createRequest')}`}
          </h2>
          
          <form onSubmit={requestVoucher} className="space-y-4">
            {/* Voucher Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.voucherCode')} <span className="text-red-500">{t('vouchers.required')}</span>
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder={t('vouchers.voucherCodePlaceholder')}
                required
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.discountType')} <span className="text-red-500">{t('vouchers.required')}</span>
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENTAGE">{t('vouchers.percentage')}</option>
                <option value="FIXED">{t('vouchers.fixed')}</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.discountValue')} <span className="text-red-500">{t('vouchers.required')}</span>
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('vouchers.discountValuePlaceholder')}
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {discountType === 'PERCENTAGE' ? t('vouchers.discountValueHelp') : t('vouchers.discountValueHelpFixed')}
              </p>
            </div>

            {/* Min Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.minPurchaseAmount')}
              </label>
              <input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('vouchers.minPurchasePlaceholder')}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">{t('vouchers.minPurchaseHelp')}</p>
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.validUntilDate')}
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">{t('vouchers.validUntilHelp')}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vouchers.requestReason')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('vouchers.requestReasonPlaceholder')}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
              >
                {submitting ? t('vouchers.submitting') : editingRequest ? `💾 ${t('vouchers.saveChanges')}` : `📤 ${t('vouchers.submitRequest')}`}
              </button>
              {editingRequest && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  ❌ {t('vouchers.cancel')}
                </button>
              )}
            </div>
          </form>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 {t('vouchers.requestInfo')}
            </p>
          </div>
        </div>
      </div>

      {/* My Voucher Requests */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📋 {t('vouchers.myRequests')}</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('vouchers.noRequests')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono font-bold text-lg text-blue-600">{request.code}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          request.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status === 'PENDING'
                          ? `⏳ ${t('vouchers.statusPending')}`
                          : request.status === 'APPROVED'
                          ? `✅ ${t('vouchers.statusApproved')}`
                          : `❌ ${t('vouchers.statusRejected')}`}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-semibold">{t('vouchers.discount')}:</span>{' '}
                        {request.discountType === 'PERCENTAGE' 
                          ? `${request.discountValue}%` 
                          : `${request.discountValue} RON`}
                      </p>
                      {request.minPurchase && (
                        <p className="text-gray-700">
                          <span className="font-semibold">{t('vouchers.minPurchase')}:</span> {request.minPurchase} RON
                        </p>
                      )}
                      {request.validUntil && (
                        <p className="text-gray-700">
                          <span className="font-semibold">{t('vouchers.validUntil')}:</span>{' '}
                          {new Date(request.validUntil).toLocaleDateString('ro-RO')}
                        </p>
                      )}
                      {request.description && (
                        <p className="text-gray-600 italic mt-2">"{request.description}"</p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {t('vouchers.submitted')}: {new Date(request.createdAt).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleEditRequest(request)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title={t('vouchers.edit')}
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title={t('vouchers.delete')}
                    >
                      🗑️
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
