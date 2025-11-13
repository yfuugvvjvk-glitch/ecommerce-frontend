'use client';

import { ArrowUpDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory?: string | null;
  sortBy: 'price' | 'name' | 'rating';
  sortOrder: 'asc' | 'desc';
  onCategoryChange: (categoryId: string | null) => void;
  onSortChange: (sortBy: string, order: string) => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  sortBy,
  sortOrder,
  onCategoryChange,
  onSortChange,
}: ProductFiltersProps) {
  const handleSortByChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(newSortBy, 'asc');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Categorie:</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toate Categoriile</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Sortează:</span>
          
          <button
            onClick={() => handleSortByChange('price')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              sortBy === 'price'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Preț
            {sortBy === 'price' && (
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>

          <button
            onClick={() => handleSortByChange('name')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alfabetic
            {sortBy === 'name' && (
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>

          <button
            onClick={() => handleSortByChange('rating')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              sortBy === 'rating'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rating
            {sortBy === 'rating' && (
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
