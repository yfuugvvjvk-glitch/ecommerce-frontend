'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';
import GiftRuleStatistics from '@/components/admin/GiftRuleStatistics';

interface Statistics {
  totalUses: number;
  uniqueUsers: number;
  totalValueGiven: number;
  usageByProduct: Array<{
    productId: string;
    productName: string;
    count: number;
    totalValue: number;
  }>;
  usageOverTime: Array<{
    date: string;
    count: number;
  }>;
}

export default function GiftRuleStatisticsPage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [ruleName, setRuleName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
    fetchRuleDetails();
  }, [ruleId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/gift-rules/${ruleId}/statistics`);
      setStatistics(response.data.statistics);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRuleDetails = async () => {
    try {
      const response = await apiClient.get(`/api/admin/gift-rules/${ruleId}`);
      setRuleName(response.data.rule.name);
    } catch (err) {
      console.error('Failed to fetch rule details:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Se încarcă statisticile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/admin/gift-rules')}
          className="text-blue-600 hover:text-blue-900"
        >
          ← Înapoi la lista de reguli
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/gift-rules')}
          className="text-blue-600 hover:text-blue-900 mb-4"
        >
          ← Înapoi la lista de reguli
        </button>
        <h1 className="text-3xl font-bold">Statistici: {ruleName}</h1>
      </div>

      {/* Statistics Component */}
      {statistics && <GiftRuleStatistics statistics={statistics} />}
    </div>
  );
}
