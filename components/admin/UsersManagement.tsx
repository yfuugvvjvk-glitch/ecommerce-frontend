'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Eye, EyeOff, User, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: string;
  password: string;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
    favorites: number;
  };
}

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}/details`);
      setSelectedUser(response.data);
      setShowUserDetails(true);
      setShowPassword(false);
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la încărcarea detaliilor', type: 'error' });
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copiat în clipboard!', type: 'success' });
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
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => fetchUserDetails(user.id)}
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-sm"
                    title="Vezi detalii și parolă"
                  >
                    👁️ Detalii
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-sm"
                  >
                    🗑️ Șterge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Detalii Utilizator</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Nume</p>
                    <p className="font-semibold">{selectedUser.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-semibold">{selectedUser.phone || 'Nu este specificat'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Înregistrat</p>
                    <p className="font-semibold">
                      {new Date(selectedUser.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedUser.address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Adresă</p>
                  <p className="font-semibold bg-gray-50 p-3 rounded">{selectedUser.address}</p>
                </div>
              )}

              {/* Password Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-yellow-800 font-medium">
                    🔐 Parolă (pentru asistență recuperare)
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center space-x-1 text-yellow-700 hover:text-yellow-900"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">{showPassword ? 'Ascunde' : 'Arată'}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-3 py-2 rounded border flex-1 font-mono text-sm">
                    {showPassword ? selectedUser.password : '••••••••••••'}
                  </code>
                  {showPassword && (
                    <button
                      onClick={() => copyToClipboard(selectedUser.password)}
                      className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                      📋 Copiază
                    </button>
                  )}
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  ⚠️ Această informație este disponibilă doar pentru administratori în scopul asistenței utilizatorilor care și-au uitat parola.
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ShoppingBag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{selectedUser._count.orders}</p>
                  <p className="text-sm text-blue-700">Comenzi</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">⭐</div>
                  <p className="text-2xl font-bold text-green-600">{selectedUser._count.reviews}</p>
                  <p className="text-sm text-green-700">Recenzii</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">❤️</div>
                  <p className="text-2xl font-bold text-purple-600">{selectedUser._count.favorites}</p>
                  <p className="text-sm text-purple-700">Favorite</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedUser.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUser.role === 'admin' ? '👑 Administrator' : '👤 Utilizator'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
