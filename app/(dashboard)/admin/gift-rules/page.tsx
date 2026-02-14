'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface GiftRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  currentTotalUses: number;
  maxTotalUses: number | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export default function GiftRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<GiftRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    fetchRules();
  }, [page, showInactive]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/gift-rules', {
        params: {
          page,
          limit: 20,
          includeInactive: showInactive,
        },
      });

      setRules(response.data.rules);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load gift rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/admin/gift-rules/${ruleId}/toggle`, {
        isActive: !currentStatus,
      });
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to toggle rule status');
    }
  };

  const handleDelete = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Sigur vrei să ștergi regula "${ruleName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/gift-rules/${ruleId}`);
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete rule');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  if (loading && rules.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reguli Cadou</h1>
        <button
          onClick={() => router.push('/admin/gift-rules/create')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Creare Regulă Nouă
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          <span>Afișează și regulile inactive</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioritate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilizări
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validitate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nu există reguli de cadou
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                    {rule.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {rule.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.isActive ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.currentTotalUses}
                    {rule.maxTotalUses && ` / ${rule.maxTotalUses}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(rule.validFrom)}</div>
                    <div>{formatDate(rule.validUntil)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/admin/gift-rules/${rule.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => router.push(`/admin/gift-rules/${rule.id}/statistics`)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Statistici
                    </button>
                    <button
                      onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {rule.isActive ? 'Dezactivează' : 'Activează'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Pagina {page} din {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Următorul
          </button>
        </div>
      )}
    </div>
  );
}
