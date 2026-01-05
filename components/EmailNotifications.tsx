'use client';

import { useState } from 'react';
import { Mail, Check, X, Bell } from 'lucide-react';

interface EmailNotificationsProps {
  userId: string;
}

export default function EmailNotifications({ userId }: EmailNotificationsProps) {
  const [emailPreferences, setEmailPreferences] = useState({
    orderConfirmation: true,
    orderUpdates: true,
    promotions: false,
    lowStock: false, // Pentru admin
    newsletter: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePreferences = async (newPreferences: typeof emailPreferences) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setEmailPreferences(newPreferences);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Eroare salvare preferințe email:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof emailPreferences) => {
    const newPreferences = {
      ...emailPreferences,
      [key]: !emailPreferences[key]
    };
    updatePreferences(newPreferences);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Mail className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Notificări Email</h3>
        {saved && (
          <div className="flex items-center space-x-1 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Salvat</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Confirmare Comenzi</h4>
            <p className="text-sm text-gray-500">Primește email când plasezi o comandă</p>
          </div>
          <button
            onClick={() => handleToggle('orderConfirmation')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailPreferences.orderConfirmation ? 'bg-blue-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailPreferences.orderConfirmation ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Actualizări Comenzi</h4>
            <p className="text-sm text-gray-500">Primește email când statusul comenzii se schimbă</p>
          </div>
          <button
            onClick={() => handleToggle('orderUpdates')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailPreferences.orderUpdates ? 'bg-blue-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailPreferences.orderUpdates ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Promoții și Oferte</h4>
            <p className="text-sm text-gray-500">Primește email cu oferte speciale și reduceri</p>
          </div>
          <button
            onClick={() => handleToggle('promotions')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailPreferences.promotions ? 'bg-blue-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailPreferences.promotions ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Newsletter</h4>
            <p className="text-sm text-gray-500">Primește newsletter-ul săptămânal</p>
          </div>
          <button
            onClick={() => handleToggle('newsletter')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailPreferences.newsletter ? 'bg-blue-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailPreferences.newsletter ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Notă Importantă</h4>
            <p className="text-sm text-blue-700 mt-1">
              Emailurile de confirmare și actualizare comenzi sunt esențiale pentru urmărirea comenzilor tale. 
              Te recomandăm să le păstrezi activate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componenta pentru preview email
export function EmailPreview({ type, data }: { type: string; data: any }) {
  const getPreviewContent = () => {
    switch (type) {
      case 'order_confirmation':
        return (
          <div className="bg-white border rounded-lg p-6 max-w-md">
            <div className="text-center mb-4">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg">Comandă Confirmată!</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Comandă:</strong> #{data.orderId?.substring(0, 8)}</p>
              <p><strong>Total:</strong> {data.total} RON</p>
              <p><strong>Livrare:</strong> {data.shippingAddress}</p>
            </div>
          </div>
        );
      case 'order_status':
        return (
          <div className="bg-white border rounded-lg p-6 max-w-md">
            <div className="text-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg">Actualizare Comandă</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Comandă:</strong> #{data.orderId?.substring(0, 8)}</p>
              <p><strong>Status:</strong> {data.status}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Preview Email:</h4>
      {getPreviewContent()}
    </div>
  );
}