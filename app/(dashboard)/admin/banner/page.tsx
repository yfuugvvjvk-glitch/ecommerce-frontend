'use client';

import { useRouter } from 'next/navigation';
import AdminBannerEditor from '@/components/admin/AdminBannerEditor';

export default function BannerPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Anunțuri</h1>
          <p className="text-gray-600 mt-1">
            Gestionează banner-ul de anunțuri de pe pagina principală
          </p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Înapoi la Admin
        </button>
      </div>

      <AdminBannerEditor />
    </div>
  );
}
