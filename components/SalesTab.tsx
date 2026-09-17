import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Phone, 
  MessageCircle, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  Trash2,
  Clock,
  Briefcase,
  User,
  DollarSign,
  BarChart3,
  FileText,
  X,
  Settings,
  CheckCircle2,
  Search
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Client, ClientStatus, Appointment } from '../types';
import DateTimePicker from './DateTimePicker';

interface SalesTabProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const SalesTab: React.FC<SalesTabProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [appointmentClient, setAppointmentClient] = useState<Client | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for New Client
  const [formData, setFormData] = useState({
    businessName: '',
    clientName: '',
    phone: '',
    status: 'Lead Nou' as ClientStatus,
    price: '',
    probability: 50,
    demoDeadline: '',
    notes: '',
    gbpLink: ''
  });

  // Form State for Appointment
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    title: ''
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const isTerminal = formData.status === 'Finalizat' || formData.status === 'Refuzat';
    const newClient: Client = {
      id: uuidv4(),
      businessName: formData.businessName,
      clientName: formData.clientName,
      phone: formData.phone,
      status: formData.status,
      techStatus: 'De Făcut',
      price: parseFloat(formData.price) || 0,
      probability: formData.probability,
      demoDeadline: formData.demoDeadline ? new Date(formData.demoDeadline).toISOString() : new Date().toISOString(),
      notes: formData.notes,
      gbpLink: formData.gbpLink,
      techNotes: '',
      createdAt: new Date().toISOString(),
      lastUpdateAt: new Date().toISOString(),
      lastUpdateType: 'general',
      closedAt: isTerminal ? new Date().toISOString() : undefined,
      appointments: []
    };
    onAddClient(newClient);
    setIsAdding(false);
    setFormData({
      businessName: '',
      clientName: '',
      phone: '',
      status: 'Lead Nou',
      price: '',
      probability: 50,
      demoDeadline: '',
      notes: '',
      gbpLink: ''
    });
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      onUpdateClient(editingClient);
      setEditingClient(null);
    }
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (appointmentClient && appointmentData.date && appointmentData.title) {
      const newAppointment: Appointment = {
        id: uuidv4(),
        date: new Date(appointmentData.date).toISOString(),
        title: appointmentData.title
      };
      const updatedClient = {
        ...appointmentClient,
        appointments: [...appointmentClient.appointments, newAppointment]
      };
      onUpdateClient(updatedClient);
      setAppointmentClient(null);
      setAppointmentData({ date: '', title: '' });
    }
  };

  const getWhatsAppUrl = (phone: string) => {
    if (!phone || typeof phone !== 'string') return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '#';
    if (cleaned.startsWith('0')) cleaned = '40' + cleaned.substring(1);
    else if (!cleaned.startsWith('40')) cleaned = '40' + cleaned;
    return `https://wa.me/${cleaned}`;
  };

  const getTelUrl = (phone: string) => {
    if (!phone || typeof phone !== 'string') return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '#';
    if (cleaned.startsWith('0')) cleaned = '40' + cleaned.substring(1);
    else if (!cleaned.startsWith('40')) cleaned = '40' + cleaned;
    return `tel:+${cleaned}`;
  };

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return 'Dată invalidă';
      return format(date, formatStr, { locale: ro });
    } catch (e) {
      return 'Eroare dată';
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, { client: Client; appointment: Appointment }[]> = {};
    clients.forEach(client => {
      client.appointments.forEach(app => {
        const dayKey = format(parseISO(app.date), 'yyyy-MM-dd');
        if (!map[dayKey]) map[dayKey] = [];
        map[dayKey].push({ client, appointment: app });
      });
    });
    return map;
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients
      .filter(client => 
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = a.lastUpdateAt || a.createdAt;
        const dateB = b.lastUpdateAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [clients, searchTerm]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status !== 'Finalizat' && c.status !== 'Refuzat').length;
    const inNegotiation = clients.filter(c => c.status === 'În Negociere').length;
    const inProgress = clients.filter(c => c.status === 'Proiect În Lucru').length;
    const potentialRevenue = clients
      .filter(c => c.status !== 'Finalizat' && c.status !== 'Refuzat')
      .reduce((acc, curr) => acc + curr.price, 0);
    const finalized = clients.filter(c => c.status === 'Finalizat').length;

    return { total, active, inNegotiation, inProgress, potentialRevenue, finalized };
  }, [clients]);

  const statCards = [
    { title: 'Total Clienți', value: stats.total, icon: User, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { title: 'Lead-uri Active', value: stats.active, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'În Negociere', value: stats.inNegotiation, icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Proiecte în Lucru', value: stats.inProgress, icon: BarChart3, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { title: 'Venit Potențial', value: `${stats.potentialRevenue.toLocaleString()} RON`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Finalizate', value: stats.finalized, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
            <Briefcase className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Management Sales</h2>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Pipeline și Clienți</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-purple-900/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Client Nou</span>
        </button>
      </div>

      {/* Stats Grid - Analytics Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className={`${card.bg} p-3 rounded-xl w-fit mb-4`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{card.title}</p>
            <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* Search Bar - Moved here */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text"
          placeholder="Caută business sau client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:ring-2 focus:ring-purple-500/50 outline-none transition-all w-full shadow-inner"
        />
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold">Adaugă Client Nou</h3>
                <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                <form onSubmit={handleAddClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Nume Business</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          required
                          type="text"
                          value={formData.businessName}
                          onChange={e => setFormData({...formData, businessName: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="Ex: Tech Solutions SRL"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Nume Client</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          required
                          type="text"
                          value={formData.clientName}
                          onChange={e => setFormData({...formData, clientName: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="Ex: Ion Popescu"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Telefon</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="07xxxxxxxx"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Stadiu</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all appearance-none"
                      >
                        <option value="Lead Nou">Lead Nou</option>
                        <option value="Demo Trimis">Demo Trimis</option>
                        <option value="În Negociere">În Negociere</option>
                        <option value="Proiect În Lucru">Proiect În Lucru</option>
                        <option value="Finalizat">Finalizat</option>
                        <option value="Refuzat">Refuzat</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Preț Estimativ</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="number"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <DateTimePicker 
                        label="Deadline Demo (Zi, Lună, Oră)"
                        value={formData.demoDeadline}
                        onChange={val => setFormData({...formData, demoDeadline: val})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Profil Google (GBP Link)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="url"
                          value={formData.gbpLink}
                          onChange={e => setFormData({...formData, gbpLink: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="https://google.com/maps/place/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Probabilitate Închidere</label>
                      <span className="text-xs font-bold text-purple-400">{formData.probability}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={e => setFormData({...formData, probability: parseInt(e.target.value)})}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Notițe Progres</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <textarea 
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all min-h-[100px]"
                        placeholder="Detalii despre discuții, cerințe..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-all"
                    >
                      Anulează
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20"
                    >
                      Salvează Client
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Client Modal */}
        {editingClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold">Editează Client: {editingClient.businessName}</h3>
                <button onClick={() => setEditingClient(null)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Stadiu</label>
                      <select 
                        value={editingClient.status}
                        onChange={e => {
                          const newStatus = e.target.value as ClientStatus;
                          const isTerminal = newStatus === 'Finalizat' || newStatus === 'Refuzat';
                          setEditingClient({
                            ...editingClient, 
                            status: newStatus,
                            closedAt: isTerminal ? (editingClient.closedAt || new Date().toISOString()) : undefined
                          });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all appearance-none"
                      >
                        <option value="Lead Nou">Lead Nou</option>
                        <option value="Demo Trimis">Demo Trimis</option>
                        <option value="În Negociere">În Negociere</option>
                        <option value="Proiect În Lucru">Proiect În Lucru</option>
                        <option value="Finalizat">Finalizat</option>
                        <option value="Refuzat">Refuzat</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Probabilitate Închidere</label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={editingClient.probability}
                          onChange={e => setEditingClient({...editingClient, probability: parseInt(e.target.value)})}
                          className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-xs font-bold text-purple-400 w-8">{editingClient.probability}%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Preț (RON)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="number"
                          value={editingClient.price}
                          onChange={e => setEditingClient({...editingClient, price: parseFloat(e.target.value) || 0})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Profil Google (GBP Link)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="url"
                          value={editingClient.gbpLink || ''}
                          onChange={e => setEditingClient({...editingClient, gbpLink: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="https://google.com/maps/place/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Notițe Progres (Sales)</label>
                    <textarea 
                      value={editingClient.notes}
                      onChange={e => setEditingClient({...editingClient, notes: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all min-h-[100px]"
                      placeholder="Adaugă notițe noi..."
                    />
                  </div>

                  {editingClient.techNotes && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-emerald-500 uppercase">Notițe Technical (Read-Only)</label>
                      <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl py-2.5 px-4 text-sm text-zinc-300 min-h-[60px] whitespace-pre-wrap italic">
                        {editingClient.techNotes}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-all"
                    >
                      Anulează
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20"
                    >
                      Actualizează Client
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Appointment Modal */}
        {appointmentClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Programează Apel: {appointmentClient.businessName}</h3>
                <button onClick={() => setAppointmentClient(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddAppointment} className="p-6 space-y-4 overflow-visible">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Titlu Programare</label>
                  <input 
                    required
                    type="text"
                    value={appointmentData.title}
                    onChange={e => setAppointmentData({...appointmentData, title: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                    placeholder="Ex: Follow-up Demo"
                  />
                </div>
                <div className="space-y-1.5">
                  <DateTimePicker 
                    label="Data și Ora"
                    value={appointmentData.date}
                    onChange={val => setAppointmentData({...appointmentData, date: val})}
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <button 
                    type="button"
                    onClick={() => setAppointmentClient(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-all"
                  >
                    Anulează
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20"
                  >
                    Confirmă Programarea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Appointments Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold">Programări: {format(selectedDay, 'dd MMMM', { locale: ro })}</h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {appointmentsByDay[format(selectedDay, 'yyyy-MM-dd')]?.length > 0 ? (
                  appointmentsByDay[format(selectedDay, 'yyyy-MM-dd')].sort((a, b) => new Date(a.appointment.date).getTime() - new Date(b.appointment.date).getTime()).map((item, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-bold">
                          {safeFormatDate(item.appointment.date, 'HH:mm')}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">{item.client.phone || 'N/A'}</span>
                      </div>
                      <h4 className="font-bold text-zinc-100">{item.client.businessName}</h4>
                      <p className="text-sm text-zinc-400 italic">"{item.appointment.title}"</p>
                      <div className="flex space-x-2 pt-2">
                        <a 
                          href={getTelUrl(item.client.phone)}
                          className={`flex-1 flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-400 py-2 rounded-lg text-xs font-bold transition-all ${!item.client.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Phone className="w-3 h-3" />
                          <span>Sună</span>
                        </a>
                        <a 
                          href={getWhatsAppUrl(item.client.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-400 py-2 rounded-lg text-xs font-bold transition-all ${!item.client.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Nicio programare pentru această zi.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredClients.map((client, idx) => {
          const latestAppointment = client.appointments.length > 0 
            ? [...client.appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;

          return (
            <motion.div 
              key={`${client.id}-${idx}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all group cursor-pointer shadow-xl relative"
              onClick={() => setEditingClient(client)}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-zinc-100 text-2xl tracking-tight mb-1">{client.businessName}</h4>
                  <div className="flex flex-col space-y-1">
                    <p className="text-zinc-500 text-sm flex items-center font-medium">
                      <User className="w-4 h-4 mr-2" />
                      {client.clientName}
                    </p>
                    {client.gbpLink && (
                      <a 
                        href={client.gbpLink} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 text-xs flex items-center hover:underline font-bold"
                      >
                        <Search className="w-3 h-3 mr-2" />
                        Google Business Profile
                      </a>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                  client.status === 'Finalizat' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  client.status === 'Refuzat' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {client.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-black mb-1 tracking-widest">Preț</p>
                  <p className="text-zinc-100 font-black text-lg">{client.price.toLocaleString()} RON</p>
                </div>
                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-black mb-1 tracking-widest">Deadline Demo</p>
                  <p className="text-zinc-100 text-sm font-bold">
                    {safeFormatDate(client.demoDeadline, 'dd MMM, HH:mm')}
                  </p>
                </div>
              </div>

              {/* Appointment Section */}
              <div 
                className="mb-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] text-purple-400 uppercase font-black flex items-center tracking-widest">
                    <Clock className="w-3 h-3 mr-2" />
                    Următorul Apel
                  </p>
                  <button 
                    onClick={() => setAppointmentClient(client)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-black underline tracking-wider"
                  >
                    Programează
                  </button>
                </div>
                {latestAppointment ? (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-100 font-black">{latestAppointment.title}</p>
                    <p className="text-xs text-zinc-400 flex items-center font-medium">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {safeFormatDate(latestAppointment.date, 'dd MMMM, HH:mm')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Nicio programare stabilită</p>
                )}
              </div>

              {/* Technical Status & Notes Preview */}
              <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] text-emerald-400 uppercase font-black flex items-center tracking-widest">
                    <Settings className="w-3 h-3 mr-2" />
                    Status Technical
                  </p>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{client.techStatus}</span>
                </div>
                {client.techNotes ? (
                  <p className="text-xs text-zinc-400 line-clamp-2 italic leading-relaxed">"{client.techNotes}"</p>
                ) : (
                  <p className="text-xs text-zinc-600 italic">Nicio notiță tehnică</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50" onClick={(e) => e.stopPropagation()}>
                <div className="flex space-x-3">
                  <a 
                    href={getTelUrl(client.phone)}
                    className="p-3 bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-400 rounded-2xl transition-all text-zinc-400 shadow-lg"
                    title="Apelează"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <a 
                    href={getWhatsAppUrl(client.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-400 rounded-2xl transition-all text-zinc-400 shadow-lg"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    Adăugat: {safeFormatDate(client.createdAt, 'dd.MM.yyyy')}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClient(client.id);
                    }}
                    className="p-2.5 text-zinc-600 hover:text-red-400 transition-all"
                    title="Șterge Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Calendar Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Calendar Programări</h3>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-zinc-300 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ro })}
            </span>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((day, idx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDay[dayKey] || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[60px] md:min-h-[120px] p-1.5 md:p-2 rounded-xl border transition-all cursor-pointer hover:border-purple-500/30 ${
                    isCurrentMonth ? 'bg-zinc-950/30' : 'bg-transparent opacity-30'
                  } ${
                    isToday ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-zinc-800/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-purple-400' : 'text-zinc-500'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                    )}
                  </div>
                  <div className="hidden md:block space-y-1">
                    {dayAppointments.map((item, i) => (
                      <div 
                        key={i}
                        className="text-[8px] p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 font-medium leading-tight"
                        title={`${item.client.businessName} - ${item.appointment.title} (${item.client.phone})`}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-bold">{safeFormatDate(item.appointment.date, 'HH:mm')}</span>
                          <span className="opacity-50">{item.client.phone || 'N/A'}</span>
                        </div>
                        <div className="font-bold truncate">{item.client.businessName}</div>
                        <div className="truncate opacity-80 italic">{item.appointment.title}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mobile dot indicator if many appointments */}
                  <div className="md:hidden flex justify-center mt-1">
                    {dayAppointments.length > 1 && (
                      <div className="text-[8px] font-bold text-purple-400">+{dayAppointments.length}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTab;
