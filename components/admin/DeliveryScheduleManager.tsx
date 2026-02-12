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
  blockUntil?: string;
  blockedPaymentMethods: string[];
  blockedDeliveryMethods: string[];
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
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'blocking' | 'special-dates'>('schedule');
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

  const [blockRuleForm, setBlockRuleForm] = useState<Partial<BlockRule>>({
    name: '',
    isActive: true,
    blockNewOrders: false,
    blockReason: '',
    blockedPaymentMethods: [],
    blockedDeliveryMethods: [],
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
      const [schedulesRes, blockRulesRes, paymentMethodsRes, deliveryMethodsRes] = await Promise.all([
        apiClient.get('/api/admin/delivery-schedules'),
        apiClient.get('/api/admin/block-rules'),
        apiClient.get('/api/admin/payment-methods'),
        apiClient.get('/api/admin/delivery-settings')
      ]);
      
      setSchedules(schedulesRes.data || []);
      setFilteredSchedules(schedulesRes.data || []);
      setBlockRules(blockRulesRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);
      setDeliveryMethods(deliveryMethodsRes.data || []);
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
        { id: '1', name: 'Numerar', type: 'CASH', isActive: true },
        { id: '2', name: 'Card', type: 'CARD', isActive: true },
        { id: '3', name: 'Transfer Bancar', type: 'BANK_TRANSFER', isActive: true },
        { id: '4', name: 'Online', type: 'ONLINE', isActive: true }
      ]);
      setDeliveryMethods([
        { id: '1', name: 'Curier', type: 'courier', isActive: true },
        { id: '2', name: 'Ridicare Personală', type: 'pickup', isActive: true }
      ]);
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
      blockedPaymentMethods: [],
      blockedDeliveryMethods: [],
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
                          <p className="text-yellow-700 text-xs">{rule.blockedPaymentMethods.join(', ')}</p>
                        </div>
                      )}

                      {rule.blockedDeliveryMethods && rule.blockedDeliveryMethods.length > 0 && (
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-orange-800 font-medium">🚚 Metode livrare blocate:</p>
                          <p className="text-orange-700 text-xs">{rule.blockedDeliveryMethods.join(', ')}</p>
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
                          <p className="text-pink-800 font-medium">⏰ Blocat până la:</p>
                          <p className="text-pink-700 text-xs">{new Date(rule.blockUntil).toLocaleString('ro-RO')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingBlockRule(rule);
                        setBlockRuleForm(rule);
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
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    specialDate.isBlocked ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {specialDate.isBlocked ? 'Blocată' : 'Specială'}
                  </span>
                  <button
                    onClick={() => handleDeleteSpecialDate(schedules[0]?.id || '1', index)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    🗑️ Șterge
                  </button>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervale de Livrare
                </label>
                <div className="space-y-3">
                  {scheduleForm.deliveryTimeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ora început</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSlots = [...scheduleForm.deliveryTimeSlots];
                              newSlots[index].startTime = e.target.value;
                              setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                            }}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ora sfârșit</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSlots = [...scheduleForm.deliveryTimeSlots];
                              newSlots[index].endTime = e.target.value;
                              setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                            }}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max comenzi</label>
                          <input
                            type="number"
                            min="1"
                            value={slot.maxOrders || 1}
                            onChange={(e) => {
                              const newSlots = [...scheduleForm.deliveryTimeSlots];
                              newSlots[index].maxOrders = parseInt(e.target.value) || 1;
                              setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                            }}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSlots = scheduleForm.deliveryTimeSlots.filter((_, i) => i !== index);
                          setScheduleForm({...scheduleForm, deliveryTimeSlots: newSlots});
                        }}
                        className="text-red-500 hover:text-red-700 text-sm px-2"
                        disabled={scheduleForm.deliveryTimeSlots.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleForm({
                        ...scheduleForm,
                        deliveryTimeSlots: [
                          ...scheduleForm.deliveryTimeSlots,
                          { startTime: '09:00', endTime: '17:00', maxOrders: 10 }
                        ]
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ➕ Adaugă Interval
                  </button>
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
                    value={scheduleForm.advanceOrderDays || 0}
                    onChange={(e) => setScheduleForm({...scheduleForm, advanceOrderDays: parseInt(e.target.value) || 0})}
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
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={blockRuleForm.blockNewOrders || false}
                    onChange={(e) => setBlockRuleForm({...blockRuleForm, blockNewOrders: e.target.checked})}
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
                        placeholder="Ex: Concediu, renovări"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blochează până la (opțional)
                      </label>
                      <input
                        type="datetime-local"
                        value={blockRuleForm.blockUntil || ''}
                        onChange={(e) => setBlockRuleForm({...blockRuleForm, blockUntil: e.target.value})}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">🔒 Metode de Plată Blocate</h4>
                <div className="space-y-2">
                  {paymentMethods.filter(m => m.isActive).map(method => (
                    <label key={method.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blockRuleForm.blockedPaymentMethods?.includes(method.type) || false}
                        onChange={(e) => {
                          const blocked = blockRuleForm.blockedPaymentMethods || [];
                          if (e.target.checked) {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedPaymentMethods: [...blocked, method.type]
                            });
                          } else {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedPaymentMethods: blocked.filter(m => m !== method.type)
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
                <h4 className="font-medium mb-3">🚚 Metode de Livrare Blocate</h4>
                <div className="space-y-2">
                  {deliveryMethods.filter(m => m.isActive).map(method => (
                    <label key={method.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blockRuleForm.blockedDeliveryMethods?.includes(method.type) || false}
                        onChange={(e) => {
                          const blocked = blockRuleForm.blockedDeliveryMethods || [];
                          if (e.target.checked) {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedDeliveryMethods: [...blocked, method.type]
                            });
                          } else {
                            setBlockRuleForm({
                              ...blockRuleForm,
                              blockedDeliveryMethods: blocked.filter(m => m !== method.type)
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