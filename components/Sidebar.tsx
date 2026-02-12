'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from './LanguageSwitcher';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    dataItems: number;
  };
  subcategories?: Category[];
}

interface SidebarProps {
  categories: Category[];
  activeCategory?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
}

export default function Sidebar({ categories, activeCategory, onCategorySelect }: SidebarProps) {
  const { t } = useTranslation();
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleCategoryClick = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Calculate total product count including subcategories
  const getTotalProductCount = (category: Category): number => {
    let count = category._count?.dataItems || 0;
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        count += getTotalProductCount(sub);
      });
    }
    return count;
  };

  return (
    <aside className="w-64 bg-white rounded-lg shadow-md p-3">
      <nav className="space-y-1">
        <div>
          <button
            onClick={() => setIsProductsExpanded(!isProductsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm"
          >
            <span>🛍️ {t('products')}</span>
            {isProductsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {isProductsExpanded && (
            <div className="ml-3 mt-1 space-y-0.5">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors ${
                  activeCategory === null ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t('allCategories')}
              </button>

              {categories.map((category) => {
                const productCount = getTotalProductCount(category);
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-1">
                      {hasSubcategories && (
                        <button
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleCategoryClick(category.id)}
                        className={`flex-1 text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                          activeCategory === category.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                        } ${!hasSubcategories ? 'ml-5' : ''}`}
                      >
                        <span className="truncate">{category.name}</span>
                        {productCount > 0 && (
                          <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {productCount}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {/* Subcategories */}
                    {hasSubcategories && isExpanded && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {category.subcategories!.map((subcat) => {
                          const subProductCount = getTotalProductCount(subcat);
                          return (
                            <button
                              key={subcat.id}
                              onClick={() => handleCategoryClick(subcat.id)}
                              className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                                activeCategory === subcat.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              <span className="truncate">• {subcat.name}</span>
                              {subProductCount > 0 && (
                                <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  {subProductCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Link href="/offers" className="flex items-center px-2 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm">
          <span>🎉 {t('offers')}</span>
        </Link>
      </nav>
    </aside>
  );
}
