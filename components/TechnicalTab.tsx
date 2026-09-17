import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Clock, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Wrench,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Search,
  DollarSign
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Client, TechStatus } from '../types';
import DateTimePicker from './DateTimePicker';

interface TechnicalTabProps {
  clients: Client[];
  onUpdateClient: (client: Client) => void;
}

const TechnicalTab: React.FC<TechnicalTabProps> = ({ clients, onUpdateClient }) => {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out clients that are "Refuzat"
  const techClients = useMemo(() => {
    return clients
      .filter(client => 
        client.status !== 'Refuzat' && 
        (client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         client.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const dateA = a.lastUpdateAt || a.createdAt;
        const dateB = b.lastUpdateAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [clients, searchTerm]);

  const handleUpdateTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      onUpdateClient(editingClient);
      setEditingClient(null);
    }
  };

  const getStatusColor = (status: TechStatus) => {
    switch (status) {
      case 'De Făcut': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'Demo în Lucru': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Demo Gata': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Modificări Finale': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Finalizat': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
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

  const demosByDay = useMemo(() => {
    const map: Record<string, Client[]> = {};
    techClients.forEach(client => {
      const dayKey = format(parseISO(client.demoDeadline), 'yyyy-MM-dd');
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(client);
    });
    return map;
  }, [techClients]);

  const stats = useMemo(() => {
    const total = techClients.length;
    const deFacut = techClients.filter(c => c.techStatus === 'De Făcut').length;
    const inLucru = techClients.filter(c => c.techStatus === 'Demo în Lucru').length;
    const gata = techClients.filter(c => c.techStatus === 'Demo Gata').length;
    const modificari = techClients.filter(c => c.techStatus === 'Modificări Finale').length;
    const finalizate = techClients.filter(c => c.techStatus === 'Finalizat').length;

    return { total, deFacut, inLucru, gata, modificari, finalizate };
  }, [techClients]);

  const statCards = [
    { title: 'Proiecte Active', value: stats.total, icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'De Făcut', value: stats.deFacut, icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { title: 'Demo în Lucru', value: stats.inLucru, icon: Wrench, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { title: 'Demo Gata', value: stats.gata, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Modificări Finale', value: stats.modificari, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Finalizate', value: stats.finalizate, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
            <Settings className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Management Technical</h2>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Dezvoltare și Implementare</p>
          </div>
        </div>
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
          className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all w-full shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {techClients.length > 0 ? (
          techClients.map((client, idx) => (
            <motion.div 
              key={`${client.id}-${idx}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all group cursor-pointer shadow-xl"
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
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(client.techStatus)}`}>
                  {client.techStatus}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-black mb-1 flex items-center tracking-widest">
                    <Clock className="w-3 h-3 mr-2 text-blue-400" />
                    Deadline Demo
                  </p>
                  <p className="text-zinc-100 text-base font-bold">
                    {format(parseISO(client.demoDeadline), 'dd MMMM, HH:mm', { locale: ro })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
                  <p className="text-[10px] text-zinc-500 uppercase font-black mb-1 flex items-center tracking-widest">
                    <FileText className="w-3 h-3 mr-2" />
                    Notițe Sales
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-2 italic leading-relaxed">
                    {client.notes || "Fără notițe de la sales"}
                  </p>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <p className="text-[10px] text-blue-400 uppercase font-black mb-1 flex items-center tracking-widest">
                    <Wrench className="w-3 h-3 mr-2" />
                    Notițe Technical
                  </p>
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {client.techNotes || "Adaugă notițe tehnice..."}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <AlertCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Nu există proiecte active pentru technical.</p>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Calendar Demos</h3>
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
              const dayDemos = demosByDay[dayKey] || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[60px] md:min-h-[120px] p-1.5 md:p-2 rounded-xl border transition-all cursor-pointer hover:border-blue-500/30 ${
                    isCurrentMonth ? 'bg-zinc-950/30' : 'bg-transparent opacity-30'
                  } ${
                    isToday ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-blue-400' : 'text-zinc-500'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayDemos.length > 0 && (
                      <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                    )}
                  </div>
                  <div className="hidden md:block space-y-1">
                    {dayDemos.map((client, i) => (
                      <div 
                        key={i}
                        className={`text-[8px] p-1.5 border rounded-lg font-medium leading-tight ${getStatusColor(client.techStatus)}`}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-bold">{format(parseISO(client.demoDeadline), 'HH:mm')}</span>
                        </div>
                        <div className="font-bold truncate">{client.businessName}</div>
                        <div className="truncate opacity-80 italic">{client.techStatus}</div>
                      </div>
                    ))}
                  </div>
                  <div className="md:hidden flex justify-center mt-1">
                    {dayDemos.length > 1 && (
                      <div className="text-[8px] font-bold text-blue-400">+{dayDemos.length}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Technical Modal */}
      <AnimatePresence>
        {editingClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingClient(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold">Update Technical: {editingClient.businessName}</h3>
                <button onClick={() => setEditingClient(null)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                <form onSubmit={handleUpdateTech} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Status Technical</label>
                      <select 
                        value={editingClient.techStatus}
                        onChange={e => setEditingClient({...editingClient, techStatus: e.target.value as TechStatus})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                      >
                        <option value="De Făcut">De Făcut</option>
                        <option value="Demo în Lucru">Demo în Lucru</option>
                        <option value="Demo Gata">Demo Gata</option>
                        <option value="Modificări Finale">Modificări Finale</option>
                        <option value="Finalizat">Finalizat</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <DateTimePicker 
                        label="Deadline Demo"
                        value={editingClient.demoDeadline}
                        onChange={val => setEditingClient({...editingClient, demoDeadline: val})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Preț (RON)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="number"
                          value={editingClient.price}
                          onChange={e => setEditingClient({...editingClient, price: parseFloat(e.target.value) || 0})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
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
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                          placeholder="https://google.com/maps/place/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 uppercase">Notițe Sales (Read-Only)</label>
                    <div className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-400 italic min-h-[80px] whitespace-pre-wrap">
                      {editingClient.notes || "Fără notițe de la sales."}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-blue-400 uppercase">Notițe Technical</label>
                    <textarea 
                      value={editingClient.techNotes}
                      onChange={e => setEditingClient({...editingClient, techNotes: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[150px]"
                      placeholder="Adaugă detalii tehnice, progres, cerințe specifice..."
                    />
                  </div>

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
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
                    >
                      Salvează Update
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Demos Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold">Demos: {format(selectedDay, 'dd MMMM', { locale: ro })}</h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {demosByDay[format(selectedDay, 'yyyy-MM-dd')]?.length > 0 ? (
                  demosByDay[format(selectedDay, 'yyyy-MM-dd')].sort((a, b) => new Date(a.demoDeadline).getTime() - new Date(b.demoDeadline).getTime()).map((client, i) => (
                    <div 
                      key={i} 
                      className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 cursor-pointer hover:border-blue-500/30"
                      onClick={() => {
                        setEditingClient(client);
                        setSelectedDay(null);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                          {format(parseISO(client.demoDeadline), 'HH:mm')}
                        </span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(client.techStatus)}`}>
                          {client.techStatus}
                        </div>
                      </div>
                      <h4 className="font-bold text-zinc-100">{client.businessName}</h4>
                      <p className="text-xs text-zinc-500 italic line-clamp-1">{client.notes}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Niciun demo programat pentru această zi.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechnicalTab;
