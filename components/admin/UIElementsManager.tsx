'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface UIElement {
  id: string;
  type: 'button' | 'banner' | 'widget' | 'section';
  label: string;
  icon?: string;
  position: 'header' | 'footer' | 'sidebar' | 'floating' | 'custom';
  page: string[]; // Pe ce pagini să apară: ['all', 'dashboard', 'products', etc.]
  order: number; // Ordinea de afișare
  size: 'small' | 'medium' | 'large';
  color?: string;
  link?: string;
  isVisible: boolean;
  customCSS?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UIElementsManager() {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [filteredElements, setFilteredElements] = useState<UIElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingElement, setEditingElement] = useState<UIElement | null>(null);
  const [formData, setFormData] = useState<Partial<UIElement>>({
    type: 'button',
    label: '',
    position: 'floating',
    page: ['all'],
    order: 0,
    size: 'medium',
    isVisible: true,
  });
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState('order-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const pageOptions = [
    { value: 'all', label: 'Toate paginile' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'products', label: 'Produse' },
    { value: 'shop', label: 'Magazin' },
    { value: 'cart', label: 'Coș' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'profile', label: 'Profil' },
    { value: 'orders', label: 'Comenzi' },
    { value: 'about', label: 'Despre' },
    { value: 'contact', label: 'Contact' },
  ];

  const positionOptions = [
    { value: 'header', label: 'Header (sus)' },
    { value: 'footer', label: 'Footer (jos)' },
    { value: 'sidebar', label: 'Sidebar (lateral)' },
    { value: 'floating', label: 'Floating (plutitor)' },
    { value: 'custom', label: 'Poziție personalizată' },
  ];

  const sizeOptions = [
    { value: 'small', label: 'Mic' },
    { value: 'medium', label: 'Mediu' },
    { value: 'large', label: 'Mare' },
  ];

  useEffect(() => {
    fetchElements();
  }, []);
  
  // Filtrare și sortare
  useEffect(() => {
    let filtered = [...elements];

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(element =>
        element.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după tip
    if (typeFilter !== 'all') {
      filtered = filtered.filter(element => element.type === typeFilter);
    }

    // Filtrare după poziție
    if (positionFilter !== 'all') {
      filtered = filtered.filter(element => element.position === positionFilter);
    }

    // Filtrare după vizibilitate
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(element =>
        visibilityFilter === 'visible' ? element.isVisible : !element.isVisible
      );
    }

    // Sortare
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'order-asc':
          return a.order - b.order;
        case 'order-desc':
          return b.order - a.order;
        case 'label-asc':
          return a.label.localeCompare(b.label);
        case 'label-desc':
          return b.label.localeCompare(a.label);
        default:
          return 0;
      }
    });

    setFilteredElements(filtered);
  }, [elements, searchTerm, typeFilter, positionFilter, visibilityFilter, sortBy]);

  const fetchElements = async () => {
    try {
      setLoading(true);
      // TODO: Implementează endpoint-ul în backend
      // const response = await apiClient.get('/api/admin/ui-elements');
      // setElements(response.data);
      
      // Date demo pentru moment
      setElements([
        {
          id: '1',
          type: 'button',
          label: 'Chat AI',
          icon: '🤖',
          position: 'floating',
          page: ['all'],
          order: 1,
          size: 'large',
          color: '#3B82F6',
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'button',
          label: 'Ajutor',
          icon: '❓',
          position: 'floating',
          page: ['all'],
          order: 2,
          size: 'medium',
          color: '#10B981',
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setFilteredElements([
        {
          id: '1',
          type: 'button',
          label: 'Chat AI',
          icon: '🤖',
          position: 'floating',
          page: ['all'],
          order: 1,
          size: 'large',
          color: '#3B82F6',
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'button',
          label: 'Ajutor',
          icon: '❓',
          position: 'floating',
          page: ['all'],
          order: 2,
          size: 'medium',
          color: '#10B981',
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching UI elements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingElement) {
        // Update
        await apiClient.put(`/api/admin/ui-elements/${editingElement.id}`, formData);
      } else {
        // Create
        await apiClient.post('/api/admin/ui-elements', formData);
      }
      
      setShowAddModal(false);
      setEditingElement(null);
      setFormData({
        type: 'button',
        label: '',
        position: 'floating',
        page: ['all'],
        order: 0,
        size: 'medium',
        isVisible: true,
      });
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
      alert('Eroare la salvare');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest element?')) return;
    
    try {
      await apiClient.delete(`/api/admin/ui-elements/${id}`);
      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
      alert('Eroare la ștergere');
    }
  };

  const handleEdit = (element: UIElement) => {
    setEditingElement(element);
    setFormData(element);
    setShowAddModal(true);
  };

  const handleToggleVisibility = async (element: UIElement) => {
    try {
      await apiClient.patch(`/api/admin/ui-elements/${element.id}/toggle-visibility`);
      fetchElements();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleReorder = async (elementId: string, direction: 'up' | 'down') => {
    try {
      await apiClient.patch(`/api/admin/ui-elements/${elementId}/reorder`, { direction });
      fetchElements();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Paginare
  const totalPages = Math.ceil(filteredElements.length / itemsPerPage);
  const paginatedElements = filteredElements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Elemente UI</h2>
          <p className="text-gray-600">Gestionează butoane, bannere și alte elemente vizibile pe site ({filteredElements.length} din {elements.length})</p>
        </div>
        <button
          onClick={() => {
            setEditingElement(null);
            setFormData({
              type: 'button',
              label: '',
              position: 'floating',
              page: ['all'],
              order: 0,
              size: 'medium',
              isVisible: true,
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ➕ Adaugă Element
        </button>
      </div>

      {/* Filtre și Căutare */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Căutare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Caută
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Etichetă..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtru Tip */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📦 Tip
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate tipurile</option>
              <option value="button">Buton</option>
              <option value="banner">Banner</option>
              <option value="widget">Widget</option>
              <option value="section">Secțiune</option>
            </select>
          </div>

          {/* Filtru Poziție */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Poziție
            </label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate pozițiile</option>
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar</option>
              <option value="floating">Floating</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Filtru Vizibilitate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👁️ Vizibilitate
            </label>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toate</option>
              <option value="visible">Vizibil</option>
              <option value="hidden">Ascuns</option>
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
              <option value="order-asc">Ordine (Mic → Mare)</option>
              <option value="order-desc">Ordine (Mare → Mic)</option>
              <option value="label-asc">Etichetă (A → Z)</option>
              <option value="label-desc">Etichetă (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Butoane Reset */}
        {(searchTerm || typeFilter !== 'all' || positionFilter !== 'all' || visibilityFilter !== 'all' || sortBy !== 'order-asc') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setPositionFilter('all');
                setVisibilityFilter('all');
                setSortBy('order-asc');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              🔄 Resetează Filtrele
            </button>
          </div>
        )}
      </div>

      {/* Lista elemente */}
      <div className="grid gap-4">
        {paginatedElements.map((element, index) => (
          <div
            key={element.id}
            className={`bg-white border rounded-lg p-4 ${
              !element.isVisible ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(element.id, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleReorder(element.id, 'down')}
                    disabled={index === elements.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div
                  className={`w-16 h-16 rounded flex items-center justify-center text-2xl`}
                  style={{ backgroundColor: element.color || '#E5E7EB' }}
                >
                  {element.icon || '📌'}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{element.label}</h3>
                  <div className="flex gap-2 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {element.type}
                    </span>
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      {positionOptions.find(p => p.value === element.position)?.label}
                    </span>
                    <span className="bg-green-100 px-2 py-1 rounded">
                      {sizeOptions.find(s => s.value === element.size)?.label}
                    </span>
                    <span className="bg-purple-100 px-2 py-1 rounded">
                      Ordine: {element.order}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pagini: {element.page.includes('all') ? 'Toate' : element.page.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleVisibility(element)}
                  className={`px-3 py-1 rounded text-sm ${
                    element.isVisible
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {element.isVisible ? '👁️ Vizibil' : '🚫 Ascuns'}
                </button>

                <button
                  onClick={() => handleEdit(element)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  ✏️ Editează
                </button>

                <button
                  onClick={() => handleDelete(element.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  🗑️ Șterge
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredElements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl mb-2">📭</p>
            <p>Nu există elemente UI configurate</p>
            <p className="text-sm">Adaugă primul element pentru a începe</p>
          </div>
        )}
      </div>
      
      {/* Paginare */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ← Anterior
          </button>
          
          <span className="text-sm text-gray-600">
            Pagina {currentPage} din {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Următorul →
          </button>
        </div>
      )}

      {/* Modal Adăugare/Editare */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingElement ? 'Editează Element' : 'Adaugă Element Nou'}
            </h3>

            <div className="space-y-4">
              {/* Tip */}
              <div>
                <label className="block text-sm font-medium mb-1">Tip Element</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="button">Buton</option>
                  <option value="banner">Banner</option>
                  <option value="widget">Widget</option>
                  <option value="section">Secțiune</option>
                </select>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium mb-1">Etichetă</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Chat AI, Ajutor, etc."
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: 🤖, ❓, 💬, etc."
                />
              </div>

              {/* Poziție */}
              <div>
                <label className="block text-sm font-medium mb-1">Poziție</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  {positionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Pagini */}
              <div>
                <label className="block text-sm font-medium mb-1">Pe ce pagini să apară</label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto">
                  {pageOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.page?.includes(opt.value)}
                        onChange={(e) => {
                          const newPages = e.target.checked
                            ? [...(formData.page || []), opt.value]
                            : (formData.page || []).filter(p => p !== opt.value);
                          setFormData({ ...formData, page: newPages });
                        }}
                        className="rounded"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mărime */}
              <div>
                <label className="block text-sm font-medium mb-1">Mărime</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  {sizeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Ordine */}
              <div>
                <label className="block text-sm font-medium mb-1">Ordine de afișare</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Număr mai mic = apare mai sus/mai în față</p>
              </div>

              {/* Culoare */}
              <div>
                <label className="block text-sm font-medium mb-1">Culoare</label>
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border rounded"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium mb-1">Link (opțional)</label>
                <input
                  type="text"
                  value={formData.link || ''}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="/products, https://example.com, etc."
                />
              </div>

              {/* CSS Personalizat */}
              <div>
                <label className="block text-sm font-medium mb-1">CSS Personalizat (opțional)</label>
                <textarea
                  value={formData.customCSS || ''}
                  onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                  className="w-full border rounded px-3 py-2 font-mono text-sm"
                  rows={3}
                  placeholder="bottom: 20px; right: 20px; border-radius: 50%;"
                />
              </div>

              {/* Vizibilitate */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Vizibil pe site</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingElement(null);
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingElement ? 'Salvează Modificările' : 'Adaugă Element'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
