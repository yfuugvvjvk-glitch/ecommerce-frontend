'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  isPublic: boolean;
}

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contact' | 'delivery' | 'orders' | 'hours'>('contact');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/admin/site-config');
      setSettings(response.data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await apiClient.put(`/api/admin/site-config/${key}`, { value });
      alert('Setare actualizată cu succes!');
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Eroare la actualizarea setării');
    }
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key);
  };

  const getSettingValue = (key: string, defaultValue: string = '') => {
    const setting = getSetting(key);
    return setting ? setting.value : defaultValue;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Setări Site Centralizate</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>💡 Important:</strong> Aceste setări se vor aplica AUTOMAT în toate părțile site-ului 
          (Contact, Livrare, Checkout, Footer, etc.). Modifică o dată aici și se actualizează peste tot!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'contact'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📞 Contact
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'delivery'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🚚 Livrare
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🛒 Comenzi
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'hours'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🕐 Program
        </button>
      </div>

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Informații de Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Contact
              </label>
              <input
                type="email"
                defaultValue={getSettingValue('contact_email')}
                onBlur={(e) => updateSetting('contact_email', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Contact
              </label>
              <input
                type="tel"
                defaultValue={getSettingValue('contact_phone')}
                onBlur={(e) => updateSetting('contact_phone', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresă Fizică
              </label>
              <textarea
                defaultValue={getSettingValue('contact_address')}
                onBlur={(e) => updateSetting('contact_address', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Setări Livrare</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresă Livrare/Ridicare
              </label>
              <textarea
                defaultValue={getSettingValue('delivery_address')}
                onBlur={(e) => updateSetting('delivery_address', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Această adresă va apărea în pagina de contact, checkout și email-uri
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Livrări
              </label>
              <input
                type="tel"
                defaultValue={getSettingValue('delivery_phone')}
                onBlur={(e) => updateSetting('delivery_phone', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Livrare (RON)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={getSettingValue('delivery_cost')}
                  onBlur={(e) => updateSetting('delivery_cost', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Livrare Gratuită Peste (RON)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={getSettingValue('free_delivery_threshold')}
                  onBlur={(e) => updateSetting('free_delivery_threshold', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Setări Comenzi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valoare Minimă Comandă (RON)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={getSettingValue('minimum_order_value')}
                onBlur={(e) => updateSetting('minimum_order_value', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Clienții nu vor putea plasa comenzi sub această valoare
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Program de Lucru</h3>
          <p className="text-sm text-gray-600 mb-4">
            Acest program va apărea în pagina de contact și footer
          </p>
          {/* TODO: Implementare editor program de lucru */}
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              Editor program de lucru - în dezvoltare
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
