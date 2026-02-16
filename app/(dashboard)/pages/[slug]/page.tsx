'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/public/pages/${slug}`);
        setPage(response.data);
      } catch (err: any) {
        console.error('Error fetching page:', err);
        setError(err.response?.data?.error || 'Pagina nu a fost găsită');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Pagina nu a fost găsită</h1>
          <p className="text-red-600">{error || 'Această pagină nu există sau nu este publicată.'}</p>
          <a href="/" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Înapoi la pagina principală
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
          <div className="text-sm text-gray-500">
            Ultima actualizare: {new Date(page.updatedAt).toLocaleDateString('ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}
