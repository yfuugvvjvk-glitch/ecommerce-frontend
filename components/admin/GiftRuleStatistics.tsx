'use client';

import { useMemo } from 'react';

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

interface GiftRuleStatisticsProps {
  statistics: Statistics;
}

export default function GiftRuleStatistics({ statistics }: GiftRuleStatisticsProps) {
  // Calculate max value for chart scaling
  const maxUsageCount = useMemo(() => {
    return Math.max(...statistics.usageOverTime.map((item) => item.count), 1);
  }, [statistics.usageOverTime]);

  const maxProductCount = useMemo(() => {
    return Math.max(...statistics.usageByProduct.map((item) => item.count), 1);
  }, [statistics.usageByProduct]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Utilizări
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.totalUses}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Utilizatori Unici
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.uniqueUsers}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Valoare Totală Oferită
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(statistics.totalValueGiven)}
          </div>
        </div>
      </div>

      {/* Usage Over Time Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Utilizări în Timp</h2>
        {statistics.usageOverTime.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nu există date de utilizare încă
          </div>
        ) : (
          <div className="space-y-2">
            {/* Chart */}
            <div className="flex items-end space-x-2 h-64 border-b border-l border-gray-300 pb-2 pl-2">
              {statistics.usageOverTime.map((item, index) => {
                const height = (item.count / maxUsageCount) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                  >
                    {/* Bar */}
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                      style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                    >
                      {/* Tooltip */}
                      <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        {item.count} utilizări
                        <div className="text-gray-300">{formatDate(item.date)}</div>
                      </div>
                    </div>
                    {/* Date Label */}
                    <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {formatDate(item.date)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Y-axis label */}
            <div className="text-sm text-gray-600 text-center mt-4">
              Număr de utilizări pe zi
            </div>
          </div>
        )}
      </div>

      {/* Usage By Product */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Utilizări pe Produs</h2>
        {statistics.usageByProduct.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nu există produse cadou utilizate încă
          </div>
        ) : (
          <div className="space-y-4">
            {statistics.usageByProduct.map((product) => {
              const percentage = (product.count / statistics.totalUses) * 100;
              return (
                <div key={product.productId} className="space-y-2">
                  {/* Product Info */}
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">{product.productName}</div>
                    <div className="text-sm text-gray-600">
                      {product.count} utilizări ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {/* Value */}
                  <div className="text-sm text-gray-500">
                    Valoare totală: {formatCurrency(product.totalValue)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Breakdown Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Detalii Produse</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produs
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilizări
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valoare Unitară
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valoare Totală
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % din Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {statistics.usageByProduct.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nu există date
                </td>
              </tr>
            ) : (
              statistics.usageByProduct.map((product) => {
                const percentage = (product.count / statistics.totalUses) * 100;
                const unitValue = product.totalValue / product.count;
                return (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {product.count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {formatCurrency(unitValue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(product.totalValue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
