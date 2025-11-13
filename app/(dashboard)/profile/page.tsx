'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import Avatar from '@/components/Avatar';
import { User } from '@/types';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/api/user/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Tip fișier invalid. Doar JPG, PNG și GIF sunt permise.', type: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Fișierul este prea mare. Dimensiunea maximă este 5MB.', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedProfile = response.data.profile;
      // Add timestamp to force image reload
      if (updatedProfile.avatar) {
        updatedProfile.avatar = `${updatedProfile.avatar}?t=${Date.now()}`;
      }
      setProfile(updatedProfile);
      if (setUser) {
        setUser(updatedProfile);
      }
      setToast({ message: 'Avatar încărcat cu succes!', type: 'success' });
      // Force page reload to show new avatar everywhere
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la încărcare avatar', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Sigur vrei să ștergi avatarul?')) return;

    setUploadingAvatar(true);
    try {
      const response = await apiClient.delete('/api/user/avatar');
      setProfile(response.data.profile);
      if (setUser) {
        setUser(response.data.profile);
      }
      setToast({ message: 'Avatar șters cu succes!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la ștergere avatar', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put('/api/user/profile', formData);
      setProfile(response.data);
      if (setUser) {
        setUser(response.data);
      }
      setEditing(false);
      setToast({ message: 'Profil actualizat cu succes!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la actualizare', type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/user/change-password', passwordData);
      setPasswordData({ oldPassword: '', newPassword: '' });
      setToast({ message: 'Parolă schimbată cu succes!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Eroare la schimbare parolă', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">👤 Profilul Meu</h1>

      {toast && (
        <div className={`mb-4 p-4 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Avatar Section */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <Avatar user={profile} size="lg" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Încarcă o imagine de profil (JPG, PNG, GIF - max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? '📤 Se încarcă...' : '📷 Schimbă Avatar'}
                </button>
                {profile.avatar && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    🗑️ Șterge Avatar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Informații Personale</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ✏️ Editează
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nume</label>
                <p className="font-semibold">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-semibold">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Telefon</label>
                <p className="font-semibold">{profile?.phone || 'Nu este setat'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Adresă</label>
                <p className="font-semibold">{profile?.address || 'Nu este setată'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Rol</label>
                <p className="font-semibold capitalize">{profile?.role}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nume</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresă</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  💾 Salvează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile?.name || '',
                      email: profile?.email || '',
                      phone: profile?.phone || '',
                      address: profile?.address || '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ❌ Anulează
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Schimbă Parola</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Parola Veche</label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Parola Nouă</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🔒 Schimbă Parola
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
