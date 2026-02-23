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
  
  // State for site config fields
  const [siteName, setSiteName] = useState('Din ograda mea direct pe masa ta');
  const [aboutUs, setAboutUs] = useState('Bun venit la Din ograda mea direct pe masa ta! Suntem o fermă locală dedicată să aducă produse proaspete și naturale direct de la noi la tine acasă. Cu pasiune pentru agricultură și respect pentru natură, cultivăm produse de cea mai înaltă calitate, fără chimicale dăunătoare. Fiecare produs este ales cu grijă pentru a-ți oferi cea mai bună experiență. Misiunea noastră este să promovăm un stil de viață sănătos prin produse naturale, proaspete și accesibile pentru toată familia.');
  const [contactEmail, setContactEmail] = useState('crys.cristi@yahoo.com');
  const [contactPhone, setContactPhone] = useState('+40 753615752');
  const [contactWhatsapp, setContactWhatsapp] = useState('+40 753615752');
  const [contactAddress, setContactAddress] = useState('Str. Garii, nr. 69, Galați, Județul Galați');
  const [companyCui, setCompanyCui] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [companyFullName, setCompanyFullName] = useState('');

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
      
      // Populate state with existing values
      configs.forEach((config: any) => {
        switch (config.key) {
          case 'site_name':
            setSiteName(config.value || 'Din ograda mea direct pe masa ta');
            break;
          case 'about_us':
            setAboutUs(config.value || '');
            break;
          case 'contact_email':
            setContactEmail(config.value || '');
            break;
          case 'contact_phone':
            setContactPhone(config.value || '');
            break;
          case 'contact_whatsapp':
            setContactWhatsapp(config.value || '');
            break;
          case 'contact_address':
            setContactAddress(config.value || '');
            break;
          case 'company_cui':
            setCompanyCui(config.value || '');
            break;
          case 'company_reg_number':
            setCompanyRegNumber(config.value || '');
            break;
          case 'company_full_name':
            setCompanyFullName(config.value || '');
            break;
        }
      });
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
      console.log('📝 Updating config:', { key, value, type });
      const response = await apiClient.put(`/api/admin/site-config/${key}`, {
        value,
        type,
        isPublic: true
      });
      console.log('✅ Config updated successfully:', response.data);
      
      // Refresh local state
      await fetchSiteConfigs();
      
      // Emit event to notify other components - with delay to ensure backend is updated
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log('🔔 Emitting siteConfigUpdated event');
          const event = new CustomEvent('siteConfigUpdated', { 
            detail: { key, value } 
          });
          window.dispatchEvent(event);
        }
      }, 100);
      
      setToast({ message: '✅ Configurația a fost actualizată!', type: 'success' });
    } catch (error: any) {
      console.error('❌ Error updating config:', error);
      console.error('Error details:', error.response?.data);
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
            {activeTab === 'config' && '⚙️ Configurare Site - Informații care apar în întreaga aplicație'}
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

      {/* Site Config Tab - Simplified */}
      {activeTab === 'config' && (
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">⚙️ Configurare Site</h3>
            <p className="text-sm text-gray-600">
              Modificările făcute aici se vor actualiza automat în întreaga aplicație (navbar, footer, pagina de contact, etc.)
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Numele Fermei */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏡</span>
                <h4 className="text-lg font-bold text-gray-900">Numele Fermei</h4>
              </div>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                onBlur={(e) => handleUpdateConfig('site_name', e.target.value, 'text')}
                className="w-full border-2 border-green-300 rounded-lg px-4 py-3 text-base font-normal focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Numele fermei tale"
                style={{ fontSize: '16px', fontFamily: 'inherit' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                📍 Apare în: Logo, Titlul paginii, Footer, Meta tags
              </p>
            </div>

            {/* Despre Noi */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📖</span>
                <h4 className="text-lg font-bold text-gray-900">Despre Noi</h4>
              </div>
              <textarea
                value={aboutUs}
                onChange={(e) => setAboutUs(e.target.value)}
                onBlur={(e) => handleUpdateConfig('about_us', e.target.value, 'text')}
                className="w-full border-2 border-yellow-300 rounded-lg px-4 py-3 text-base font-normal focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows={6}
                placeholder="Descrierea fermei tale..."
                style={{ fontSize: '16px', fontFamily: 'inherit' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                📍 Apare în: Pagina Despre, Footer, Pagina de Contact
              </p>
            </div>

            {/* Date de Contact */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📞</span>
                <h4 className="text-lg font-bold text-gray-900">Date de Contact</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('contact_email', e.target.value, 'text')}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplu.com"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Telefon</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('contact_phone', e.target.value, 'text')}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+40 XXX XXX XXX"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">💬 WhatsApp</label>
                  <input
                    type="tel"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('contact_whatsapp', e.target.value, 'text')}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+40 XXX XXX XXX"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Adresă</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('contact_address', e.target.value, 'text')}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Strada, număr, oraș, județ"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                📍 Apare în: Footer, Pagina de Contact, Navbar
              </p>
            </div>

            {/* CUI Firmă */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏢</span>
                <h4 className="text-lg font-bold text-gray-900">Date Firmă</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CUI</label>
                  <input
                    type="text"
                    value={companyCui}
                    onChange={(e) => setCompanyCui(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('company_cui', e.target.value, 'text')}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Ex: RO12345678"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Număr Registrul Comerțului</label>
                  <input
                    type="text"
                    value={companyRegNumber}
                    onChange={(e) => setCompanyRegNumber(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('company_reg_number', e.target.value, 'text')}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Ex: J17/123/2024"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nume Complet Firmă</label>
                  <input
                    type="text"
                    value={companyFullName}
                    onChange={(e) => setCompanyFullName(e.target.value)}
                    onBlur={(e) => handleUpdateConfig('company_full_name', e.target.value, 'text')}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-base font-normal focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Ex: SC FERMA MEA SRL"
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                📍 Apare în: Footer, Pagina de Contact, Facturi
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h5 className="font-semibold text-blue-900 mb-1">Cum funcționează?</h5>
                <p className="text-sm text-blue-800">
                  Toate modificările se salvează automat când ieși din câmp (blur). 
                  Informațiile vor fi actualizate instant în întreaga aplicație: navbar, footer, 
                  pagina de contact, meta tags, și oriunde altundeva apar aceste date.
                </p>
              </div>
            </div>
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