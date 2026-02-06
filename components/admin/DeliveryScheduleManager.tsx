'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/lib/useWebSocket';

interface DeliverySchedule {
  id: string;
  name: string;
  deliveryDays: number[]; // 0=Duminică, 1=Luni, etc.
  deliveryTimeSlots: Array<{
    startTime: string;
    endTime: string;
    maxOrders: number;
  }>;
  isActive: boolean;
  blockOrdersAfter: string; // Ora după care se blochează comenzile pentru ziua următoare
  advanceOrderDays: number; // Câte zile în avans se pot face comenzi
  specialDates: Array<{
    date: string;
    isBlocked: boolean;
    reason?: string;
  }>;
}

interface OrderBlockSettings {
  blockNewOrders: boolean;
  blockReason: string;
  blockUntil?: string;
  allowedPaymentMethods: string[];
  minimumOrderValue: number;
  maximumOrderValue?: number;
}

export default function DeliveryScheduleManager() {
  const [schedules, setSchedules] = useState<DeliverySchedule[]>([]);
  const [blockSettings, setBlockSettings] = useState<OrderBlockSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'blocking' | 'special-dates'>('schedule');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DeliverySchedule | null>(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    deliveryDays: [] as number[],
    deliveryTimeSlots: [{ startTime: '09:00', endTime: '17:00', maxOrders: 10 }],
    isActive: true,
    blockOrdersAfter: '20:00',
    advanceOrderDays: 1
  });

  const [specialDateForm, setSpecialDateForm] = useState({
    date: '',
    isBlocked: true,
    reason: ''
  });

  // Real-time updates
  const { isConnected } = useWebSocket({
    onContentUpdate: (data) => {
      console.log('Delivery schedule update:', data);
      fetchData();
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, blockSettingsRes] = await Promise.all([
        apiClient.get('/api/admin/delivery-schedules'),
        apiClient.get('/api/admin/order-block-settings')
      ]);
      
      setSchedules(schedulesRes.data || []);
      setBlockSettings(blockSettingsRes.data || {
        blockNewOrders: false,
        blockReason: '',
        allowedPaymentMethods: ['cash', 'card'],
        minimumOrderValue: 0
      });
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      // Set mock data for now
      setSchedules([
        {
          id: '1',
          name: 'Program Standard',
          deliveryDays: [1, 2, 3, 4, 5], // Luni-Vineri
          deliveryTimeSlots: [
            { startTime: '09:00', endTime: '12:00', maxOrders: 5 },
            { startTime: '14:00', endTime: '18:00', maxOrders: 8 }
          ],
          isActive: true,
          blockOrdersAfter: '20:00',
          advanceOrderDays: 1,
          specialDates: []
        }
      ]);
      setBlockSettings({
        blockNewOrders: false,
        blockReason: '',
        allowedPaymentMethods: ['cash', 'card'],
        minimumOrderValue: 50
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const scheduleData = {
        ...scheduleForm,
        specialDates: []
      };

      await apiClient.post('/api/admin/delivery-schedules', scheduleData);
      setShowModal(false);
      resetForm();
      fetchData();
      alert('Programul de livrare a fost creat cu succes!');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Eroare la crearea programului de livrare');
    }
  };

  const handleUpdateBlockSettings = async () => {
    try {
      await apiClient.put('/api/admin/order-block-settings', blockSettings);
      alert('Setările de blocare au fost actualizate!');
    } catch (error) {
      console.error('Error updating block settings:', error);
      alert('Eroare la actualizarea setărilor');
    }
  };

  const handleAddSpecialDate = async (scheduleId: string) => {
    try {
      await apiClient.post(`/api/admin/delivery-schedules/${scheduleId}/special-dates`, specialDateForm);
      setSpecialDateForm({ date: '', isBlocked: true, reason: '' });
      fetchData();
      alert('Data specială a fost adăugată!');
    } catch (error) {
      console.error('Error adding special date:', error);
      alert('Eroare la adăugarea datei speciale');
    }
  };

  const resetForm = () => {
    setScheduleForm({
      name: '',
      deliveryDays: [],
      deliveryTimeSlots: [{ startTime: '09:00', endTime: '17:00', maxOrders: 10 }],
      isActive: true,
      blockOrdersAfter: '20:00',
      advanceOrderDays: 1
    });
    setEditingSchedule(null);
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    return days[dayIndex];
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
      {/* Header cu status real-time */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestionare Livrări și Comenzi</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'schedule'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Program Livrări
        </button>
        <button
          onClick={() => setActiveTab('blocking')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'blocking'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🚫 Blocare Comenzi
        </button>
        <button
          onClick={() => setActiveTab('special-dates')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'special-dates'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🗓️ Date Speciale
        </button>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Programe de Livrare</h3>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Program
            </button>
          </div>

          <div className="grid gap-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{schedule.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.isActive ? 'Activ' : 'Inactiv'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Zile de livrare</p>
                        <p className="font-medium">
                          {schedule.deliveryDays.map(day => getDayName(day)).join(', ')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Comenzi se blochează după</p>
                        <p className="font-medium">{schedule.blockOrdersAfter}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Comandă în avans</p>
                        <p className="font-medium">{schedule.advanceOrderDays} zile</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-2">Intervale de livrare:</p>
                      <div className="space-y-1">
                        {schedule.deliveryTimeSlots.map((slot, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {slot.startTime} - {slot.endTime} (max {slot.maxOrders} comenzi)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setScheduleForm({
                          name: schedule.name,
                          deliveryDays: schedule.deliveryDays,
                          deliveryTimeSlots: schedule.deliveryTimeSlots,
                          isActive: schedule.isActive,
                          blockOrdersAfter: schedule.blockOrdersAfter,
                          advanceOrderDays: schedule.advanceOrderDays
                        });
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      ✏️ Editează
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocking Tab */}
      {activeTab === 'blocking' && blockSettings && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Setări Blocare Comenzi</h3>
          
          <div className="bg-white border rounded-lg p-6">
            <div className="space-y-6">
              {/* Blocare generală */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={blockSettings.blockNewOrders}
                    onChange={(e) => setBlockSettings({
                      ...blockSettings,
                      blockNewOrders: e.target.checked
                    })}
                  />
                  <span className="font-medium">Blochează toate comenzile noi</span>
                </label>
                
                {blockSettings.blockNewOrders && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motiv blocare
                      </label>
                      <input
                        type="text"
                        value={blockSettings.blockReason}
                        onChange={(e) => setBlockSettings({
                          ...blockSettings,
                          blockReason: e.target.value
                        })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Concediu, renovări, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blochează până la (opțional)
                      </label>
                      <input
                        type="datetime-local"
                        value={blockSettings.blockUntil || ''}
                        onChange={(e) => setBlockSettings({
                          ...blockSettings,
                          blockUntil: e.target.value
                        })}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Restricții comenzi */}
              <div>
                <h4 className="font-medium mb-3">Restricții Comenzi</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valoare minimă comandă (RON)
                    </label>
                    <input
                      type="number"
                      value={blockSettings.minimumOrderValue}
                      onChange={(e) => setBlockSettings({
                        ...blockSettings,
                        minimumOrderValue: parseFloat(e.target.value)
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valoare maximă comandă (RON) - opțional
                    </label>
                    <input
                      type="number"
                      value={blockSettings.maximumOrderValue || ''}
                      onChange={(e) => setBlockSettings({
                        ...blockSettings,
                        maximumOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Metode de plată permise */}
              <div>
                <h4 className="font-medium mb-3">Metode de Plată Permise</h4>
                <div className="space-y-2">
                  {['cash', 'card', 'transfer', 'crypto'].map(method => (
                    <label key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blockSettings.allowedPaymentMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBlockSettings({
                              ...blockSettings,
                              allowedPaymentMethods: [...blockSettings.allowedPaymentMethods, method]
                            });
                          } else {
                            setBlockSettings({
                              ...blockSettings,
                              allowedPaymentMethods: blockSettings.allowedPaymentMethods.filter(m => m !== method)
                            });
                          }
                        }}
                      />
                      <span className="capitalize">{method === 'cash' ? 'Numerar' : method === 'card' ? 'Card' : method === 'transfer' ? 'Transfer' : 'Crypto'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateBlockSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  💾 Salvează Setări
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Dates Tab */}
      {activeTab === 'special-dates' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Date Speciale (Sărbători, Concedii)</h3>
          
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h4 className="font-medium mb-3">Adaugă Dată Specială</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={specialDateForm.date}
                  onChange={(e) => setSpecialDateForm({...specialDateForm, date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                <select
                  value={specialDateForm.isBlocked ? 'blocked' : 'special'}
                  onChange={(e) => setSpecialDateForm({
                    ...specialDateForm, 
                    isBlocked: e.target.value === 'blocked'
                  })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="blocked">Zi blocată (fără livrări)</option>
                  <option value="special">Zi specială (program modificat)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motiv</label>
                <input
                  type="text"
                  value={specialDateForm.reason}
                  onChange={(e) => setSpecialDateForm({...specialDateForm, reason: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Crăciun, Paște, etc."
                />
              </div>
            </div>
            
            <button
              onClick={() => handleAddSpecialDate(schedules[0]?.id || '1')}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Dată
            </button>
          </div>

          {/* Lista date speciale */}
          <div className="space-y-2">
            {schedules[0]?.specialDates?.map((specialDate, index) => (
              <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{new Date(specialDate.date).toLocaleDateString('ro-RO')}</p>
                  <p className="text-sm text-gray-600">{specialDate.reason}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  specialDate.isBlocked ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {specialDate.isBlocked ? 'Blocată' : 'Specială'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal pentru creare/editare program */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingSchedule ? 'Editează Program' : 'Adaugă Program Nou'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Program
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({...scheduleForm, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Program Standard, Program Weekend"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zile de Livrare
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scheduleForm.deliveryDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScheduleForm({
                              ...scheduleForm,
                              deliveryDays: [...scheduleForm.deliveryDays, day]
                            });
                          } else {
                            setScheduleForm({
                              ...scheduleForm,
                              deliveryDays: scheduleForm.deliveryDays.filter(d => d !== day)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{getDayName(day)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blochează comenzi după
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.blockOrdersAfter}
                    onChange={(e) => setScheduleForm({...scheduleForm, blockOrdersAfter: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zile în avans pentru comenzi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={scheduleForm.advanceOrderDays}
                    onChange={(e) => setScheduleForm({...scheduleForm, advanceOrderDays: parseInt(e.target.value)})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isActive}
                    onChange={(e) => setScheduleForm({...scheduleForm, isActive: e.target.checked})}
                  />
                  <span>Program activ</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                💾 {editingSchedule ? 'Actualizează' : 'Creează'} Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}