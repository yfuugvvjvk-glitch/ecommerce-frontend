'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/api/categories/${editingId}`, formData);
        setToast({ message: 'Categorie actualizată!', type: 'success' });
      } else {
        await apiClient.post('/api/categories', formData);
        setToast({ message: 'Categorie creată cu succes!', type: 'success' });
      }
      resetForm();
      fetchCategories();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const productsCount = category?._count?.dataItems || 0;
    
    if (productsCount > 0) {
      alert(`Nu poți șterge această categorie deoarece are ${productsCount} produse asociate. Șterge sau mută produsele mai întâi.`);
      return;
    }
    
    if (!confirm('Sigur vrei să ștergi această categorie?')) return;
    
    try {
      await apiClient.delete(`/api/categories/${categoryId}`);
      setToast({ message: 'Categorie ștearsă!', type: 'success' });
      fetchCategories();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la ștergere categorie', type: 'error' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      icon: '',
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ă/g, 'a')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș/g, 's')
      .replace(/ț/g, 't')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
        {showForm ? '❌ Anulează' : '➕ Adaugă Categorie'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-bold">{editingId ? '✏️ Editează Categorie' : '➕ Categorie Nouă'}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nume Categorie *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({ 
                  ...formData, 
                  name,
                  slug: generateSlug(name)
                });
              }}
              className="w-full px-3 py-2 border rounded"
              required
              placeholder="ex: Electronice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-gray-50"
              required
              placeholder="ex: electronice"
            />
            <p className="text-xs text-gray-500 mt-1">Se generează automat din nume</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="📱"
              maxLength={2}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Salvează Categoria
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {category.icon && <span className="text-2xl">{category.icon}</span>}
                <div>
                  <h3 className="font-bold">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {category._count?.dataItems || 0} produse
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
