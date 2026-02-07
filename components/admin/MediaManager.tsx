'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

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

  useEffect(() => {
    fetchFiles();
  }, []);

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
          <span className="font-semibold text-blue-700">🖼️ Gestionare Media</span>
        </div>
      </div>

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
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map(file => (
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
              </div>
            </div>
          ))}
        </div>
      ) : (
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
              {filteredFiles.map(file => (
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
      )}

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">📭</p>
          <p>Nu există fișiere</p>
          <p className="text-sm">Încarcă primul fișier pentru a începe</p>
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
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
                  {selectedFile.mimeType.startsWith('image/') ? (
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
      )}
    </div>
  );
}
