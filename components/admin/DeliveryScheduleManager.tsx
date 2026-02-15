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
  blockType: 'permanent' | 'temporary' | 'scheduled'; // Nou
  allowedPaymentMethods: string[];
  blockedPaymentMethods: string[]; // Nou - metode blocate
  allowedDeliveryMethods: string[];
  blockedDeliveryMethods: string[]; // Nou - metode blocate
  minimumOrderValue: number;
  maximumOrderValue?: number;
  // Blocare programată
  scheduledBlocks?: Array<{
    dayOfWeek?: number; // 0-6 (Duminică-Sâmbătă)
    startTime?: string;
    endTime?: string;
    reason?: string;
  }>;
}

interface BlockRule {
  id: string;
  name: string;
  isActive: boolean;
  blockNewOrders: boolean;
  blockReason: string;
  blockFrom?: string; // Data de la care începe blocarea
  blockUntil?: string; // Data până la care durează blocarea
  blockedPaymentMethods: string[];
  blockedDeliveryLocations: string[]; // Schimbat din blockedDeliveryMethods
  minimumOrderValue: number;
  maximumOrderValue?: number;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface DeliveryMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function DeliveryScheduleManager() {
  const [schedules, setSchedules] = useState<DeliverySchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<DeliverySchedule[]>([]);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [blockSettings, setBlockSettings] = useState<OrderBlockSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<any[]>([]); // Adăugat pentru locații
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'blocking'>('schedule');
  const [showModal, setShowModal] = useState(false);
  const [showBlockRuleModal, setShowBlockRuleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DeliverySchedule | null>(null);
  const [editingBlockRule, setEditingBlockRule] = useState<BlockRule | null>(null);
  
  // Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states - SIMPLIFICAT
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    deliveryDays: [] as number[], // Zilele când se fac livrări
    deliveryTimeSlots: [{ startTime: '09:00', endTime: '21:00', maxOrders: 999 }], // Interval de livrare
    isActive: true,
    blockOrdersAfter: '23:59', // Nu mai este relevant
    advanceOrderDays: 0 // Fără limită
  });

  const [specialDateForm, setSpecialDateForm] = useState({
    date: '',
    isBlocked: true,
    reason: ''
  });

