'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from './LanguageSwitcher';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  categories: Category[];
  activeCategory?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
}

export default function Sidebar({ categories, activeCategory, onCategorySelect }: SidebarProps) {
  const { t } = useTranslation();
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);

  const handleCategoryClick = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  return (
    <aside className="w-64 bg-white rounded-lg shadow-md p-4">
      <nav className="space-y-2">
        <div>
          <button
            onClick={() => setIsProductsExpanded(!isProductsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            <span>🛍️ {t('products')}</span>
            {isProductsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {isProductsExpanded && (
            <div className="ml-4 mt-2 space-y-1">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeCategory === null ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t('allCategories')}
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeCategory === category.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link href="/offers" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
          <span>🎉 {t('offers')}</span>
        </Link>
      </nav>
    </aside>
  );
}
