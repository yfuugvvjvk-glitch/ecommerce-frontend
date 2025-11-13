'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';

type ProductInput = {
  title: string;
  description?: string;
  content: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  categoryId: string;
  status: string;
};

interface ProductFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function ProductForm({ onSubmit, onCancel, initialData, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.image || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductInput>({
    defaultValues: initialData,
    mode: 'onBlur',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tip fișier invalid. Doar JPG, PNG, GIF și WEBP sunt permise.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fișierul este prea mare. Dimensiunea maximă este 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/data/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.url;
      setImageUrl(uploadedUrl);
      setValue('image', uploadedUrl);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la încărcare imagine');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titlu *
          </label>
          <input
            {...register('title', { required: 'Titlul este obligatoriu' })}
            id="title"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-red-600 text-sm mt-1" role="alert">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Categorie *
          </label>
          <select
            {...register('categoryId', { required: 'Categoria este obligatorie' })}
            id="categoryId"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Selectează categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Preț (RON) *
          </label>
          <input
            {...register('price', { 
              required: 'Prețul este obligatoriu',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Prețul trebuie să fie pozitiv' }
            })}
            id="price"
            type="number"
            step="0.01"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-invalid={errors.price ? 'true' : 'false'}
            aria-describedby={errors.price ? 'price-error' : undefined}
          />
          {errors.price && (
            <p id="price-error" className="text-red-600 text-sm mt-1" role="alert">
              {errors.price.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="oldPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Preț Vechi (opțional)
          </label>
          <input
            {...register('oldPrice', { valueAsNumber: true })}
            id="oldPrice"
            type="number"
            step="0.01"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stoc *
          </label>
          <input
            {...register('stock', { 
              required: 'Stocul este obligatoriu',
              valueAsNumber: true,
              min: { value: 0, message: 'Stocul nu poate fi negativ' }
            })}
            id="stock"
            type="number"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-invalid={errors.stock ? 'true' : 'false'}
            aria-describedby={errors.stock ? 'stock-error' : undefined}
          />
          {errors.stock && (
            <p id="stock-error" className="text-red-600 text-sm mt-1" role="alert">
              {errors.stock.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            {...register('status')}
            id="status"
            className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Imagine Produs *
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <input
              {...register('image', { required: 'Imaginea este obligatorie' })}
              id="image"
              type="text"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setValue('image', e.target.value);
              }}
              placeholder="https://example.com/image.jpg sau /images/produs.jpg"
              className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={errors.image ? 'true' : 'false'}
              aria-describedby={errors.image ? 'image-error' : undefined}
            />
            {errors.image && (
              <p id="image-error" className="text-red-600 text-sm mt-1" role="alert">
                {errors.image.message}
              </p>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {uploadingImage ? '📤 Se încarcă...' : '📷 Upload'}
            </button>
          </div>
        </div>
        {imageUrl && (
          <div className="mt-2">
            <img src={imageUrl} alt="Preview" className="h-32 w-32 object-cover rounded border" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descriere Scurtă
        </label>
        <input
          {...register('description')}
          id="description"
          className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Conținut Detaliat *
        </label>
        <textarea
          {...register('content', { required: 'Conținutul este obligatoriu' })}
          id="content"
          rows={4}
          className="w-full px-4 py-3 text-base border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-invalid={errors.content ? 'true' : 'false'}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <p id="content-error" className="text-red-600 text-sm mt-1" role="alert">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 text-base bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isLoading ? 'Se salvează...' : '💾 Salvează'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 text-base bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
        >
          ❌ Anulează
        </button>
      </div>
    </form>
  );
}
