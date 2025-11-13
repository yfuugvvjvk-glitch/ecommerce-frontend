'use client';

import { useState } from 'react';
import { DataItem } from '@/types';
import TableSkeleton from './TableSkeleton';

interface DataTableProps {
  data: DataItem[];
  loading?: boolean;
  onEdit: (item: DataItem) => void;
  onDelete: (id: string) => void;
}

type SortField = 'title' | 'price' | 'stock' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function DataTable({ data, loading, onEdit, onDelete }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">⇅</span>;
    }
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) return <TableSkeleton />;

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-600 text-lg">Nu există date de afișat.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagine
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Titlu <SortIcon field="title" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-2">
                  Preț <SortIcon field="price" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('stock')}
              >
                <div className="flex items-center gap-2">
                  Stoc <SortIcon field="stock" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorie
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-12 w-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Image';
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  {item.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-blue-600">
                    {item.price.toFixed(2)} RON
                  </div>
                  {item.oldPrice && item.oldPrice > item.price && (
                    <div className="text-xs text-gray-400 line-through">
                      {item.oldPrice.toFixed(2)} RON
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      item.stock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.stock > 0 ? `${item.stock} buc` : 'Epuizat'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 capitalize">
                    {typeof item.category === 'string' ? item.category : item.category?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    aria-label={`Edit ${item.title}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                    aria-label={`Delete ${item.title}`}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {paginatedData.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex gap-4">
              <img
                src={item.image}
                alt={item.title}
                className="h-20 w-20 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold text-blue-600">
                    {item.price.toFixed(2)} RON
                  </span>
                  {item.oldPrice && item.oldPrice > item.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {item.oldPrice.toFixed(2)} RON
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded font-medium ${
                      item.stock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.stock > 0 ? `${item.stock} buc` : 'Epuizat'}
                  </span>
                  <span className="text-gray-500 capitalize">
                    {typeof item.category === 'string' ? item.category : item.category?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit(item)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium min-h-[44px]"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium min-h-[44px]"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Pagina {currentPage} din {totalPages} ({data.length} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
              aria-label="Previous page"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
              aria-label="Next page"
            >
              Următor →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
