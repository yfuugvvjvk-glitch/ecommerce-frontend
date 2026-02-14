'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import GiftRuleForm from '@/components/admin/GiftRuleForm';

export default function CreateGiftRulePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      console.log('Submitting gift rule data:', data);
      await apiClient.post('/api/admin/gift-rules', data);
      router.push('/admin/gift-rules');
    } catch (err: any) {
      console.error('Failed to create gift rule:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create gift rule';
      setError(errorMessage);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/admin/gift-rules');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Creare Regulă Cadou Nouă</h1>
        <p className="text-gray-600 mt-2">
          Completează formularul pentru a crea o nouă regulă de cadou
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <GiftRuleForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
