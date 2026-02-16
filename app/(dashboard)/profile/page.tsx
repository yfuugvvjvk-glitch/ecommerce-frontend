'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { User } from '@/types';
import ChangeEmailModal from '@/components/profile/ChangeEmailModal';
import ChangePhoneModal from '@/components/profile/ChangePhoneModal';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
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
    city: '',
    county: '',
    street: '',
    streetNumber: '',
    addressDetails: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

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
        city: response.data.city || '',
        county: response.data.county || '',
        street: response.data.street || '',
        streetNumber: response.data.streetNumber || '',
        addressDetails: response.data.addressDetails || '',
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
      setToast({ message: t('profile.invalidFileType'), type: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: t('profile.fileTooLarge'), type: 'error' });
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
      setToast({ message: t('profile.avatarUploadSuccess'), type: 'success' });
      // Force page reload to show new avatar everywhere
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || t('profile.errorUploadAvatar'), type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm(t('profile.confirmDeleteAvatar'))) return;

    setUploadingAvatar(true);
    try {
      const response = await apiClient.delete('/api/user/avatar');
      setProfile(response.data.profile);
      if (setUser) {
        setUser(response.data.profile);
      }
      setToast({ message: t('profile.avatarDeleteSuccess'), type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || t('profile.errorDeleteAvatar'), type: 'error' });
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
      setToast({ message: t('profile.profileUpdateSuccess'), type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || t('profile.errorUpdateProfile'), type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/user/change-password', passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setToast({ message: t('profile.passwordChangeSuccess'), type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || t('profile.errorChangePassword'), type: 'error' });
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
      <h1 className="text-3xl font-bold mb-6">👤 {t('profile.title')}</h1>

      {toast && (
        <div className={`mb-4 p-4 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Modale pentru schimbare email/telefon */}
      {profile && (
        <>
          <ChangeEmailModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            currentEmail={profile.email}
            onSuccess={fetchProfile}
          />
          <ChangePhoneModal
            isOpen={showPhoneModal}
            onClose={() => setShowPhoneModal(false)}
            currentPhone={profile.phone || ''}
            onSuccess={fetchProfile}
          />
        </>
      )}

      {/* Avatar Section */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{t('profile.avatar')}</h2>
          <div className="flex items-center gap-6">
            <Avatar user={profile} size="lg" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {t('profile.uploadAvatar')}
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
                  {uploadingAvatar ? `📤 ${t('profile.uploading')}` : `📷 ${t('profile.changeAvatar')}`}
                </button>
                {profile.avatar && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    🗑️ {t('profile.deleteAvatar')}
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
            <h2 className="text-xl font-bold">{t('profile.personalInfo')}</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ✏️ {t('profile.edit')}
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">{t('profile.name')}</label>
                <p className="font-semibold">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('profile.email')}</label>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{profile?.email}</p>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Schimbă
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('profile.phone')}</label>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{profile?.phone || t('profile.notSet')}</p>
                  <button
                    onClick={() => setShowPhoneModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Schimbă
                  </button>
                </div>
              </div>
              <div className="border-t pt-3">
                <label className="text-sm text-gray-600 font-semibold">📍 {t('profile.deliveryAddress')}</label>
                {profile?.city || profile?.county || profile?.street ? (
                  <div className="mt-2 space-y-1">
                    {profile?.city && <p className="text-sm"><span className="text-gray-600">{t('profile.city')}:</span> {profile.city}</p>}
                    {profile?.county && <p className="text-sm"><span className="text-gray-600">{t('profile.county')}:</span> {profile.county}</p>}
                    {profile?.street && <p className="text-sm"><span className="text-gray-600">{t('profile.street')}:</span> {profile.street} {profile?.streetNumber || ''}</p>}
                    {profile?.addressDetails && <p className="text-sm"><span className="text-gray-600">{t('profile.addressDetails')}:</span> {profile.addressDetails}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">{t('profile.notSet')}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('profile.role')}</label>
                <p className="font-semibold capitalize">{profile?.role}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('profile.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('profile.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('profile.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="+40..."
                />
              </div>

              {/* Adresă detaliată */}
              <div className="border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📍 {t('profile.deliveryAddress')}</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('profile.city')}</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="ex: București"
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('profile.county')}</label>
                    <input
                      type="text"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      placeholder="ex: Ilfov"
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('profile.street')}</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="ex: Str. Victoriei"
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('profile.streetNumber')}</label>
                    <input
                      type="text"
                      value={formData.streetNumber}
                      onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                      placeholder="ex: 25"
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">{t('profile.addressDetails')}</label>
                  <input
                    type="text"
                    value={formData.addressDetails}
                    onChange={(e) => setFormData({ ...formData, addressDetails: e.target.value })}
                    placeholder={t('profile.addressDetailsPlaceholder')}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  💾 {t('profile.save')}
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
                      city: profile?.city || '',
                      county: profile?.county || '',
                      street: profile?.street || '',
                      streetNumber: profile?.streetNumber || '',
                      addressDetails: profile?.addressDetails || '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ❌ {t('profile.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('profile.changePassword')}</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.oldPassword')}</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.newPassword')}</label>
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
              🔒 {t('profile.changePasswordBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
