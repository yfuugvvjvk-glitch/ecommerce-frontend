'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setToast({ message: 'Rol actualizat cu succes!', type: 'success' });
      fetchUsers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sigur vrei să ștergi acest utilizator?')) return;
    try {
      await apiClient.delete(`/api/admin/users/${userId}`);
      setToast({ message: 'Utilizator șters!', type: 'success' });
      fetchUsers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div>
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comenzi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.phone || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">{user._count?.orders || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️ Șterge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
