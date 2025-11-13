'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function VouchersManagement() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [voucherRequests, setVoucherRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'requests'>('vouchers');
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchase: 0,
    validUntil: '',
  });
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    maxUsage: 0,
    validUntil: '',
    isActive: true,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchVouchers();
    fetchVoucherRequests();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await apiClient.get('/api/admin/vouchers');
      setVouchers(response.data);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherRequests = async () => {
    try {
      const response = await apiClient.get('/api/admin/voucher-requests');
      setVoucherRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch voucher requests:', error);
    }
  };

  const handleEdit = (voucher: any) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code,
      description: voucher.description || '',
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minPurchase: voucher.minPurchase || 0,
      maxDiscount: voucher.maxDiscount || 0,
      maxUsage: voucher.maxUsage || 0,
      validUntil: voucher.validUntil ? new Date(voucher.validUntil).toISOString().slice(0, 16) : '',
      isActive: voucher.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/api/admin/vouchers/${editingId}`, formData);
        setToast({ message: 'Voucher actualizat!', type: 'success' });
      } else {
        await apiClient.post('/api/admin/vouchers', formData);
        setToast({ message: 'Voucher creat cu succes!', type: 'success' });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        maxUsage: 0,
        validUntil: '',
        isActive: true,
      });
      fetchVouchers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (!confirm('Sigur vrei să ștergi acest voucher?')) return;
    try {
      await apiClient.delete(`/api/admin/vouchers/${voucherId}`);
      setToast({ message: 'Voucher șters!', type: 'success' });
      fetchVouchers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('Sigur vrei să aprobi această cerere?')) return;
    try {
      await apiClient.post(`/api/admin/voucher-requests/${requestId}/approve`);
      setToast({ message: 'Cerere aprobată! Voucher creat.', type: 'success' });
      fetchVoucherRequests();
      fetchVouchers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Sigur vrei să respingi această cerere?')) return;
    try {
      await apiClient.post(`/api/admin/voucher-requests/${requestId}/reject`);
      setToast({ message: 'Cerere respinsă.', type: 'success' });
      fetchVoucherRequests();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleResetRequest = async (requestId: string) => {
    if (!confirm('Sigur vrei să resetezi această cerere la status În Așteptare?')) return;
    try {
      await apiClient.post(`/api/admin/voucher-requests/${requestId}/reset`);
      setToast({ message: 'Cerere resetată la În Așteptare.', type: 'success' });
      fetchVoucherRequests();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleEditRequest = (request: any) => {
    setEditingRequest(request);
    setRequestFormData({
      code: request.code,
      description: request.description,
      discountType: request.discountType,
      discountValue: request.discountValue,
      minPurchase: request.minPurchase || 0,
      validUntil: request.validUntil ? new Date(request.validUntil).toISOString().slice(0, 16) : '',
    });
    setShowRequestForm(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Sigur vrei să ștergi această cerere de voucher?')) return;
    try {
      await apiClient.delete(`/api/admin/voucher-requests/${requestId}`);
      setToast({ message: 'Cerere ștearsă!', type: 'success' });
      fetchVoucherRequests();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await apiClient.put(`/api/admin/voucher-requests/${editingRequest.id}`, requestFormData);
        setToast({ message: 'Cerere actualizată!', type: 'success' });
      }
      setShowRequestForm(false);
      setEditingRequest(null);
      setRequestFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchase: 0,
        validUntil: '',
      });
      fetchVoucherRequests();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  const pendingRequests = voucherRequests.filter(r => r.status.toUpperCase() === 'PENDING');

  return (
    <div>
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2 rounded ${activeTab === 'vouchers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          🎟️ Vouchere ({vouchers.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          📋 Cereri ({pendingRequests.length})
        </button>
      </div>

      {activeTab === 'vouchers' && (
        <>
          <button
        onClick={() => {
          setShowForm(!showForm);
          if (showForm) {
            setEditingId(null);
            setFormData({
              code: '',
              description: '',
              discountType: 'percentage',
              discountValue: 0,
              minPurchase: 0,
              maxDiscount: 0,
              maxUsage: 0,
              validUntil: '',
              isActive: true,
            });
          }
        }}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? '❌ Anulează' : '➕ Adaugă Voucher'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-bold">{editingId ? '✏️ Editează Voucher' : '➕ Voucher Nou'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cod Voucher *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tip Discount *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="PERCENTAGE">Procent (%)</option>
                <option value="FIXED">Sumă fixă (RON)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valoare Discount *</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Achiziție Minimă</label>
              <input
                type="number"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Maxim</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Limită Utilizări</label>
              <input
                type="number"
                value={formData.maxUsage}
                onChange={(e) => setFormData({ ...formData, maxUsage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descriere</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valabil până la</label>
            <input
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Salvează Voucher
          </button>
        </form>
      )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xl font-bold text-blue-600">{voucher.code}</p>
                    <p className="text-sm text-gray-600">{voucher.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(voucher)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(voucher.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Discount:</strong> {voucher.discountValue}
                    {voucher.discountType === 'PERCENTAGE' ? '%' : ' RON'}
                  </p>
                  {voucher.minPurchase > 0 && (
                    <p><strong>Minim:</strong> {voucher.minPurchase} RON</p>
                  )}
                  <p><strong>Utilizări:</strong> {voucher.usedCount} / {voucher.maxUsage || '∞'}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={voucher.isActive ? 'text-green-600' : 'text-red-600'}>
                      {voucher.isActive ? 'Activ' : 'Inactiv'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {showRequestForm && (
            <form onSubmit={handleSubmitRequest} className="bg-white p-6 rounded-lg shadow space-y-4 mb-4">
              <h3 className="text-lg font-bold">✏️ Editează Cerere Voucher</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cod Voucher *</label>
                  <input
                    type="text"
                    value={requestFormData.code}
                    onChange={(e) => setRequestFormData({ ...requestFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tip Discount *</label>
                  <select
                    value={requestFormData.discountType}
                    onChange={(e) => setRequestFormData({ ...requestFormData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="PERCENTAGE">Procent (%)</option>
                    <option value="FIXED">Sumă fixă (RON)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valoare Discount *</label>
                  <input
                    type="number"
                    value={requestFormData.discountValue}
                    onChange={(e) => setRequestFormData({ ...requestFormData, discountValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Achiziție Minimă</label>
                  <input
                    type="number"
                    value={requestFormData.minPurchase}
                    onChange={(e) => setRequestFormData({ ...requestFormData, minPurchase: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descriere *</label>
                <input
                  type="text"
                  value={requestFormData.description}
                  onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valabil până la</label>
                <input
                  type="datetime-local"
                  value={requestFormData.validUntil}
                  onChange={(e) => setRequestFormData({ ...requestFormData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  💾 Salvează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setEditingRequest(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ❌ Anulează
                </button>
              </div>
            </form>
          )}
          {voucherRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nu există cereri de vouchere.</p>
          ) : (
            voucherRequests.map((request) => (
              <div key={request.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-xl font-bold text-purple-600">{request.code}</p>
                    <p className="text-sm text-gray-600">{request.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cerere de la: <strong>{request.user.name}</strong> ({request.user.email})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      request.status.toUpperCase() === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      request.status.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status.toUpperCase() === 'PENDING' ? '⏳ În așteptare' :
                       request.status.toUpperCase() === 'APPROVED' ? '✅ Aprobat' :
                       '❌ Respins'}
                    </span>
                    <button
                      onClick={() => handleEditRequest(request)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editează"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Șterge"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p>
                    <strong>Discount:</strong> {request.discountValue}
                    {request.discountType === 'PERCENTAGE' ? '%' : ' RON'}
                  </p>
                  {request.minPurchase && request.minPurchase > 0 && (
                    <p><strong>Minim:</strong> {request.minPurchase} RON</p>
                  )}
                  {request.validUntil && (
                    <p><strong>Valabil până:</strong> {new Date(request.validUntil).toLocaleDateString('ro-RO')}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {request.status.toUpperCase() !== 'APPROVED' && (
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✅ {request.status.toUpperCase() === 'PENDING' ? 'Aprobă' : 'Marchează Aprobat'}
                    </button>
                  )}
                  {request.status.toUpperCase() !== 'REJECTED' && (
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      ❌ {request.status.toUpperCase() === 'PENDING' ? 'Respinge' : 'Marchează Respins'}
                    </button>
                  )}
                  {request.status.toUpperCase() !== 'PENDING' && (
                    <button
                      onClick={() => handleResetRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      ⏳ Resetează la În Așteptare
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