  const [blockRuleForm, setBlockRuleForm] = useState<Partial<BlockRule>>({
    name: '',
    isActive: true,
    blockNewOrders: false,
    blockReason: '',
    blockFrom: '',
    blockUntil: '',
    blockedPaymentMethods: [],
    blockedDeliveryLocations: [], // Schimbat din blockedDeliveryMethods
    minimumOrderValue: 0
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
  
  // Filtrare și sortare pentru programe
  useEffect(() => {
    let filtered = [...schedules];

    // Filtrare după termen de căutare
    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrare după status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule =>
        statusFilter === 'active' ? schedule.isActive : !schedule.isActive
      );
    }

    // Sortare
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'days-asc':
          return a.deliveryDays.length - b.deliveryDays.length;
        case 'days-desc':
          return b.deliveryDays.length - a.deliveryDays.length;
        default:
          return 0;
      }
    });

    setFilteredSchedules(filtered);
  }, [schedules, searchTerm, statusFilter, sortBy]);

  const fetchData = async () => {
    try {
      const [schedulesRes, blockRulesRes, paymentMethodsRes, deliveryLocationsRes] = await Promise.all([
        apiClient.get('/api/admin/delivery-schedules'),
        apiClient.get('/api/admin/block-rules'),
        apiClient.get('/api/admin/payment-methods'),
        apiClient.get('/api/public/delivery-locations') // Endpoint public pentru locații
      ]);
      
      setSchedules(schedulesRes.data || []);
      setFilteredSchedules(schedulesRes.data || []);
      setBlockRules(blockRulesRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);
      setDeliveryLocations(deliveryLocationsRes.data || []); // Setează locațiile
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
      setFilteredSchedules([
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
      setBlockRules([]);
      setPaymentMethods([
        { id: 'mock-1', name: 'Numerar', type: 'CASH', isActive: true },
        { id: 'mock-2', name: 'Card', type: 'CARD', isActive: true },
        { id: 'mock-3', name: 'Transfer Bancar', type: 'BANK_TRANSFER', isActive: true },
        { id: 'mock-4', name: 'Online', type: 'ONLINE', isActive: true }
      ]);
      setDeliveryLocations([]); // Mock locații goale
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const scheduleData = {
        ...scheduleForm,
        specialDates: editingSchedule?.specialDates || []
      };

      if (editingSchedule) {
        // UPDATE existing schedule
        await apiClient.put(`/api/admin/delivery-schedules/${editingSchedule.id}`, scheduleData);
        alert('Programul de livrare a fost actualizat cu succes!');
      } else {
        // CREATE new schedule
        await apiClient.post('/api/admin/delivery-schedules', scheduleData);
        alert('Programul de livrare a fost creat cu succes!');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Eroare la salvarea programului de livrare');
    }
  };

  const handleUpdateBlockSettings = async () => {
    try {
      if (!blockSettings) {
        alert('Setările de blocare nu sunt încărcate');
        return;
      }
      
      console.log('Sending block settings:', blockSettings);
      const response = await apiClient.put('/api/admin/order-block-settings', blockSettings);
      console.log('Response:', response);
      alert('Setările de blocare au fost actualizate!');
    } catch (error: any) {
      console.error('Error updating block settings:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Eroare necunoscută';
      alert(`Eroare la actualizarea setărilor: ${errorMsg}`);
    }
  };

  const handleSaveBlockRule = async () => {
    try {
      if (!blockRuleForm.name) {
        alert('Numele regulii este obligatoriu');
        return;
      }

      const ruleData = {
        ...blockRuleForm,
        createdAt: editingBlockRule?.createdAt || new Date().toISOString()
      };

      if (editingBlockRule) {
        // UPDATE
        await apiClient.put(`/api/admin/block-rules/${editingBlockRule.id}`, ruleData);
        alert('Regula de blocare a fost actualizată!');
      } else {
        // CREATE
        await apiClient.post('/api/admin/block-rules', ruleData);
        alert('Regula de blocare a fost creată!');
      }

      setShowBlockRuleModal(false);
      resetBlockRuleForm();
      fetchData();
    } catch (error) {
      console.error('Error saving block rule:', error);
      alert('Eroare la salvarea regulii de blocare');
    }
  };

  const handleDeleteBlockRule = async (ruleId: string) => {
    try {
      if (!confirm('Sigur vrei să ștergi această regulă de blocare?')) {
        return;
      }

      await apiClient.delete(`/api/admin/block-rules/${ruleId}`);
      alert('Regula de blocare a fost ștearsă!');
      fetchData();
    } catch (error) {
      console.error('Error deleting block rule:', error);
      alert('Eroare la ștergerea regulii');
    }
  };

  const resetBlockRuleForm = () => {
    setBlockRuleForm({
      name: '',
      isActive: true,
      blockNewOrders: false,
      blockReason: '',
      blockFrom: '',
      blockUntil: '',
      blockedPaymentMethods: [],
      blockedDeliveryLocations: [], // Schimbat
      minimumOrderValue: 0
    });
    setEditingBlockRule(null);
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

  const handleDeleteSpecialDate = async (scheduleId: string, dateIndex: number) => {
    try {
      if (!confirm('Sigur vrei să ștergi această dată specială?')) {
        return;
      }
      
      await apiClient.delete(`/api/admin/delivery-schedules/${scheduleId}/special-dates/${dateIndex}`);
      fetchData();
      alert('Data specială a fost ștearsă!');
    } catch (error) {
      console.error('Error deleting special date:', error);
      alert('Eroare la ștergerea datei speciale');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      if (!confirm('Sigur vrei să ștergi acest program de livrare?')) {
        return;
      }
      
      await apiClient.delete(`/api/admin/delivery-schedules/${scheduleId}`);
      fetchData();
      alert('Programul de livrare a fost șters!');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Eroare la ștergerea programului');
    }
  };

  const resetForm = () => {
    setScheduleForm({
      name: '',
      deliveryDays: [],
      deliveryTimeSlots: [{ startTime: '09:00', endTime: '21:00', maxOrders: 999 }],
      isActive: true,
      blockOrdersAfter: '23:59',
      advanceOrderDays: 0
    });
    setEditingSchedule(null);
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    return days[dayIndex];
  };

  const getPaymentMethodNames = (methodIds: string[]) => {
    return methodIds
      .map(id => paymentMethods.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getDeliveryLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => deliveryLocations.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };
  
  // Paginare
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div>
          {/* Filtre și Căutare */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Căutare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Caută
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nume program..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtru Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toate statusurile</option>
                  <option value="active">Activ</option>
                  <option value="inactive">Inactiv</option>
                </select>
              </div>

              {/* Sortare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⬇️ Sortare
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">Nume (A → Z)</option>
                  <option value="name-desc">Nume (Z → A)</option>
                  <option value="days-asc">Zile (Puține → Multe)</option>
                  <option value="days-desc">Zile (Multe → Puține)</option>
                </select>
              </div>
            </div>

            {/* Butoane Reset */}
            {(searchTerm || statusFilter !== 'all' || sortBy !== 'name-asc') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('name-asc');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  🔄 Resetează Filtrele
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Programe de Livrare ({filteredSchedules.length} din {schedules.length})</h3>
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
            {paginatedSchedules.map(schedule => (
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-2">Intervale de livrare:</p>
                      <div className="space-y-1">
                        {schedule.deliveryTimeSlots.map((slot, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.put(`/api/admin/delivery-schedules/${schedule.id}`, {
                            ...schedule,
                            isActive: !schedule.isActive
                          });
                          fetchData();
                        } catch (error) {
                          console.error('Error toggling schedule:', error);
                          alert('Eroare la schimbarea statusului');
                        }
                      }}
                      className={`px-3 py-1 rounded transition text-sm font-medium ${
                        schedule.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={schedule.isActive ? 'Dezactivează' : 'Activează'}
                    >
                      {schedule.isActive ? '✓ Activ' : '○ Inactiv'}
                    </button>
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
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginare */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                ← Anterior
              </button>
              
              <span className="text-sm text-gray-600">
                Pagina {currentPage} din {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Următorul →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Blocking Tab */}
      {activeTab === 'blocking' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Reguli de Blocare Comenzi</h3>
            <button
              onClick={() => {
                resetBlockRuleForm();
                setShowBlockRuleModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              ➕ Adaugă Regulă
            </button>
          </div>

          {/* Lista reguli */}
          <div className="space-y-4">
            {blockRules.map(rule => (
              <div key={rule.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">{rule.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Activă' : 'Inactivă'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {rule.blockNewOrders && (
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-red-800 font-medium">🚫 Blochează toate comenzile</p>
                          <p className="text-red-600 text-xs">{rule.blockReason}</p>
                        </div>
                      )}

                      {rule.blockedPaymentMethods && rule.blockedPaymentMethods.length > 0 && (
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-yellow-800 font-medium">💳 Metode plată blocate:</p>
                          <p className="text-yellow-700 text-xs">{getPaymentMethodNames(rule.blockedPaymentMethods)}</p>
                        </div>
                      )}

                      {rule.blockedDeliveryLocations && rule.blockedDeliveryLocations.length > 0 && (
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-orange-800 font-medium">📍 Locații de livrare blocate:</p>
                          <p className="text-orange-700 text-xs">{getDeliveryLocationNames(rule.blockedDeliveryLocations)}</p>
                        </div>
                      )}

                      {rule.minimumOrderValue > 0 && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-blue-800 font-medium">💰 Valoare minimă:</p>
                          <p className="text-blue-700 text-xs">{rule.minimumOrderValue} RON</p>
                        </div>
                      )}

                      {rule.maximumOrderValue && (
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-800 font-medium">💰 Valoare maximă:</p>
                          <p className="text-purple-700 text-xs">{rule.maximumOrderValue} RON</p>
                        </div>
                      )}

                      {rule.blockUntil && (
                        <div className="bg-pink-50 p-2 rounded">
                          <p className="text-pink-800 font-medium">⏰ Perioadă blocare:</p>
                          <p className="text-pink-700 text-xs">
                            {rule.blockFrom ? `De la: ${new Date(rule.blockFrom).toLocaleString('ro-RO')}` : ''}
                            {rule.blockFrom && <br />}
                            Până la: {new Date(rule.blockUntil).toLocaleString('ro-RO')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        console.log('Editing rule:', rule);
                        setEditingBlockRule(rule);
                        setBlockRuleForm({
                          ...rule,
                          blockNewOrders: rule.blockNewOrders || false,
                          blockReason: rule.blockReason || '',
                          blockFrom: rule.blockFrom || '',
                          blockUntil: rule.blockUntil || '',
                          blockedPaymentMethods: rule.blockedPaymentMethods || [],
                          blockedDeliveryLocations: rule.blockedDeliveryLocations || [], // Schimbat
                          minimumOrderValue: rule.minimumOrderValue || 0,
                          maximumOrderValue: rule.maximumOrderValue || undefined
                        });
                        setShowBlockRuleModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      ✏️ Editează
                    </button>
                    <button
                      onClick={() => handleDeleteBlockRule(rule.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {blockRules.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nu există reguli de blocare create.</p>
                <p className="text-sm text-gray-400 mt-2">Apasă "Adaugă Regulă" pentru a crea prima regulă.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal pentru creare/editare program - SIMPLIFICAT */}
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

            <div className="space-y-6">
              {/* Nume Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Nume Program *
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({...scheduleForm, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Program Standard, Program Weekend"
                  required
                />
              </div>

              {/* Zile de Livrare */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📅 Zile când se fac livrări *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={scheduleForm.deliveryDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScheduleForm({
                              ...scheduleForm,
                              deliveryDays: [...scheduleForm.deliveryDays, day].sort()
                            });
                          } else {
                            setScheduleForm({
                              ...scheduleForm,
                              deliveryDays: scheduleForm.deliveryDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{getDayName(day)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Interval de Livrare */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ⏰ Interval de ore pentru livrare *
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">De la ora:</label>
                      <input
                        type="time"
                        value={scheduleForm.deliveryTimeSlots[0]?.startTime || '09:00'}
                        onChange={(e) => {
                          const newSlots = [...scheduleForm.deliveryTimeSlots];
                          newSlots[0] = { ...newSlots[0], startTime: e.target.value };
                          setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                        }}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Până la ora:</label>
                      <input
                        type="time"
                        value={scheduleForm.deliveryTimeSlots[0]?.endTime || '21:00'}
                        onChange={(e) => {
                          const newSlots = [...scheduleForm.deliveryTimeSlots];
                          newSlots[0] = { ...newSlots[0], endTime: e.target.value };
                          setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                        }}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Exemplu: Livrările se fac între 09:00 - 21:00
                  </p>
                </div>
              </div>

              {/* Date Speciale - Zile BLOCATE */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🚫 Zile când NU se pot plasa comenzi (opțional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Adaugă date când comenzile sunt blocate (ex: sărbători, concedii)
                </p>
                
                {/* Formular adăugare dată blocată */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Data blocată:</label>
                      <input
                        type="date"
                        value={specialDateForm.date}
                        onChange={(e) => setSpecialDateForm({...specialDateForm, date: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Motiv:</label>
                      <input
                        type="text"
                        value={specialDateForm.reason}
                        onChange={(e) => setSpecialDateForm({...specialDateForm, reason: e.target.value})}
                        placeholder="Ex: Crăciun, Concediu"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (specialDateForm.date) {
                        const currentDates = editingSchedule?.specialDates || [];
                        const newDate = {
                          date: specialDateForm.date,
                          isBlocked: true,
                          reason: specialDateForm.reason || 'Zi blocată'
                        };
                        
                        if (editingSchedule) {
                          editingSchedule.specialDates = [...currentDates, newDate];
                        }
                        
                        setSpecialDateForm({ date: '', isBlocked: true, reason: '' });
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    ➕ Adaugă Dată Blocată
                  </button>
                </div>

                {/* Lista date blocate */}
                {editingSchedule?.specialDates && editingSchedule.specialDates.filter(d => d.isBlocked).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Date blocate:</p>
                    {editingSchedule.specialDates.filter(d => d.isBlocked).map((date, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-red-50 p-2 rounded border border-red-200">
                        <div>
                          <span className="text-sm font-medium">
                            {new Date(date.date).toLocaleDateString('ro-RO', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          {date.reason && <span className="text-xs text-gray-600 ml-2">({date.reason})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingSchedule) {
                              editingSchedule.specialDates = editingSchedule.specialDates.filter((_, i) => i !== idx);
                              setScheduleForm({...scheduleForm}); // Force re-render
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Șterge
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Activ */}
              <div className="border-t pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isActive}
                    onChange={(e) => setScheduleForm({...scheduleForm, isActive: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">✅ Program activ</span>
                </label>
              </div>
            </div>

            {/* Butoane */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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

      {/* Modal pentru creare/editare regulă de blocare */}
      {showBlockRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingBlockRule ? 'Editează Regulă' : 'Adaugă Regulă Nouă'}
              </h3>
              <button
                onClick={() => {
                  setShowBlockRuleModal(false);
                  resetBlockRuleForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Regulă *
                </label>
                <input
                  type="text"
                  value={blockRuleForm.name || ''}
                  onChange={(e) => setBlockRuleForm({...blockRuleForm, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Blocare Weekend, Restricții Plată Cash"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={blockRuleForm.isActive || false}
                    onChange={(e) => setBlockRuleForm({...blockRuleForm, isActive: e.target.checked})}
                  />
                  <span className="font-medium">Regulă activă</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center space-x-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockRuleForm.blockNewOrders || false}
                    onChange={(e) => {
                      console.log('Checkbox clicked, new value:', e.target.checked);
                      setBlockRuleForm({...blockRuleForm, blockNewOrders: e.target.checked});
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium">Blochează toate comenzile noi</span>
                </label>

                {blockRuleForm.blockNewOrders && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motiv blocare
                      </label>
                      <input
                        type="text"
                        value={blockRuleForm.blockReason || ''}
                        onChange={(e) => setBlockRuleForm({...blockRuleForm, blockReason: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Concediu, renovări, eveniment special"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Perioadă de Blocare - OBLIGATORIE */}
              <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-3">📅 Perioadă de Blocare *</h5>
                  <p className="text-sm text-blue-700 mb-3">
                    Setează intervalul când regulile de blocare sunt active (obligatoriu)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Blochează de la (Data și Ora) *
                      </label>
                      <input
                        type="datetime-local"
                        value={blockRuleForm.blockFrom || ''}
                        onChange={(e) => setBlockRuleForm({...blockRuleForm, blockFrom: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: Joi 20:00 (începutul blocării)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Blochează până la (Data și Ora) *
                      </label>
                      <input
                        type="datetime-local"
                        value={blockRuleForm.blockUntil || ''}
                        onChange={(e) => setBlockRuleForm({...blockRuleForm, blockUntil: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: Sâmbătă 09:00 (sfârșitul blocării)</p>
                    </div>
                  </div>

                  {blockRuleForm.blockFrom && blockRuleForm.blockUntil && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-sm font-medium text-blue-900">
                        ✓ Regulile vor fi active:
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        De la: <strong>{new Date(blockRuleForm.blockFrom).toLocaleString('ro-RO', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</strong>
                      </p>
                      <p className="text-sm text-blue-700">
                        Până la: <strong>{new Date(blockRuleForm.blockUntil).toLocaleString('ro-RO', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Durată: {Math.ceil((new Date(blockRuleForm.blockUntil).getTime() - new Date(blockRuleForm.blockFrom).getTime()) / (1000 * 60 * 60))} ore
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">🔒 Metode de Plată Blocate</h4>
                <div className="space-y-2">
                  {paymentMethods.filter(m => m.isActive).map(method => (
                    <label key={method.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blockRuleForm.blockedPaymentMethods?.includes(method.id) || false}
                        onChange={(e) => {
                          const blocked = blockRuleForm.blockedPaymentMethods || [];
                          if (e.target.checked) {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedPaymentMethods: [...blocked, method.id]
                            });
                          } else {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedPaymentMethods: blocked.filter(m => m !== method.id)
                            });
                          }
                        }}
                      />
                      <span>{method.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">📍 Locații de Livrare Blocate</h4>
                <div className="space-y-2">
                  {deliveryLocations.map(location => (
                    <label key={location.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blockRuleForm.blockedDeliveryLocations?.includes(location.id) || false}
                        onChange={(e) => {
                          const blocked = blockRuleForm.blockedDeliveryLocations || [];
                          if (e.target.checked) {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedDeliveryLocations: [...blocked, location.id]
                            });
                          } else {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedDeliveryLocations: blocked.filter(l => l !== location.id)
                            });
                          }
                        }}
                      />
                      <span>{location.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">💰 Restricții Valoare</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valoare minimă (RON)
                    </label>
                    <input
                      type="number"
                      value={blockRuleForm.minimumOrderValue || 0}
                      onChange={(e) => setBlockRuleForm({
                        ...blockRuleForm,
                        minimumOrderValue: parseFloat(e.target.value) || 0
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valoare maximă (RON)
                    </label>
                    <input
                      type="number"
                      value={blockRuleForm.maximumOrderValue || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlockRuleForm({
                          ...blockRuleForm,
                          maximumOrderValue: val ? parseFloat(val) : undefined
                        });
                      }}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowBlockRuleModal(false);
                    resetBlockRuleForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSaveBlockRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  💾 Salvează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}