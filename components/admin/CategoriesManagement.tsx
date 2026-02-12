'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePagination } from '@/lib/usePagination';
import Pagination from '@/components/Pagination';
import FilterBar from './FilterBar';
import RichTextEditor from '../RichTextEditor';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filtre și căutare
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    parentId: '',
    isActive: true,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filtrare și sortare
    let filtered = [...categories];

    // Căutare
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după status
    if (filterStatus === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    // Filtrare după tip (categorie principală vs subcategorie)
    if (filterType === 'main') {
      filtered = filtered.filter(c => !c.parentId);
    } else if (filterType === 'sub') {
      filtered = filtered.filter(c => c.parentId);
    }

    // Sortare
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'products':
        filtered.sort((a, b) => (b._count?.dataItems || 0) - (a._count?.dataItems || 0));
        break;
      case 'position':
        filtered.sort((a, b) => (a.position || 0) - (b.position || 0));
        break;
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm, filterStatus, filterType, sortBy]);

  // Pagination hook - MUST be at component top level
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems } = usePagination({ 
    items: filteredCategories, 
    itemsPerPage: 5 // MODIFICAT: 5 categorii per pagină
  });

  const fetchCategories = async () => {
    try {
      // Admin vede toate categoriile (inclusiv cele ascunse)
      const response = await apiClient.get('/api/categories?showAll=true&includeSubcategories=true');
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
      description: category.description || '',
      parentId: category.parentId || '',
      isActive: category.isActive !== undefined ? category.isActive : true,
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
      description: '',
      parentId: '',
      isActive: true,
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

      {/* Filtre și căutare */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Caută după nume, slug sau descriere..."
        filters={[
          {
            label: 'Status',
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: '', label: 'Toate' },
              { value: 'active', label: '✅ Active' },
              { value: 'inactive', label: '❌ Inactive' }
            ]
          },
          {
            label: 'Tip',
            value: filterType,
            onChange: setFilterType,
            options: [
              { value: '', label: 'Toate tipurile' },
              { value: 'main', label: '📁 Categorii principale' },
              { value: 'sub', label: '📂 Subcategorii' }
            ]
          }
        ]}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'name', label: '📝 Nume (A-Z)' },
          { value: 'products', label: '📦 Număr produse' },
          { value: 'position', label: '🔢 Poziție' }
        ]}
        onReset={() => {
          setSearchTerm('');
          setFilterStatus('');
          setFilterType('');
          setSortBy('name');
        }}
        showReset={searchTerm !== '' || filterStatus !== '' || filterType !== '' || sortBy !== 'name'}
      />

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
            <RichTextEditor
              value={formData.name}
              onChange={(value) => {
                setFormData({ 
                  ...formData, 
                  name: value,
                  slug: generateSlug(value.replace(/<[^>]*>/g, '')) // Remove HTML tags for slug
                });
              }}
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
            <label className="block text-sm font-medium mb-1">Descriere</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Descriere detaliată a categoriei..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categorie Părinte (opțional)</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Categorie Principală --</option>
              {categories
                .filter(cat => !cat.parentId && cat.id !== editingId)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Lasă necompletat pentru categorie principală sau selectează o categorie părinte pentru subcategorie
            </p>
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

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              👁️ Categorie vizibilă pentru utilizatori
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-2 ml-7">
            Categoriile ascunse nu vor fi afișate în site, dar produsele rămân accesibile
          </p>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Salvează Categoria
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedItems.map((category) => (
                <div key={category.id} className={`bg-white border rounded-lg p-4 ${!category.isActive ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {category.icon && <span className="text-2xl">{category.icon}</span>}
                      <div>
                        <h3 className="font-bold flex items-center gap-2">
                          {category.name}
                          {!category.isActive && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Ascuns</span>}
                        </h3>
                        <p className="text-xs text-gray-500">{category.slug}</p>
                        {category.parent && (
                          <p className="text-xs text-blue-600 mt-1">
                            └─ Sub: {category.parent.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editează"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Șterge"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {category._count?.dataItems || 0} produse
                  </p>
            </div>
          ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        itemsPerPage={10}
        totalItems={totalItems}
      />
    </div>
  );
}
