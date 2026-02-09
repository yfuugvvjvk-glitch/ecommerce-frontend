'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

interface DeliveryLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  deliveryRadius?: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  workingHours?: string;
  contactPerson?: string;
  specialInstructions?: string;
  isMainLocation: boolean;
  coordinates?: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationForm {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  deliveryRadius: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  workingHours: {
    monday: { start: string; end: string; isOpen: boolean };
    tuesday: { start: string; end: string; isOpen: boolean };
    wednesday: { start: string; end: string; isOpen: boolean };
    thursday: { start: string; end: string; isOpen: boolean };
    friday: { start: string; end: string; isOpen: boolean };
    saturday: { start: string; end: string; isOpen: boolean };
    sunday: { start: string; end: string; isOpen: boolean };
  };
  contactPerson: string;
  specialInstructions: string;
  coordinates: { lat: number; lng: number };
}

export default function DeliveryLocationsManager() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [locationForm, setLocationForm] = useState<LocationForm>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    isActive: true,
    deliveryRadius: 10,
    deliveryFee: 15,
    freeDeliveryThreshold: 100,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '10:00', end: '16:00', isOpen: true },
      sunday: { start: '10:00', end: '14:00', isOpen: false }
    },
    contactPerson: '',
    specialInstructions: '',
    coordinates: { lat: 44.4268, lng: 26.1025 }
  });

  // Real-time updates
  const { isConnected } = useWebSocket({
    onContentUpdate: (data) => {
      if (data.type?.includes('delivery_location')) {
        console.log('Real-time delivery location update:', data);
        fetchLocations();
      }
    }
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/delivery-locations');
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setToast({ message: 'Eroare la încărcarea locațiilor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLocation) {
        await apiClient.put(`/api/admin/delivery-locations/${editingLocation.id}`, locationForm);
        setToast({ message: 'Locația a fost actualizată!', type: 'success' });
      } else {
        await apiClient.post('/api/admin/delivery-locations', locationForm);
        setToast({ message: 'Locația a fost creată!', type: 'success' });
      }
      
      setShowModal(false);
      setEditingLocation(null);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la salvarea locației', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Sigur vrei să ștergi această locație? Această acțiune nu poate fi anulată.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/delivery-locations/${locationId}`);
      setToast({ message: 'Locația a fost ștearsă!', type: 'success' });
      fetchLocations();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la ștergerea locației', 
        type: 'error' 
      });
    }
  };

  const handleSetMainLocation = async (locationId: string) => {
    try {
      await apiClient.post(`/api/admin/delivery-locations/${locationId}/set-main`);
      setToast({ message: 'Locația principală a fost actualizată!', type: 'success' });
      fetchLocations();
    } catch (error: any) {
      console.error('Error setting main location:', error);
      setToast({ 
        message: error.response?.data?.error || 'Eroare la setarea locației principale', 
        type: 'error' 
      });
    }
  };

  const resetForm = () => {
    setLocationForm({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      isActive: true,
      deliveryRadius: 10,
      deliveryFee: 15,
      freeDeliveryThreshold: 100,
      workingHours: {
        monday: { start: '09:00', end: '18:00', isOpen: true },
        tuesday: { start: '09:00', end: '18:00', isOpen: true },
        wednesday: { start: '09:00', end: '18:00', isOpen: true },
        thursday: { start: '09:00', end: '18:00', isOpen: true },
        friday: { start: '09:00', end: '18:00', isOpen: true },
        saturday: { start: '10:00', end: '16:00', isOpen: true },
        sunday: { start: '10:00', end: '14:00', isOpen: false }
      },
      contactPerson: '',
      specialInstructions: '',
      coordinates: { lat: 44.4268, lng: 26.1025 }
    });
  };

  const openEditModal = (location: DeliveryLocation) => {
    setEditingLocation(location);
    
    let workingHours = {
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '10:00', end: '16:00', isOpen: true },
      sunday: { start: '10:00', end: '14:00', isOpen: false }
    };

    if (location.workingHours) {
      try {
        workingHours = JSON.parse(location.workingHours);
      } catch (e) {
        console.error('Error parsing working hours:', e);
      }
    }

    let coordinates = { lat: 44.4268, lng: 26.1025 };
    if (location.coordinates) {
      try {
        coordinates = JSON.parse(location.coordinates);
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }

    setLocationForm({
      name: location.name,
      address: location.address,
      city: location.city,
      postalCode: location.postalCode || '',
      phone: location.phone || '',
      email: location.email || '',
      isActive: location.isActive,
      deliveryRadius: location.deliveryRadius || 10,
      deliveryFee: location.deliveryFee,
      freeDeliveryThreshold: location.freeDeliveryThreshold || 100,
      workingHours,
      contactPerson: location.contactPerson || '',
      specialInstructions: location.specialInstructions || '',
      coordinates
    });
    setShowModal(true);
  };

  const parseWorkingHours = (workingHoursString?: string) => {
    if (!workingHoursString) return null;
    try {
      return JSON.parse(workingHoursString);
    } catch {
      return null;
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
    <div>
      {toast && (
        <div className={`mb-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">🚚 Gestionare Locații de Livrare</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configurează locațiile unde clienții pot ridica comenzile sau unde livrezi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={() => {
              setEditingLocation(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ➕ Adaugă Locație
          </button>
        </div>
      </div>

      {/* Lista locațiilor */}
      <div className="grid gap-4">
        {locations.map(location => {
          const workingHours = parseWorkingHours(location.workingHours);
          
          return (
            <div key={location.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{location.name}</h4>
                    {location.isMainLocation && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        ⭐ Principală
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {location.isActive ? '✅ Activă' : '❌ Inactivă'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">📍 Adresă:</p>
                      <p className="font-medium">{location.address}</p>
                      <p className="text-sm text-gray-600">{location.city}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">💰 Costuri livrare:</p>
                      <p className="font-medium">{location.deliveryFee} RON</p>
                      {location.freeDeliveryThreshold && (
                        <p className="text-xs text-green-600">
                          Gratuită peste {location.freeDeliveryThreshold} RON
                        </p>
                      )}
                    </div>
                  </div>

                  {location.phone && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">📞 Telefon: <span className="font-medium">{location.phone}</span></p>
                    </div>
                  )}

                  {location.email && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">📧 Email: <span className="font-medium">{location.email}</span></p>
                    </div>
                  )}

                  {workingHours && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">🕒 Program:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
                        {Object.entries(workingHours).map(([day, hours]: [string, any]) => {
                          // Verifică dacă hours este string sau obiect
                          const isString = typeof hours === 'string';
                          const isClosed = isString 
                            ? (hours === 'Închis' || hours === 'Closed')
                            : !hours.isOpen;
                          const displayHours = isString 
                            ? hours 
                            : (hours.isOpen ? `${hours.start}-${hours.end}` : 'Închis');
                          
                          return (
                            <div key={day} className={`p-1 rounded ${isClosed ? 'bg-red-50' : 'bg-green-50'}`}>
                              <span className="font-medium capitalize">{day.slice(0, 3)}:</span>
                              {' '}{displayHours}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {location.specialInstructions && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">ℹ️ Instrucțiuni:</p>
                      <p className="text-sm bg-blue-50 p-2 rounded">{location.specialInstructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(location)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    ✏️ Editează
                  </button>
                  
                  {!location.isMainLocation && (
                    <button
                      onClick={() => handleSetMainLocation(location.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm"
                    >
                      ⭐ Setează Principală
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    🗑️ Șterge
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {locations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">Nu există locații de livrare configurate</p>
            <button
              onClick={() => {
                setEditingLocation(null);
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              ➕ Adaugă Prima Locație
            </button>
          </div>
        )}
      </div>

      {/* Modal pentru adăugare/editare */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingLocation ? `Editează: ${editingLocation.name}` : 'Adaugă Locație Nouă'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informații de bază */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📝 Informații de Bază</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nume locație (ex: Depozit Central)"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                    className="border rounded px-3 py-2"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Oraș"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({...locationForm, city: e.target.value})}
                    className="border rounded px-3 py-2"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Adresa completă"
                    value={locationForm.address}
                    onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                    className="border rounded px-3 py-2 col-span-2"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Cod poștal (opțional)"
                    value={locationForm.postalCode}
                    onChange={(e) => setLocationForm({...locationForm, postalCode: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                  
                  <input
                    type="text"
                    placeholder="Persoana de contact (opțional)"
                    value={locationForm.contactPerson}
                    onChange={(e) => setLocationForm({...locationForm, contactPerson: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📞 Informații de Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Telefon (ex: +40 123 456 789)"
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm({...locationForm, phone: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                  
                  <input
                    type="email"
                    placeholder="Email (opțional)"
                    value={locationForm.email}
                    onChange={(e) => setLocationForm({...locationForm, email: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Costuri și livrare */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">💰 Costuri de Livrare</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost livrare (RON)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={locationForm.deliveryFee}
                      onChange={(e) => setLocationForm({...locationForm, deliveryFee: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Livrare gratuită peste (RON)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={locationForm.freeDeliveryThreshold}
                      onChange={(e) => setLocationForm({...locationForm, freeDeliveryThreshold: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raza de livrare (km)
                    </label>
                    <input
                      type="number"
                      value={locationForm.deliveryRadius}
                      onChange={(e) => setLocationForm({...locationForm, deliveryRadius: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Program de lucru */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">🕒 Program de Lucru</h4>
                <div className="space-y-3">
                  {Object.entries(locationForm.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20">
                        <span className="capitalize font-medium">{day}</span>
                      </div>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          onChange={(e) => setLocationForm({
                            ...locationForm,
                            workingHours: {
                              ...locationForm.workingHours,
                              [day]: { ...hours, isOpen: e.target.checked }
                            }
                          })}
                          className="mr-2"
                        />
                        Deschis
                      </label>
                      
                      {hours.isOpen && (
                        <>
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => setLocationForm({
                              ...locationForm,
                              workingHours: {
                                ...locationForm.workingHours,
                                [day]: { ...hours, start: e.target.value }
                              }
                            })}
                            className="border rounded px-2 py-1"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => setLocationForm({
                              ...locationForm,
                              workingHours: {
                                ...locationForm.workingHours,
                                [day]: { ...hours, end: e.target.value }
                              }
                            })}
                            className="border rounded px-2 py-1"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instrucțiuni speciale */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">ℹ️ Instrucțiuni Speciale</h4>
                <textarea
                  placeholder="Instrucțiuni pentru clienți (ex: Ne găsiți la adresa de mai sus. Sunați când ajungeți.)"
                  value={locationForm.specialInstructions}
                  onChange={(e) => setLocationForm({...locationForm, specialInstructions: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              {/* Coordonate */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">🗺️ Coordonate GPS (opțional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitudine
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={locationForm.coordinates.lat}
                      onChange={(e) => setLocationForm({
                        ...locationForm,
                        coordinates: { ...locationForm.coordinates, lat: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitudine
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={locationForm.coordinates.lng}
                      onChange={(e) => setLocationForm({
                        ...locationForm,
                        coordinates: { ...locationForm.coordinates, lng: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={locationForm.isActive}
                    onChange={(e) => setLocationForm({...locationForm, isActive: e.target.checked})}
                  />
                  <span>Locație activă</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  💾 {editingLocation ? 'Actualizează' : 'Creează'} Locația
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}