'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { stripHtml } from '@/utils/stripHtml';

interface GiftCondition {
  id?: string;
  type: 'MIN_AMOUNT' | 'SPECIFIC_PRODUCT' | 'PRODUCT_CATEGORY' | 'PRODUCT_QUANTITY';
  minAmount?: number;
  productId?: string;
  minQuantity?: number;
  categoryId?: string;
  minCategoryAmount?: number;
}

interface GiftRuleFormData {
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditionLogic: 'AND' | 'OR';
  conditions: GiftCondition[];
  giftProductIds: string[];
  maxUsesPerCustomer: number | null;
  maxTotalUses: number | null;
  validFrom: string;
  validUntil: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
}

interface GiftRuleFormProps {
  initialData?: Partial<GiftRuleFormData>;
  ruleId?: string;
  onSubmit: (data: GiftRuleFormData) => Promise<void>;
  onCancel: () => void;
}

export default function GiftRuleForm({ initialData, ruleId, onSubmit, onCancel }: GiftRuleFormProps) {
  const [formData, setFormData] = useState<GiftRuleFormData>({
    name: '',
    description: '',
    priority: 50,
    isActive: true,
    conditionLogic: 'AND',
    conditions: [],
    giftProductIds: [],
    maxUsesPerCustomer: null,
    maxTotalUses: null,
    validFrom: '',
    validUntil: '',
    ...initialData,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [giftProductSearch, setGiftProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/data');
      // API returns { data: [...], total: number }
      const productsData = response.data.data || [];
      console.log('Loaded products:', productsData.length, productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data.categories || response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        {
          type: 'MIN_AMOUNT',
          minAmount: 0,
        },
      ],
    });
  };

  const updateCondition = (index: number, updates: Partial<GiftCondition>) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const toggleGiftProduct = (productId: string) => {
    const isSelected = formData.giftProductIds.includes(productId);
    setFormData({
      ...formData,
      giftProductIds: isSelected
        ? formData.giftProductIds.filter((id) => id !== productId)
        : [...formData.giftProductIds, productId],
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Numele este obligatoriu';
    }

    if (formData.priority < 1 || formData.priority > 100) {
      newErrors.priority = 'Prioritatea trebuie să fie între 1 și 100';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'Trebuie să adăugați cel puțin o condiție';
    }

    if (formData.giftProductIds.length === 0) {
      newErrors.giftProducts = 'Trebuie să selectați cel puțin un produs cadou';
    }

    if (formData.validFrom && formData.validUntil) {
      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        newErrors.validUntil = 'Data de sfârșit trebuie să fie după data de început';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Show alert with validation errors
      const errorMessages = Object.values(errors).join('\n');
      alert(`Vă rugăm să corectați următoarele erori:\n\n${errorMessages}`);
      return;
    }

    setLoading(true);
    try {
      // Clean conditions - remove id field and undefined values
      const cleanConditions = formData.conditions.map(condition => {
        const cleaned: any = {
          type: condition.type
        };
        
        // Only add fields that have values
        if (condition.minAmount !== undefined && condition.minAmount !== null) {
          cleaned.minAmount = Number(condition.minAmount);
        }
        if (condition.productId) {
          cleaned.productId = condition.productId;
        }
        if (condition.minQuantity !== undefined && condition.minQuantity !== null) {
          cleaned.minQuantity = Number(condition.minQuantity);
        }
        if (condition.categoryId) {
          cleaned.categoryId = condition.categoryId;
        }
        if (condition.minCategoryAmount !== undefined && condition.minCategoryAmount !== null) {
          cleaned.minCategoryAmount = Number(condition.minCategoryAmount);
        }
        
        return cleaned;
      });
      
      // Transform data for backend
      const submitData: any = {
        name: formData.name,
        description: formData.description,
        priority: Number(formData.priority),
        isActive: formData.isActive,
        conditionLogic: formData.conditionLogic,
        conditions: cleanConditions,
        giftProductIds: formData.giftProductIds,
      };
      
      // Only add optional fields if they have values
      if (formData.maxUsesPerCustomer) {
        submitData.maxUsesPerCustomer = Number(formData.maxUsesPerCustomer);
      }
      if (formData.maxTotalUses) {
        submitData.maxTotalUses = Number(formData.maxTotalUses);
      }
      if (formData.validFrom) {
        submitData.validFrom = new Date(formData.validFrom).toISOString();
      }
      if (formData.validUntil) {
        submitData.validUntil = new Date(formData.validUntil).toISOString();
      }
      
      console.log('📤 Submitting gift rule:', JSON.stringify(submitData, null, 2));
      await onSubmit(submitData);
    } catch (error) {
      console.error('❌ Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    stripHtml(p.title).toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredGiftProducts = products.filter((p) =>
    stripHtml(p.title).toLowerCase().includes(giftProductSearch.toLowerCase())
  );

  const selectedGiftProducts = products.filter((p) =>
    formData.giftProductIds.includes(p.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Informații de Bază</h2>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Nume Regulă <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Ex: Comandă peste 200 RON"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descriere</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="Descriere opțională pentru regulă"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Prioritate (1-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className={`w-full px-3 py-2 border rounded ${errors.priority ? 'border-red-500' : ''}`}
            />
            {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
            <p className="text-xs text-gray-500 mt-1">Mai mare = prioritate mai mare</p>
          </div>

          <div>
            <label className="flex items-center space-x-2 mt-7">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Regulă Activă</span>
            </label>
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-bold">Condiții</h2>
          <button
            type="button"
            onClick={addCondition}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Adaugă Condiție
          </button>
        </div>

        {errors.conditions && (
          <p className="text-red-500 text-sm">{errors.conditions}</p>
        )}

        {formData.conditions.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">Logică între condiții:</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="AND"
                  checked={formData.conditionLogic === 'AND'}
                  onChange={(e) => setFormData({ ...formData, conditionLogic: 'AND' })}
                />
                <span>AND (toate condițiile trebuie îndeplinite)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="OR"
                  checked={formData.conditionLogic === 'OR'}
                  onChange={(e) => setFormData({ ...formData, conditionLogic: 'OR' })}
                />
                <span>OR (cel puțin o condiție trebuie îndeplinită)</span>
              </label>
            </div>
          </div>
        )}

        {formData.conditions.map((condition, index) => (
          <div key={index} className="border p-4 rounded bg-gray-50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Condiție {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️ Șterge
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tip Condiție</label>
              <select
                value={condition.type}
                onChange={(e) => updateCondition(index, { 
                  type: e.target.value as GiftCondition['type'],
                  minAmount: undefined,
                  productId: undefined,
                  minQuantity: undefined,
                  categoryId: undefined,
                  minCategoryAmount: undefined,
                })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="MIN_AMOUNT">Sumă Minimă</option>
                <option value="SPECIFIC_PRODUCT">Produs Specific</option>
                <option value="PRODUCT_CATEGORY">Categorie Produs</option>
                <option value="PRODUCT_QUANTITY">Cantitate Produs</option>
              </select>
            </div>

            {condition.type === 'MIN_AMOUNT' && (
              <div>
                <label className="block text-sm font-medium mb-1">Sumă Minimă (RON)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={condition.minAmount || 0}
                  onChange={(e) => updateCondition(index, { minAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )}

            {(condition.type === 'SPECIFIC_PRODUCT' || condition.type === 'PRODUCT_QUANTITY') && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Produs</label>
                  <input
                    type="text"
                    placeholder="Caută produs..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded mb-2"
                  />
                  <select
                    value={condition.productId || ''}
                    onChange={(e) => updateCondition(index, { productId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Selectează produs</option>
                    {filteredProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {stripHtml(product.title)} - {product.price} RON
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cantitate Minimă</label>
                  <input
                    type="number"
                    min="1"
                    value={condition.minQuantity || 1}
                    onChange={(e) => updateCondition(index, { minQuantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </>
            )}

            {condition.type === 'PRODUCT_CATEGORY' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Categorie</label>
                  <select
                    value={condition.categoryId || ''}
                    onChange={(e) => updateCondition(index, { categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Selectează categorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sumă Minimă din Categorie (opțional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={condition.minCategoryAmount || ''}
                    onChange={(e) => updateCondition(index, { 
                      minCategoryAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Lasă gol pentru orice sumă"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Gift Products Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Produse Cadou</h2>
        
        {errors.giftProducts && (
          <p className="text-red-500 text-sm">{errors.giftProducts}</p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Caută Produse</label>
          <input
            type="text"
            placeholder="Caută după nume..."
            value={giftProductSearch}
            onChange={(e) => setGiftProductSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto border p-4 rounded">
          {filteredGiftProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => toggleGiftProduct(product.id)}
              className={`border rounded p-3 cursor-pointer transition ${
                formData.giftProductIds.includes(product.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={stripHtml(product.title)}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <h4 className="font-medium text-sm truncate">{stripHtml(product.title)}</h4>
              <p className="text-sm text-gray-600">{product.price} RON</p>
              <p className="text-xs text-gray-500">Stoc: {product.stock.toFixed(2)}</p>
              {formData.giftProductIds.includes(product.id) && (
                <span className="text-blue-600 text-sm">✓ Selectat</span>
              )}
            </div>
          ))}
        </div>

        {selectedGiftProducts.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Produse Selectate ({selectedGiftProducts.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGiftProducts.map((product) => (
                <span
                  key={product.id}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{stripHtml(product.title)}</span>
                  <button
                    type="button"
                    onClick={() => toggleGiftProduct(product.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Limits Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Limite și Validitate</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Maxim Utilizări per Client
            </label>
            <input
              type="number"
              min="0"
              value={formData.maxUsesPerCustomer || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                maxUsesPerCustomer: e.target.value ? parseInt(e.target.value) : null 
              })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Nelimitat"
            />
            <p className="text-xs text-gray-500 mt-1">Lasă gol pentru nelimitat</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Maxim Utilizări Totale
            </label>
            <input
              type="number"
              min="0"
              value={formData.maxTotalUses || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                maxTotalUses: e.target.value ? parseInt(e.target.value) : null 
              })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Nelimitat"
            />
            <p className="text-xs text-gray-500 mt-1">Lasă gol pentru nelimitat</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valabil De La</label>
            <input
              type="datetime-local"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valabil Până La</label>
            <input
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.validUntil ? 'border-red-500' : ''}`}
            />
            {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          disabled={loading}
        >
          Anulează
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Se salvează...' : ruleId ? 'Actualizează Regulă' : 'Creează Regulă'}
        </button>
      </div>
    </form>
  );
}
