'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';
import LivePageEditor from './LivePageEditor';
import MediaManager from './MediaManager';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  sections?: any[];
}

interface SiteConfig {
  key: string;
  value: any;
  type: string;
  description?: string;
  isPublic: boolean;
}

export default function ContentManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [siteConfigs, setSiteConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'config' | 'media'>('pages');
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageData, setNewPageData] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Real-time updates
  const { isConnected } = useWebSocket({
    onContentUpdate: (data) => {
      console.log('Content update received:', data);
      fetchPages();
    }
  });

  useEffect(() => {
    fetchPages();
    fetchSiteConfigs();
  }, []);
  
  // Filtrare și sortare pentru pagini
  useEffect(() => {
    let filtered = [...pages];

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(page =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(page =>
        filterStatus === 'published' ? page.isPublished : !page.isPublished
      );
    }

    // Sortare
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'date-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'slug-asc':
          return a.slug.localeCompare(b.slug);
        case 'slug-desc':
          return b.slug.localeCompare(a.slug);
        default:
          return 0;
      }
    });

    setFilteredPages(filtered);
  }, [pages, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchPages = async () => {
    try {
      const response = await apiClient.get('/api/admin/content/pages');
      setPages(response.data || []);
      setFilteredPages(response.data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setPages([]);
      setFilteredPages([]);
      setToast({ message: 'Eroare la încărcarea paginilor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteConfigs = async () => {
    try {
      const response = await apiClient.get('/api/admin/site-config');
      const configs = response.data || [];
      
      // Parse JSON strings to objects for easier editing
      const parsedConfigs = configs.map((config: any) => {
        if (config.type === 'json' && typeof config.value === 'string') {
          try {
            const parsed = JSON.parse(config.value);
            return {
              ...config,
              value: parsed // Keep as object, not string
            };
          } catch (e) {
            return config;
          }
        }
        return config;
      });
      
      setSiteConfigs(parsedConfigs);
    } catch (error) {
      console.error('Error fetching site configs:', error);
      setToast({ message: 'Eroare la încărcarea configurațiilor', type: 'error' });
    }
  };

  const handleCreatePage = async () => {
    try {
      if (!newPageData.slug || !newPageData.title) {
        setToast({ message: 'Vă rugăm să completați slug-ul și titlul paginii', type: 'error' });
        return;
      }

      await apiClient.post('/api/admin/content/pages', newPageData);
      setShowNewPageModal(false);
      setNewPageData({ slug: '', title: '', content: '', metaTitle: '', metaDescription: '' });
      fetchPages();
      setToast({ message: 'Pagina a fost creată cu succes!', type: 'success' });
    } catch (error: any) {
      console.error('Error creating page:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la crearea paginii', 
        type: 'error' 
      });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Sigur vrei să ștergi această pagină? Această acțiune nu poate fi anulată.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/content/pages/${pageId}`);
      fetchPages();
      setToast({ message: 'Pagina a fost ștearsă cu succes!', type: 'success' });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la ștergerea paginii', 
        type: 'error' 
      });
    }
  };

  const handleTogglePublish = async (pageId: string) => {
    try {
      await apiClient.post(`/api/admin/content/pages/${pageId}/toggle-publication`);
      fetchPages();
      setToast({ message: 'Statusul paginii a fost actualizat!', type: 'success' });
    } catch (error: any) {
      console.error('Error updating page status:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la actualizarea statusului paginii', 
        type: 'error' 
      });
    }
  };

  const handleUpdateConfig = async (key: string, value: any, type: string = 'text') => {
    try {
      await apiClient.put(`/api/admin/site-config/${key}`, {
        value,
        type,
        isPublic: true
      });
      fetchSiteConfigs();
      setToast({ message: 'Configurația a fost actualizată!', type: 'success' });
    } catch (error: any) {
      console.error('Error updating config:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la actualizarea configurației', 
        type: 'error' 
      });
    }
  };

  // Paginare
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (editingPage) {
    return (
      <LivePageEditor
        pageId={editingPage}
        onClose={() => setEditingPage(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast notifications */}
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Header cu status real-time */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestionare Conținut Live</h2>
          <p className="text-sm text-gray-600 mt-1">
            {activeTab === 'pages' && '📄 Gestionare Pagini'}
            {activeTab === 'config' && '⚙️ Configurare Site'}
            {activeTab === 'media' && '🖼️ Gestionare Media și Fișiere'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'pages'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📄 Pagini
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'config'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ⚙️ Configurare Site
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'media'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🖼️ Media
        </button>
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div>
          {/* Filtre și controale */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Căutare</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Caută după titlu sau slug..."
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="all">Toate</option>
                    <option value="published">Publicate</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⬇️ Sortare</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="date-desc">Data (Nou → Vechi)</option>
                    <option value="date-asc">Data (Vechi → Nou)</option>
                    <option value="title-asc">Titlu (A → Z)</option>
                    <option value="title-desc">Titlu (Z → A)</option>
                    <option value="slug-asc">Slug (A → Z)</option>
                    <option value="slug-desc">Slug (Z → A)</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => setShowNewPageModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                ➕ Pagină Nouă
              </button>
            </div>
            
            {/* Butoane Reset */}
            {(searchTerm || filterStatus !== 'all' || sortBy !== 'date-desc') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setSortBy('date-desc');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  🔄 Resetează Filtrele
                </button>
              </div>
            )}
          </div>

          {/* Lista pagini */}
          <div className="space-y-3">
            {paginatedPages.map(page => (
              <div key={page.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">{page.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.isPublished ? 'Publicat' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Slug:</span> /{page.slug}
                      </div>
                      <div>
                        <span className="font-medium">Ultima modificare:</span> {new Date(page.updatedAt).toLocaleDateString('ro-RO')}
                      </div>
                      <div>
                        <span className="font-medium">URL:</span> 
                        <a 
                          href={`/public/pages/${page.slug}`} 
                          target="_blank" 
                          className="text-blue-600 hover:underline ml-1"
                        >
                          Vizualizează →
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPage(page.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      ✏️ Editează Live
                    </button>
                    
                    <button
                      onClick={() => handleTogglePublish(page.id)}
                      className={`px-3 py-1 rounded transition text-sm ${
                        page.isPublished
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {page.isPublished ? '📝 Draft' : '🌐 Publică'}
                    </button>
                    
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {paginatedPages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Nu au fost găsite pagini</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Încearcă să modifici criteriile de căutare</p>
                )}
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
        </div>
      )}

      {/* Site Config Tab */}
      {activeTab === 'config' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Configurare Site</h3>
          
          <div className="space-y-6">
            {siteConfigs.filter(config => 
              config.key !== 'block_rules' && 
              config.key !== 'order_block_settings' && 
              config.key !== 'delivery_schedules'
            ).map(config => (
              <div key={config.key} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{config.key.replace(/_/g, ' ').toUpperCase()}</h4>
                    {config.description && (
                      <p className="text-sm text-gray-600">{config.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    config.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.isPublic ? 'Public' : 'Privat'}
                  </span>
                </div>
                
                {config.type === 'json' ? (
                  <div className="space-y-4">
                    {/* Debug: arată cheia */}
                    <div className="text-xs text-gray-400 mb-2">Key: {config.key}</div>
                    
                    {/* Editor vizual pentru ANNOUNCEMENT_BANNER */}
                    {config.key === 'announcement_banner' && (() => {
                      let bannerData;
                      try {
                        bannerData = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
                      } catch {
                        bannerData = { isActive: false, title: '', description: '', titleStyle: {}, descriptionStyle: {} };
                      }
                      
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={bannerData.isActive || false}
                              onChange={(e) => {
                                const updated = { ...bannerData, isActive: e.target.checked };
                                handleUpdateConfig(config.key, updated, 'json');
                              }}
                              className="rounded"
                            />
                            <span className="font-medium">Activează banner-ul</span>
                          </label>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Titlu</label>
                            <input
                              type="text"
                              value={bannerData.title || ''}
                              onChange={(e) => {
                                const updated = { ...bannerData, title: e.target.value };
                                handleUpdateConfig(config.key, updated, 'json');
                              }}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Ex: Blocare plasare comanda"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Descriere</label>
                            <textarea
                              value={bannerData.description || ''}
                              onChange={(e) => {
                                const updated = { ...bannerData, description: e.target.value };
                                handleUpdateConfig(config.key, updated, 'json');
                              }}
                              className="w-full border rounded px-3 py-2"
                              rows={3}
                              placeholder="Ex: Plasarea de comenzi este blocată"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Culoare titlu</label>
                              <input
                                type="color"
                                value={bannerData.titleStyle?.color || '#000000'}
                                onChange={(e) => {
                                  const updated = { 
                                    ...bannerData, 
                                    titleStyle: { ...bannerData.titleStyle, color: e.target.value }
                                  };
                                  handleUpdateConfig(config.key, updated, 'json');
                                }}
                                className="w-full h-10 border rounded"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Culoare fundal</label>
                              <input
                                type="color"
                                value={bannerData.titleStyle?.backgroundColor || '#ffffff'}
                                onChange={(e) => {
                                  const updated = { 
                                    ...bannerData, 
                                    titleStyle: { ...bannerData.titleStyle, backgroundColor: e.target.value }
                                  };
                                  handleUpdateConfig(config.key, updated, 'json');
                                }}
                                className="w-full h-10 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {config.key === 'business_hours' && (() => {
                      let hoursData;
                      try {
                        hoursData = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
                      } catch {
                        hoursData = {};
                      }
                      
                      const days = ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'];
                      const dayLabels: any = {
                        luni: 'Luni',
                        marti: 'Marți',
                        miercuri: 'Miercuri',
                        joi: 'Joi',
                        vineri: 'Vineri',
                        sambata: 'Sâmbătă',
                        duminica: 'Duminică'
                      };
                      
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          {days.map(day => (
                            <div key={day} className="flex items-center gap-3">
                              <span className="w-24 font-medium">{dayLabels[day]}:</span>
                              <input
                                type="text"
                                value={hoursData[day] || ''}
                                onChange={(e) => {
                                  const updated = { ...hoursData, [day]: e.target.value };
                                  handleUpdateConfig(config.key, updated, 'json');
                                }}
                                className="flex-1 border rounded px-3 py-2"
                                placeholder="Ex: 09:00 - 18:00"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    
                    {/* Editor vizual pentru BLOCK_RULES */}
                    {config.key === 'block_rules' && (() => {
                      let rulesData;
                      try {
                        rulesData = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
                        if (!Array.isArray(rulesData)) rulesData = [];
                      } catch {
                        rulesData = [];
                      }
                      
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-3">
                            Regulile de blocare se gestionează în secțiunea "🚫 Blocare Comenzi" din meniul principal.
                          </p>
                          <p className="text-xs text-gray-500">
                            Această configurație este generată automat și nu trebuie editată manual.
                          </p>
                        </div>
                      );
                    })()}
                    
                    {/* Editor vizual pentru ORDER_BLOCK_SETTINGS */}
                    {config.key === 'order_block_settings' && (() => {
                      let blockData;
                      try {
                        blockData = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
                      } catch {
                        blockData = { blockNewOrders: false, blockReason: '', allowedPaymentMethods: [], minimumOrderValue: 0 };
                      }
                      
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-3">
                            Setările de blocare comenzi se gestionează în secțiunea "🚫 Blocare Comenzi" din meniul principal.
                          </p>
                          <p className="text-xs text-gray-500">
                            Această configurație este generată automat și nu trebuie editată manual.
                          </p>
                        </div>
                      );
                    })()}
                    
                    {/* Pentru alte JSON-uri, arată textarea */}
                    {config.key !== 'announcement_banner' && config.key !== 'business_hours' && config.key !== 'block_rules' && config.key !== 'order_block_settings' && (
                      <textarea
                        value={typeof config.value === 'string' ? config.value : JSON.stringify(config.value, null, 2)}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setSiteConfigs(prev => prev.map(c => 
                            c.key === config.key ? { ...c, value: newValue } : c
                          ));
                        }}
                        onBlur={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handleUpdateConfig(config.key, parsed, 'json');
                          } catch (error) {
                            setToast({ message: 'JSON invalid! Verifică sintaxa.', type: 'error' });
                          }
                        }}
                        className="w-full border rounded px-3 py-2 font-mono text-sm whitespace-pre"
                        rows={8}
                        style={{ resize: 'vertical' }}
                      />
                    )}
                  </div>
                ) : config.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.value === true || config.value === 'true'}
                      onChange={(e) => handleUpdateConfig(config.key, e.target.checked, 'boolean')}
                    />
                    <span>Activat</span>
                  </label>
                ) : config.type === 'number' ? (
                  <input
                    type="number"
                    value={config.value}
                    onChange={(e) => handleUpdateConfig(config.key, parseFloat(e.target.value) || 0, 'number')}
                    className="w-full border rounded px-3 py-2"
                  />
                ) : (
                  <input
                    type="text"
                    value={config.value}
                    onChange={(e) => handleUpdateConfig(config.key, e.target.value, 'text')}
                    className="w-full border rounded px-3 py-2"
                  />
                )}
              </div>
            ))}
            
            {siteConfigs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nu există configurații disponibile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <MediaManager />
      )}

      {/* Modal pentru pagină nouă */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Creează Pagină Nouă</h3>
              <button
                onClick={() => setShowNewPageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug Pagină (URL)
                </label>
                <input
                  type="text"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({...newPageData, slug: e.target.value})}
                  placeholder="ex: despre-noi, contact, servicii"
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Va fi accesibilă la: /public/pages/{newPageData.slug}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titlu Pagină
                </label>
                <input
                  type="text"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({...newPageData, title: e.target.value})}
                  placeholder="ex: Despre Noi, Contact, Servicii"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Titlu (SEO)
                </label>
                <input
                  type="text"
                  value={newPageData.metaTitle}
                  onChange={(e) => setNewPageData({...newPageData, metaTitle: e.target.value})}
                  placeholder="Titlu pentru motoarele de căutare"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Descriere (SEO)
                </label>
                <textarea
                  value={newPageData.metaDescription}
                  onChange={(e) => setNewPageData({...newPageData, metaDescription: e.target.value})}
                  placeholder="Descriere pentru motoarele de căutare"
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conținut Inițial (opțional)
                </label>
                <textarea
                  value={newPageData.content}
                  onChange={(e) => setNewPageData({...newPageData, content: e.target.value})}
                  placeholder="Conținut inițial pentru pagină..."
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewPageModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                💾 Creează Pagina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}