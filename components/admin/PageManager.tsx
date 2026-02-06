'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  template: string;
  sections?: PageSection[];
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

interface PageSection {
  id: string;
  type: string;
  title?: string;
  content?: string;
  settings?: any;
  position: number;
  isVisible: boolean;
}

interface PageManagerProps {
  pageId: string;
  onClose: () => void;
}

export default function PageManager({ pageId, onClose }: PageManagerProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'sections' | 'settings'>('content');

  // Real-time updates
  const { isConnected } = useWebSocket({
    onContentUpdate: (data) => {
      if (data.pageId === pageId) {
        console.log('Page update received:', data);
        fetchPage();
      }
    }
  });

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/content/pages/${pageId}`);
      setPage(response.data);
    } catch (error: any) {
      console.error('Error fetching page:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la încărcarea paginii', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async () => {
    if (!page) return;

    try {
      setSaving(true);
      await apiClient.put(`/api/admin/content/pages/${pageId}`, {
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        template: page.template
      });
      
      setToast({ message: 'Pagina a fost salvată!', type: 'success' });
      fetchPage(); // Refresh to get updated data
    } catch (error: any) {
      console.error('Error saving page:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la salvarea paginii', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!page) return;

    try {
      await apiClient.post(`/api/admin/content/pages/${pageId}/toggle-publication`);
      setToast({ 
        message: `Pagina a fost ${page.isPublished ? 'depublicată' : 'publicată'}!`, 
        type: 'success' 
      });
      fetchPage();
    } catch (error: any) {
      console.error('Error toggling publication:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la actualizarea statusului', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Se încarcă pagina...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Pagina nu a fost găsită</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Toast notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 p-3 rounded shadow-lg z-60 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Înapoi
              </button>
              <div>
                <h1 className="text-xl font-semibold">{page.title}</h1>
                <p className="text-sm text-gray-600">/{page.slug}</p>
              </div>
              <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                page.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {page.isPublished ? 'Publicat' : 'Draft'}
              </span>
              
              <button
                onClick={handleTogglePublish}
                className={`px-3 py-1 rounded text-sm transition ${
                  page.isPublished
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {page.isPublished ? '📝 Draft' : '🌐 Publică'}
              </button>

              <button
                onClick={handleSavePage}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? '💾 Se salvează...' : '💾 Salvează'}
              </button>

              <a
                href={`/api/public/pages/${page.slug}`}
                target="_blank"
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition"
              >
                👁️ Preview
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 mt-4 border-b">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'content'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Conținut
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'sections'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🧩 Secțiuni
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Setări
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titlu Pagină
              </label>
              <input
                type="text"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conținut Pagină
              </label>
              <textarea
                value={page.content}
                onChange={(e) => setPage({ ...page, content: e.target.value })}
                className="w-full border rounded px-3 py-2 font-mono"
                rows={20}
                placeholder="Introdu conținutul paginii aici..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Poți folosi HTML pentru formatare avansată
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div>
            <p className="text-gray-600 mb-4">
              Secțiunile modulare vor fi implementate în curând...
            </p>
            {page.sections && page.sections.length > 0 && (
              <div className="space-y-4">
                {page.sections.map(section => (
                  <div key={section.id} className="border rounded p-4">
                    <h4 className="font-medium">{section.title || `Secțiunea ${section.type}`}</h4>
                    <p className="text-sm text-gray-600">Tip: {section.type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Titlu (SEO)
              </label>
              <input
                type="text"
                value={page.metaTitle || ''}
                onChange={(e) => setPage({ ...page, metaTitle: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Titlu pentru motoarele de căutare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Descriere (SEO)
              </label>
              <textarea
                value={page.metaDescription || ''}
                onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Descriere pentru motoarele de căutare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={page.template}
                onChange={(e) => setPage({ ...page, template: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="default">Default</option>
                <option value="home">Home</option>
                <option value="contact">Contact</option>
                <option value="about">About</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Informații</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Creat:</strong> {new Date(page.createdAt).toLocaleString('ro-RO')}</p>
                <p><strong>Actualizat:</strong> {new Date(page.updatedAt).toLocaleString('ro-RO')}</p>
                {page.createdBy && (
                  <p><strong>Creat de:</strong> {page.createdBy.name} ({page.createdBy.email})</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}