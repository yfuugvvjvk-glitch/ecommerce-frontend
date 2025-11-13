'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

export default function OffersManagement() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    discount: 0,
    validUntil: '',
    active: true,
    productIds: [] as string[],
  });
  const [products, setProducts] = useState<any[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/data');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await apiClient.get('/api/admin/offers');
      setOffers(response.data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: any) => {
    setEditingId(offer.id);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      image: offer.image || '',
      discount: offer.discount || 0,
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 16) : '',
      active: offer.active,
      productIds: offer.productIds || [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Tip fișier invalid. Doar JPG, PNG, GIF și WEBP sunt permise.', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Fișierul este prea mare. Dimensiunea maximă este 5MB.', type: 'error' });
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await apiClient.post('/api/admin/offers/upload-image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData({ ...formData, image: response.data.url });
      setToast({ message: 'Imagine încărcată cu succes!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la încărcare imagine', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.image) {
      setToast({ message: 'Te rog completează titlul, descrierea și imaginea!', type: 'error' });
      return;
    }

    if (!formData.validUntil) {
      setToast({ message: 'Te rog selectează data de expirare!', type: 'error' });
      return;
    }

    try {
      const dataToSend = {
        title: formData.title,
        description: formData.description,
        image: formData.image,
        discount: Number(formData.discount) || 0,
        validUntil: formData.validUntil,
        active: formData.active,
        productIds: formData.productIds,
      };

      if (editingId) {
        await apiClient.put(`/api/admin/offers/${editingId}`, dataToSend);
        setToast({ message: 'Ofertă actualizată!', type: 'success' });
      } else {
        await apiClient.post('/api/admin/offers', dataToSend);
        setToast({ message: 'Ofertă creată cu succes!', type: 'success' });
      }
      resetForm();
      fetchOffers();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      setToast({ message: error.response?.data?.error || 'Eroare la salvare ofertă', type: 'error' });
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Sigur vrei să ștergi această ofertă?')) return;
    try {
      await apiClient.delete(`/api/admin/offers/${offerId}`);
      setToast({ message: 'Ofertă ștearsă!', type: 'success' });
      fetchOffers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      discount: 0,
      validUntil: '',
      active: true,
      productIds: [],
    });
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div>
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <button
        onClick={() => {
          if (showForm) resetForm();
          else setShowForm(true);
        }}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? '❌ Anulează' : '➕ Adaugă Ofertă'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-bold">{editingId ? '✏️ Editează Ofertă' : '➕ Ofertă Nouă'}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Titlu *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descriere *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Imagine Ofertă *</label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://... sau /images/offer.jpg"
                    required
                  />
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap"
                  >
                    {uploadingImage ? '📤...' : '📷'}
                  </button>
                </div>
              </div>
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 h-20 w-32 object-cover rounded border" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valabil până la *</label>
            <input
              type="datetime-local"
              value={formData.validUntil}
              required
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">Ofertă activă</label>
          </div>

          {/* Product Selector */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Produse în ofertă (opțional)</label>
              <button
                type="button"
                onClick={() => setShowProductSelector(!showProductSelector)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showProductSelector ? '▼ Ascunde' : '▶ Selectează produse'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Lasă gol pentru a aplica oferta la toate produsele cu discount {formData.discount}%
            </p>
            
            {showProductSelector && (
              <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.productIds.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, productIds: [...formData.productIds, product.id] });
                        } else {
                          setFormData({ ...formData, productIds: formData.productIds.filter(id => id !== product.id) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{product.title}</span>
                  </label>
                ))}
              </div>
            )}
            
            {formData.productIds.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {formData.productIds.length} produse selectate
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Salvează Oferta
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white border rounded-lg overflow-hidden">
            {offer.image && (
              <img src={offer.image} alt={offer.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{offer.title}</h3>
                  <p className="text-sm text-gray-600">{offer.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Discount:</strong> {offer.discount}%</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={offer.active ? 'text-green-600' : 'text-red-600'}>
                    {offer.active ? 'Activă' : 'Inactivă'}
                  </span>
                </p>
                {offer.validUntil && (
                  <p><strong>Valabil până:</strong> {new Date(offer.validUntil).toLocaleDateString('ro-RO')}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
