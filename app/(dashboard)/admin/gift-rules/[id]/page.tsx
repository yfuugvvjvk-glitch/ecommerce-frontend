'use client';

import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import GiftRuleForm from '@/components/admin/GiftRuleForm';

export default function EditGiftRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRule();
  }, [ruleId]);

  const fetchRule = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/gift-rules/${ruleId}`);
      const rule = response.data.rule;

      // Transform the data to match form structure
      setInitialData({
        name: rule.name,
        description: rule.description || '',
        priority: rule.priority,
        isActive: rule.isActive,
        conditionLogic: rule.conditionLogic,
        conditions: rule.conditions || [],
        giftProductIds: rule.giftProducts?.map((gp: any) => gp.productId) || [],
        maxUsesPerCustomer: rule.maxUsesPerCustomer,
        maxTotalUses: rule.maxTotalUses,
        validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().slice(0, 16) : '',
        validUntil: rule.validUntil ? new Date(rule.validUntil).toISOString().slice(0, 16) : '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load gift rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      await apiClient.put(`/api/admin/gift-rules/${ruleId}`, data);
      router.push('/admin/gift-rules');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update gift rule');
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/admin/gift-rules');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Se încarcă...</div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => router.push('/admin/gift-rules')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Înapoi la Lista de Reguli
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editare Regulă Cadou</h1>
        <p className="text-gray-600 mt-2">
          Modifică detaliile regulii de cadou
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {initialData && (
        <GiftRuleForm
          initialData={initialData}
          ruleId={ruleId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
