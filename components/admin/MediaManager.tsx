'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePagination } from '@/lib/usePagination';
import Pagination from '@/components/Pagination';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedBy: string;
  createdAt: string;
  // Metadata editabile
  title?: string;
  description?: string;
  altText?: string;
  category?: string;
  tags?: string[];
  usedOnPages?: string[];
  usageCount?: number;
  displaySize?: 'thumbnail' | 'medium' | 'large' | 'full';
  position?: string;
}

export default function MediaManager() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<Partial<MediaFile>>({});
  const [detectingUsage, setDetectingUsage] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newPage, setNewPage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Carousel state
  const [activeTab, setActiveTab] = useState<'media' | 'carousel'>('media');
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselStats, setCarouselStats] = useState<any>(null);
  const [editingCarouselItem, setEditingCarouselItem] = useState<any>(null);
  const [showCarouselEditor, setShowCarouselEditor] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [carouselFilterType, setCarouselFilterType] = useState<'all' | 'product' | 'media' | 'custom'>('all');

  useEffect(() => {
    fetchFiles();
    if (activeTab === 'carousel') {
      fetchCarouselItems();
      fetchCarouselStats();
    }
  }, [activeTab]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/media');
      setFiles(response.data || []);
    } catch (error) {
      console.error('Error fetching media files:', error);
      // Nu mai folosim date demo - afișăm lista goală
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarouselItems = async () => {
    try {
      setCarouselLoading(true);
      const response = await apiClient.get('/api/carousel?includeInactive=true');
      setCarouselItems(response.data || []);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      setCarouselItems([]);
    } finally {
      setCarouselLoading(false);
    }
  };

  const fetchCarouselStats = async () => {
    try {
      const response = await apiClient.get('/api/carousel/stats/overview');
      setCarouselStats(response.data);
    } catch (error) {
      console.error('Error fetching carousel stats:', error);
    }
  };

  const handleToggleCarouselItem = async (itemId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/api/carousel/${itemId}`, { isActive: !isActive });
      fetchCarouselItems();
      fetchCarouselStats();
      alert(isActive ? 'Item dezactivat din carousel' : 'Item activat în carousel');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la actualizare');
    }
  };

  const handleDeleteCarouselItem = async (itemId: string) => {
    if (!confirm('Sigur vrei să ștergi acest item din carousel?')) return;
    
    try {
      await apiClient.delete(`/api/carousel/${itemId}`);
      fetchCarouselItems();
      fetchCarouselStats();
      alert('Item șters din carousel');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la ștergere');
    }
  };

  const handleMoveCarouselItem = async (itemId: string, newPosition: number) => {
    try {
      await apiClient.post(`/api/carousel/${itemId}/move`, { position: newPosition });
      fetchCarouselItems();
      alert(`Item mutat la poziția ${newPosition}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la mutare');
    }
  };

  const handleEditCarouselItem = (item: any) => {
    // Create a deep copy to ensure independent editing
    const defaultTitleStyle = {
      color: '#ffffff',
      fontSize: '24px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    const defaultDescriptionStyle = {
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    const defaultLinkStyle = {
      color: '#3b82f6',
      fontSize: '14px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    // Check if textStyle is the new format (with separate title/description/link) or old format (single style)
    let textStyle = item.textStyle;
    if (textStyle && !textStyle.title && !textStyle.description && !textStyle.link) {
      // Old format - convert to new format
      textStyle = {
        title: { ...defaultTitleStyle, ...textStyle },
        description: { ...defaultDescriptionStyle, ...textStyle, fontSize: `${parseInt(textStyle.fontSize || '24') * 0.6}px` },
        link: { ...defaultLinkStyle },
        overlayBackground: textStyle.backgroundColor || 'rgba(0,0,0,0.5)'
      };
    } else if (!textStyle) {
      // No style - use defaults
      textStyle = {
        title: defaultTitleStyle,
        description: defaultDescriptionStyle,
        link: defaultLinkStyle,
        overlayBackground: 'rgba(0,0,0,0.5)'
      };
    }

    setEditingCarouselItem({
      ...JSON.parse(JSON.stringify(item)), // Deep copy
      textStyle: JSON.parse(JSON.stringify(textStyle)) // Deep copy of textStyle
    });
    setShowCarouselEditor(true);
  };

  const handleSaveCarouselItem = async () => {
    if (!editingCarouselItem) return;

    try {
      await apiClient.put(`/api/carousel/${editingCarouselItem.id}`, {
        customTitle: editingCarouselItem.customTitle,
        customDescription: editingCarouselItem.customDescription,
        linkUrl: editingCarouselItem.linkUrl,
        textStyle: editingCarouselItem.textStyle
      });
      
      fetchCarouselItems();
      setShowCarouselEditor(false);
      setEditingCarouselItem(null);
      alert('Item actualizat cu succes!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la actualizare');
    }
  };

  const handleAddMediaToCarousel = async (mediaFile: MediaFile) => {
    try {
      await apiClient.post('/api/carousel', {
        type: 'media',
        // Nu specificăm poziția - se va alege automat
        mediaId: mediaFile.id,
        title: mediaFile.title || mediaFile.originalName,
        description: mediaFile.description || '',
        linkUrl: '',
        textStyle: {
          title: {
            color: '#ffffff',
            fontSize: '24px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1.5',
            letterSpacing: '0px'
          },
          description: {
            color: '#ffffff',
            fontSize: '16px',
            fontFamily: 'Arial',
            fontWeight: 'normal',
            textAlign: 'center',
            lineHeight: '1.5',
            letterSpacing: '0px'
          },
          link: {
            color: '#3b82f6',
            fontSize: '14px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1.5',
            letterSpacing: '0px'
          },
          overlayBackground: 'rgba(0,0,0,0.5)'
        }
      });
      
      fetchCarouselItems();
      fetchCarouselStats();
      alert('Media adăugată în carousel pe următoarea poziție disponibilă');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la adăugare');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = event.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(uploadFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      await apiClient.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      fetchFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      alert('Fișierele au fost încărcate cu succes!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Sigur vrei să ștergi acest fișier?')) return;

    try {
      await apiClient.delete(`/api/media/${fileId}`);
      fetchFiles();
      setSelectedFile(null);
      alert('Fișierul a fost șters cu succes!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Eroare la ștergerea fișierului');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Sigur vrei să ștergi ${selectedFiles.size} fișiere?`)) return;

    try {
      await apiClient.post('/api/media/bulk-delete', {
        fileIds: Array.from(selectedFiles),
      });
      
      setSelectedFiles(new Set());
      fetchFiles();
      alert('Fișierele au fost șterse cu succes!');
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Eroare la ștergerea fișierelor');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiat în clipboard!');
  };

  const handleEditFile = (file: MediaFile) => {
    setSelectedFile(file);
    setEditMode(true);
    setEditedMetadata({
      title: file.title || '',
      description: file.description || '',
      altText: file.altText || '',
      category: file.category || '',
      tags: file.tags || [],
      displaySize: file.displaySize || 'medium',
      position: file.position || '',
      usedOnPages: file.usedOnPages || [],
    });
  };

  const detectFileUsage = async (fileId: string) => {
    setDetectingUsage(true);
    try {
      const response = await apiClient.get(`/api/media/${fileId}/usage`);
      
      // Update file with usage info
      setFiles(files.map(f => 
        f.id === fileId 
          ? { ...f, usedOnPages: response.data.usedOnPages, usageCount: response.data.usageCount }
          : f
      ));
      
      if (selectedFile?.id === fileId) {
        setSelectedFile({
          ...selectedFile,
          usedOnPages: response.data.usedOnPages,
          usageCount: response.data.usageCount
        });
        setEditedMetadata(prev => ({
          ...prev,
          usedOnPages: response.data.usedOnPages
        }));
      }
      
      alert(`Detectat: ${response.data.usageCount} utilizări`);
    } catch (error) {
      console.error('Error detecting usage:', error);
      alert('Eroare la detectarea utilizării');
    } finally {
      setDetectingUsage(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedFile) return;

    try {
      await apiClient.patch(`/api/media/${selectedFile.id}`, editedMetadata);
      
      // Update local state
      setFiles(files.map(f => 
        f.id === selectedFile.id 
          ? { ...f, ...editedMetadata }
          : f
      ));
      
      setEditMode(false);
      setSelectedFile({ ...selectedFile, ...editedMetadata });
      alert('Metadata actualizată cu succes!');
    } catch (error) {
      console.error('Error updating metadata:', error);
      alert('Eroare la actualizarea metadata');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedMetadata({});
  };

  const updateMetadataField = (field: keyof MediaFile, value: any) => {
    setEditedMetadata(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const currentTags = editedMetadata.tags || [];
    if (!currentTags.includes(tag.trim())) {
      updateMetadataField('tags', [...currentTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = editedMetadata.tags || [];
    updateMetadataField('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addPage = (page: string) => {
    if (!page.trim()) return;
    const currentPages = editedMetadata.usedOnPages || [];
    if (!currentPages.includes(page.trim())) {
      updateMetadataField('usedOnPages', [...currentPages, page.trim()]);
    }
    setNewPage('');
  };

  const removePage = (pageToRemove: string) => {
    const currentPages = editedMetadata.usedOnPages || [];
    updateMetadataField('usedOnPages', currentPages.filter(page => page !== pageToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    // Filter by type
    if (filterType === 'images' && !file.mimeType.startsWith('image/')) return false;
    if (filterType === 'documents' && file.mimeType.startsWith('image/')) return false;
    
    // Filter by search
    if (searchQuery && !file.originalName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Pagination hook - MUST be at component top level (after filteredFiles calculation)
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems } = usePagination({ 
    items: filteredFiles, 
    itemsPerPage: 10 
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center text-sm">
          <span className="text-gray-600">Admin Panel</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="text-gray-600">Editare Conținut</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="font-semibold text-blue-700">🖼️ Gestionare Media & Carousel</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('media')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'media'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🖼️ Fișiere Media
        </button>
        <button
          onClick={() => setActiveTab('carousel')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'carousel'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🎠 Gestionare Carousel
        </button>
      </div>

      {/* Media Tab Content */}
      {activeTab === 'media' && (
        <div className="space-y-6">{renderMediaContent()}</div>
      )}

      {/* Carousel Tab Content */}
      {activeTab === 'carousel' && (
        <div className="space-y-6">{renderCarouselContent()}</div>
      )}

      {/* File Details Modal */}
      {selectedFile && renderFileDetailsModal()}

      {/* Carousel Editor Modal */}
      {showCarouselEditor && editingCarouselItem && renderCarouselEditorModal()}
    </div>
  );

  function renderMediaContent() {
    return (
      <>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Media</h2>
          <p className="text-gray-600">Gestionează imagini și fișiere pentru site</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? '📤 Se încarcă...' : '📤 Încarcă Fișiere'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {/* View Mode */}
            <div className="flex border rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                📋 Listă
              </button>
            </div>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border rounded px-3 py-1"
            >
              <option value="all">Toate fișierele</option>
              <option value="images">Doar imagini</option>
              <option value="documents">Doar documente</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută fișiere..."
              className="w-full border rounded px-3 py-1"
            />
          </div>

          {/* Bulk Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">
                {selectedFiles.size} selectate
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                🗑️ Șterge
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Anulează
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{files.length}</div>
          <div className="text-sm text-gray-600">Total fișiere</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {files.filter(f => f.mimeType.startsWith('image/')).length}
          </div>
          <div className="text-sm text-gray-600">Imagini</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
          </div>
          <div className="text-sm text-gray-600">Spațiu folosit</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {filteredFiles.length}
          </div>
          <div className="text-sm text-gray-600">Afișate</div>
        </div>
      </div>

      {/* Files Grid/List */}
      {renderFilesView()}

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">📭</p>
          <p>Nu există fișiere</p>
          <p className="text-sm">Încarcă primul fișier pentru a începe</p>
        </div>
      )}
      </>
    );
  }

  function renderFilesView() {
    if (viewMode === 'grid') {
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedItems.map(file => (
            <div
              key={file.id}
              className={`bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition ${
                selectedFiles.has(file.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedFile(file)}
            >
              <div className="relative h-48 bg-gray-100">
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${file.url}`}
                    alt={file.altText || file.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EEroare%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">
                    📄
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.id);
                    }}
                    className="w-5 h-5 rounded"
                  />
                </div>
                {/* Badge pentru dimensiuni */}
                {file.width && file.height && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {file.width}×{file.height}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate mb-1" title={file.title || file.originalName}>
                  {file.title || file.originalName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formatFileSize(file.size)}
                </div>
                
                {/* Informații despre utilizare */}
                {file.usedOnPages && file.usedOnPages.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      📍 Folosit pe {file.usedOnPages.length} {file.usedOnPages.length === 1 ? 'pagină' : 'pagini'}
                    </div>
                    <div className="text-xs text-gray-600 max-h-16 overflow-y-auto">
                      {file.usedOnPages.slice(0, 3).map((page, idx) => (
                        <div key={idx} className="truncate">• {page}</div>
                      ))}
                      {file.usedOnPages.length > 3 && (
                        <div className="text-blue-600">+{file.usedOnPages.length - 3} mai multe</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                    ⚠️ Nefolosit
                  </div>
                )}
                
                {/* Mărime afișare */}
                {file.displaySize && (
                  <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded mt-1">
                    📐 {file.displaySize}
                  </div>
                )}
                
                {/* Categorie */}
                {file.category && (
                  <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded mt-1">
                    🏷️ {file.category}
                  </div>
                )}
                
                {/* Buton editare rapidă */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFile(file);
                  }}
                  className="w-full mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
                >
                  ✏️ Editează
                </button>

                {/* Buton adaugă în carousel */}
                {file.mimeType.startsWith('image/') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMediaToCarousel(file);
                    }}
                    className="w-full mt-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
                  >
                    🎠 Adaugă în Carousel
                  </button>
                )}
              </div>
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
        </>
      );
    } else {
      return (
        <>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left">Preview</th>
                  <th className="p-3 text-left">Nume</th>
                  <th className="p-3 text-left">Tip</th>
                  <th className="p-3 text-left">Mărime</th>
                  <th className="p-3 text-left">Dimensiuni</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(file => (
                <tr key={file.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {file.mimeType.startsWith('image/') ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${file.url}`}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">
                          📄
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{file.originalName}</div>
                    <div className="text-xs text-gray-500">{file.filename}</div>
                  </td>
                  <td className="p-3 text-sm">{file.mimeType}</td>
                  <td className="p-3 text-sm">{formatFileSize(file.size)}</td>
                  <td className="p-3 text-sm">
                    {file.width && file.height ? `${file.width}x${file.height}` : '-'}
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(file.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Detalii"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Șterge"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={10}
            totalItems={totalItems}
          />
        </>
      );
    }
  }

  function renderCarouselContent() {
    if (carouselLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <>
        {/* Carousel Stats */}
        {carouselStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{carouselStats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{carouselStats.activeItems}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{carouselStats.inactiveItems}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{carouselStats.occupiedPositions}</div>
              <div className="text-sm text-gray-600">Poziții Ocupate</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Tip:</label>
              <select
                value={carouselFilterType}
                onChange={(e) => setCarouselFilterType(e.target.value as any)}
                className="border rounded px-3 py-1"
              >
                <option value="all">Toate</option>
                <option value="product">Produse</option>
                <option value="media">Media</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border rounded px-3 py-1"
              >
                <option value="all">Toate</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută în carousel..."
                className="w-full border rounded px-3 py-1"
              />
            </div>
          </div>
        </div>

        {/* Carousel Items */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">🎠 Items în Carousel</h3>
          
          {carouselItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">🎠</p>
              <p>Nu există items în carousel</p>
              <p className="text-sm">Adaugă media în carousel din tab-ul "Fișiere Media"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {carouselItems
                .filter(item => {
                  // Filter by type
                  if (carouselFilterType !== 'all' && item.type !== carouselFilterType) return false;
                  
                  // Filter by status
                  if (filterStatus === 'active' && !item.isActive) return false;
                  if (filterStatus === 'inactive' && item.isActive) return false;
                  
                  // Filter by search query
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const title = item.customTitle || 
                      (item.type === 'product' && item.product?.title) ||
                      (item.type === 'media' && item.media?.title) ||
                      item.title || '';
                    const description = item.customDescription ||
                      (item.type === 'product' && item.product?.description) ||
                      (item.type === 'media' && item.media?.description) ||
                      item.description || '';
                    
                    if (!title.toLowerCase().includes(query) && !description.toLowerCase().includes(query)) {
                      return false;
                    }
                  }
                  
                  return true;
                })
                .sort((a, b) => a.position - b.position)
                .map((item) => {
                  // Get display title (without filename)
                  const displayTitle = item.customTitle || 
                    (item.type === 'product' && item.product?.title) ||
                    (item.type === 'media' && item.media?.title) ||
                    item.title || 'Fără titlu';
                  
                  return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      item.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {item.position}
                        </div>
                      </div>

                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        {item.type === 'product' && item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={displayTitle}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : item.type === 'media' && item.media?.url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.media.url}`}
                            alt={displayTitle}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={displayTitle}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                            📷
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {item.type === 'product' ? '🛍️ Produs' : item.type === 'media' ? '🖼️ Media' : '✨ Custom'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.isActive ? '✅ Activ' : '❌ Inactiv'}
                          </span>
                        </div>
                        <h4 className="font-semibold">
                        </h4>
                        {(item.customDescription || item.description) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.customDescription || item.description}
                          </p>
                        )}
                        {item.type === 'product' && item.product && (
                          <div className="text-sm text-gray-600 mt-1">
                            Preț: {item.product.price} RON
                            {item.product.oldPrice && (
                              <span className="ml-2 line-through text-gray-400">{item.product.oldPrice} RON</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditCarouselItem(item)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                        >
                          ✏️ Editează
                        </button>

                        <select
                          value={item.position}
                          onChange={(e) => handleMoveCarouselItem(item.id, parseInt(e.target.value))}
                          className="px-3 py-1 border rounded text-sm"
                          title="Mută la poziția"
                        >
                          {Array.from({ length: Math.max(carouselItems.length + 5, 20) }, (_, i) => i + 1).map((pos) => (
                            <option key={pos} value={pos}>
                              Poziția {pos}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleToggleCarouselItem(item.id, item.isActive)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            item.isActive
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {item.isActive ? '⏸️ Dezactivează' : '▶️ Activează'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCarouselItem(item.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                        >
                          🗑️ Șterge
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Cum funcționează Carousel-ul?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Carousel-ul poate afișa un număr <strong>nelimitat</strong> de items</li>
            <li>• Când adaugi media/produse, acestea sunt plasate automat pe următoarea poziție disponibilă</li>
            <li>• Poți edita textul individual pentru fiecare item din carousel</li>
            <li>• Textul apare centrat în partea de jos a imaginii</li>
            <li>• Folosește butoanele de mai sus pentru a activa/dezactiva sau șterge items</li>
            <li>• Schimbă ordinea items-urilor selectând o nouă poziție din dropdown</li>
            <li>• Doar items-urile active vor fi afișate pe site-ul public</li>
          </ul>
        </div>
      </>
    );
  }

  function renderFileDetailsModal() {
    if (!selectedFile) return null;
    
    return (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Detalii Fișier</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                  {selectedFile && selectedFile.mimeType.startsWith('image/') ? (
                    <div className="relative w-full h-96 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedFile.url}`}
                        alt={selectedFile.originalName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EEroare la încărcare%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-100 rounded text-6xl">
                      📄
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nume Original</label>
                    <div className="text-lg">{selectedFile.originalName}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Nume Fișier</label>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {selectedFile.filename}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedFile.url}
                        readOnly
                        className="flex-1 text-sm font-mono bg-gray-100 p-2 rounded"
                      />
                      <button
                        onClick={() => copyToClipboard(selectedFile.url)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tip</label>
                      <div>{selectedFile.mimeType}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mărime</label>
                      <div>{formatFileSize(selectedFile.size)}</div>
                    </div>
                  </div>

                  {selectedFile.width && selectedFile.height && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Lățime</label>
                        <div>{selectedFile.width}px</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Înălțime</label>
                        <div>{selectedFile.height}px</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Încărcat de</label>
                    <div>{selectedFile.uploadedBy}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Data încărcării</label>
                    <div>{new Date(selectedFile.createdAt).toLocaleString('ro-RO')}</div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <a
                      href={selectedFile.url}
                      download
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
                    >
                      ⬇️ Descarcă
                    </a>
                    <button
                      onClick={() => handleDelete(selectedFile.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  function renderCarouselEditorModal() {
    if (!editingCarouselItem) return null;

    const displayTitle = editingCarouselItem.customTitle || 
      (editingCarouselItem.type === 'product' && editingCarouselItem.product?.title) ||
      (editingCarouselItem.type === 'media' && (editingCarouselItem.media?.title || editingCarouselItem.media?.originalName)) ||
      editingCarouselItem.title || '';

    const displayDescription = editingCarouselItem.customDescription ||
      (editingCarouselItem.type === 'product' && editingCarouselItem.product?.description) ||
      (editingCarouselItem.type === 'media' && editingCarouselItem.media?.description) ||
      editingCarouselItem.description || '';

    // Get styles with fallbacks
    const titleStyle = editingCarouselItem.textStyle?.title || {
      color: '#ffffff',
      fontSize: '24px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    const descriptionStyle = editingCarouselItem.textStyle?.description || {
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    const linkStyle = editingCarouselItem.textStyle?.link || {
      color: '#3b82f6',
      fontSize: '14px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };

    const overlayBackground = editingCarouselItem.textStyle?.overlayBackground || 'rgba(0,0,0,0.5)';

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowCarouselEditor(false)}
      >
        <div
          className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold">✏️ Editare Item Carousel</h3>
              <button
                onClick={() => setShowCarouselEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Preview */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">👁️ Preview</h4>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  {/* Image */}
                  {editingCarouselItem.type === 'product' && editingCarouselItem.product?.image ? (
                    <img
                      src={editingCarouselItem.product.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : editingCarouselItem.type === 'media' && editingCarouselItem.media?.url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${editingCarouselItem.media.url}`}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : editingCarouselItem.imageUrl ? (
                    <img
                      src={editingCarouselItem.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      📷
                    </div>
                  )}

                  {/* Text Overlay - Centrat Jos */}
                  {(displayTitle || displayDescription || editingCarouselItem.linkUrl) && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end p-6"
                      style={{
                        backgroundColor: overlayBackground
                      }}
                    >
                      {displayTitle && (
                        <h3
                          style={{
                            ...titleStyle,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            marginBottom: displayDescription || editingCarouselItem.linkUrl ? '12px' : '0',
                            maxWidth: '100%'
                          }}
                        >
                          {displayTitle}
                        </h3>
                      )}
                      {displayDescription && (
                        <p
                          style={{
                            ...descriptionStyle,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            marginBottom: editingCarouselItem.linkUrl ? '12px' : '0',
                            maxWidth: '100%'
                          }}
                        >
                          {displayDescription}
                        </p>
                      )}
                      {editingCarouselItem.linkUrl && (
                        <a
                          href={editingCarouselItem.linkUrl}
                          style={{
                            ...linkStyle,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          🔗 Vizitează Link
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Editor */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">⚙️ Setări</h4>

                {/* Custom Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titlu {editingCarouselItem.type === 'product' && '(override pentru carousel)'}
                  </label>
                  <textarea
                    value={editingCarouselItem.customTitle || ''}
                    onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, customTitle: e.target.value })}
                    placeholder={editingCarouselItem.type === 'product' ? editingCarouselItem.product?.title : 'Introdu titlul...'}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">Spațierea și liniile noi sunt păstrate</p>
                </div>

                {/* Custom Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descriere {editingCarouselItem.type === 'product' && '(override pentru carousel)'}
                  </label>
                  <textarea
                    value={editingCarouselItem.customDescription || ''}
                    onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, customDescription: e.target.value })}
                    placeholder={editingCarouselItem.type === 'product' ? editingCarouselItem.product?.description : 'Introdu descrierea...'}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Spațierea și liniile noi sunt păstrate</p>
                </div>

                {/* Link URL (for media items) */}
                {editingCarouselItem.type === 'media' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link (opțional)
                    </label>
                    <input
                      type="url"
                      value={editingCarouselItem.linkUrl || ''}
                      onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, linkUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}

                {/* Text Styling */}
                <div className="border-t pt-4">
                  <h5 className="font-semibold mb-3">🎨 Stilizare Text</h5>

                  {/* Overlay Background */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fundal Overlay</label>
                    <input
                      type="text"
                      value={overlayBackground}
                      onChange={(e) => setEditingCarouselItem({
                        ...editingCarouselItem,
                        textStyle: { ...editingCarouselItem.textStyle, overlayBackground: e.target.value }
                      })}
                      placeholder="rgba(0,0,0,0.5) sau transparent"
                      className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Folosește 'transparent' pentru fundal transparent</p>
                  </div>

                  {/* Title Styling */}
                  <div className="border rounded-lg p-4 mb-4 bg-blue-50">
                    <h6 className="font-semibold mb-3 text-blue-900">📝 Stilizare Titlu</h6>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Culoare</label>
                        <input
                          type="color"
                          value={titleStyle.color}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, color: e.target.value }
                            }
                          })}
                          className="w-full h-10 border rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mărime Font</label>
                        <input
                          type="text"
                          value={titleStyle.fontSize}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, fontSize: e.target.value }
                            }
                          })}
                          placeholder="24px"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                        <select
                          value={titleStyle.fontFamily}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, fontFamily: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grosime</label>
                        <select
                          value={titleStyle.fontWeight}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, fontWeight: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Lighter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aliniere</label>
                        <select
                          value={titleStyle.textAlign}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, textAlign: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="left">Stânga</option>
                          <option value="center">Centru</option>
                          <option value="right">Dreapta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Înălțime Linie</label>
                        <input
                          type="text"
                          value={titleStyle.lineHeight}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, lineHeight: e.target.value }
                            }
                          })}
                          placeholder="1.5"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spațiere Litere</label>
                        <input
                          type="text"
                          value={titleStyle.letterSpacing}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              title: { ...titleStyle, letterSpacing: e.target.value }
                            }
                          })}
                          placeholder="0px"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description Styling */}
                  <div className="border rounded-lg p-4 mb-4 bg-green-50">
                    <h6 className="font-semibold mb-3 text-green-900">📄 Stilizare Descriere</h6>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Culoare</label>
                        <input
                          type="color"
                          value={descriptionStyle.color}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, color: e.target.value }
                            }
                          })}
                          className="w-full h-10 border rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mărime Font</label>
                        <input
                          type="text"
                          value={descriptionStyle.fontSize}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, fontSize: e.target.value }
                            }
                          })}
                          placeholder="16px"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                        <select
                          value={descriptionStyle.fontFamily}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, fontFamily: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grosime</label>
                        <select
                          value={descriptionStyle.fontWeight}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, fontWeight: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Lighter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aliniere</label>
                        <select
                          value={descriptionStyle.textAlign}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, textAlign: e.target.value }
                            }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="left">Stânga</option>
                          <option value="center">Centru</option>
                          <option value="right">Dreapta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Înălțime Linie</label>
                        <input
                          type="text"
                          value={descriptionStyle.lineHeight}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, lineHeight: e.target.value }
                            }
                          })}
                          placeholder="1.5"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spațiere Litere</label>
                        <input
                          type="text"
                          value={descriptionStyle.letterSpacing}
                          onChange={(e) => setEditingCarouselItem({
                            ...editingCarouselItem,
                            textStyle: { 
                              ...editingCarouselItem.textStyle, 
                              description: { ...descriptionStyle, letterSpacing: e.target.value }
                            }
                          })}
                          placeholder="0px"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Link Styling (only for media items with linkUrl) */}
                  {editingCarouselItem.type === 'media' && editingCarouselItem.linkUrl && (
                    <div className="border rounded-lg p-4 mb-4 bg-purple-50">
                      <h6 className="font-semibold mb-3 text-purple-900">🔗 Stilizare Link</h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Culoare</label>
                          <input
                            type="color"
                            value={linkStyle.color}
                            onChange={(e) => setEditingCarouselItem({
                              ...editingCarouselItem,
                              textStyle: { 
                                ...editingCarouselItem.textStyle, 
                                link: { ...linkStyle, color: e.target.value }
                              }
                            })}
                            className="w-full h-10 border rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mărime Font</label>
                          <input
                            type="text"
                            value={linkStyle.fontSize}
                            onChange={(e) => setEditingCarouselItem({
                              ...editingCarouselItem,
                              textStyle: { 
                                ...editingCarouselItem.textStyle, 
                                link: { ...linkStyle, fontSize: e.target.value }
                              }
                            })}
                            placeholder="14px"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                          <select
                            value={linkStyle.fontFamily}
                            onChange={(e) => setEditingCarouselItem({
                              ...editingCarouselItem,
                              textStyle: { 
                                ...editingCarouselItem.textStyle, 
                                link: { ...linkStyle, fontFamily: e.target.value }
                              }
                            })}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Grosime</label>
                          <select
                            value={linkStyle.fontWeight}
                            onChange={(e) => setEditingCarouselItem({
                              ...editingCarouselItem,
                              textStyle: { 
                                ...editingCarouselItem.textStyle, 
                                link: { ...linkStyle, fontWeight: e.target.value }
                              }
                            })}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="lighter">Lighter</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={handleSaveCarouselItem}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    💾 Salvează
                  </button>
                  <button
                    onClick={() => {
                      setShowCarouselEditor(false);
                      setEditingCarouselItem(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                  >
                    ✕ Anulează
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
