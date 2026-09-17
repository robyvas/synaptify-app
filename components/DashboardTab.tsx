import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Wrench, 
  DollarSign, 
  ArrowUpRight,
  TrendingUp,
  Bell,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subDays, isAfter, addDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Client, Transaction } from '../types';

interface DashboardTabProps {
  clients: Client[];
  transactions: Transaction[];
  onSwitchTab: (tab: 'financiar' | 'sales' | 'technical') => void;
  currentMonthIncome?: number;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ clients, transactions, onSwitchTab }) => {
  const stats = useMemo(() => {
    // ... (existing stats logic)
    const activeLeads = clients.filter(c => c.status !== 'Refuzat' && c.status !== 'Finalizat').length;
    const demosToDo = clients.filter(c => c.techStatus === 'De Făcut' && c.status !== 'Refuzat').length;
    const projectsInProgress = clients.filter(c => c.status === 'Proiect În Lucru').length;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthlyIncome = transactions
      .filter(t => {
        try {
          if (t.type === 'expense') return false;
          if (!t.date) return false;
          const date = parseISO(t.date);
          if (isNaN(date.getTime())) return false;
          return isWithinInterval(date, { start, end });
        } catch (e) {
          return false;
        }
      })
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return { activeLeads, demosToDo, projectsInProgress, monthlyIncome };
  }, [clients, transactions]);

  const notifications = useMemo(() => {
    const list: { id: string; type: 'client' | 'transaction' | 'status' | 'appointment'; title: string; subtitle: string; date: Date; icon: any; color: string }[] = [];
    const recentThreshold = subDays(new Date(), 30); // Last 30 days

    // New Clients
    clients.forEach(c => {
      // Recent Updates (Status, Notes, etc.)
      if (c.lastUpdateAt && c.lastUpdateType) {
        const updated = parseISO(c.lastUpdateAt);
        if (isAfter(updated, recentThreshold)) {
          let title = 'Actualizare Client';
          let icon = Bell;
          let color = 'text-blue-400';
          let subtitle = c.businessName;

          if (c.lastUpdateType === 'status') {
            title = 'Status Actualizat';
            icon = TrendingUp;
            color = 'text-emerald-400';
            subtitle = `${c.businessName}: ${c.status}`;
          } else if (c.lastUpdateType === 'notes') {
            title = 'Notiță Nouă';
            icon = Bell;
            color = 'text-orange-400';
            subtitle = `${c.businessName}: Notiță adăugată`;
          } else if (c.lastUpdateType === 'techStatus') {
            title = 'Status Tehnic Actualizat';
            icon = Wrench;
            color = 'text-blue-400';
            subtitle = `${c.businessName}: ${c.techStatus}`;
          } else if (c.lastUpdateType === 'techNotes') {
            title = 'Notiță Tehnică Nouă';
            icon = Wrench;
            color = 'text-indigo-400';
            subtitle = `${c.businessName}: Notiță tehnică adăugată`;
          } else if (c.lastUpdateType === 'price') {
            title = 'Preț Actualizat';
            icon = DollarSign;
            color = 'text-emerald-400';
            subtitle = `${c.businessName}: ${c.price.toLocaleString()} RON`;
          } else if (c.lastUpdateType === 'general') {
            title = 'Modificare Client';
            icon = Bell;
            color = 'text-zinc-400';
            subtitle = `${c.businessName}: Date actualizate`;
          }

          list.push({
            id: `update-${c.id}-${c.lastUpdateAt}`,
            type: 'status',
            title,
            subtitle,
            date: updated,
            icon,
            color
          });
        }
      }

      const created = parseISO(c.createdAt);
      if (isAfter(created, recentThreshold)) {
        list.push({
          id: `new-client-${c.id}`,
          type: 'client',
          title: 'Client Nou Adăugat',
          subtitle: `${c.businessName} (${c.clientName})`,
          date: created,
          icon: PlusCircle,
          color: 'text-purple-400'
        });
      }

      if (c.closedAt) {
        const closed = parseISO(c.closedAt);
        if (isAfter(closed, recentThreshold)) {
          list.push({
            id: `closed-client-${c.id}`,
            type: 'status',
            title: c.status === 'Finalizat' ? 'Proiect Finalizat' : 'Lead Refuzat',
            subtitle: c.businessName,
            date: closed,
            icon: c.status === 'Finalizat' ? CheckCircle2 : AlertCircle,
            color: c.status === 'Finalizat' ? 'text-emerald-400' : 'text-red-400'
          });
        }
      }

      // Appointments
      c.appointments.forEach(app => {
        const appDate = parseISO(app.date);
        // Show upcoming appointments or recently added ones (we don't have created_at for appointments, so we show upcoming)
        if (isAfter(appDate, subDays(new Date(), 1)) && isAfter(addDays(new Date(), 7), appDate)) {
          list.push({
            id: `app-${app.id}`,
            type: 'appointment',
            title: 'Programare Viitoare',
            subtitle: `${c.businessName}: ${app.title}`,
            date: appDate,
            icon: Clock,
            color: 'text-blue-400'
          });
        }
      });
    });

    // New Transactions (Income & Expenses)
    transactions.forEach(t => {
      const date = parseISO(t.date);
      if (isAfter(date, recentThreshold)) {
        const isExp = t.type === 'expense';
        list.push({
          id: `trans-${t.id}`,
          type: 'transaction',
          title: isExp ? 'Cheltuială Nouă' : 'Încasare Nouă',
          subtitle: `${t.title} - ${isExp ? '-' : '+'}${t.amount.toLocaleString()} lei`,
          date: date,
          icon: isExp ? MinusCircle : DollarSign,
          color: isExp ? 'text-rose-400' : 'text-emerald-400'
        });
      }
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);
  }, [clients, transactions]);

  const cards = [
    {
      title: 'Lead-uri Active',
      value: stats.activeLeads,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      tab: 'sales' as const
    },
    {
      title: 'Demo-uri de Făcut',
      value: stats.demosToDo,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      tab: 'technical' as const
    },
    {
      title: 'Proiecte în Lucru',
      value: stats.projectsInProgress,
      icon: Wrench,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      tab: 'sales' as const
    },
    {
      title: 'Venit Luna Curentă',
      value: `${stats.monthlyIncome.toLocaleString()} RON`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      tab: 'financiar' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Notifications & Welcome */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Panel - Single Column, Longer Items */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wider">Activitate Recentă</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 uppercase tracking-widest">Activitate Recentă</span>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length > 0 ? notifications.map((n, idx) => (
              <div key={`${n.id}-${idx}`} className="flex items-center space-x-4 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-all group">
                <div className={`p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 ${n.color} shadow-lg shadow-black/20`}>
                  <n.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-zinc-100 truncate">{n.title}</p>
                    <div className="flex items-center text-[10px] text-zinc-600 font-medium whitespace-nowrap ml-4">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(n.date, 'dd MMM, HH:mm', { locale: ro })}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{n.subtitle}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-sm text-zinc-600 italic">Nicio activitate recentă înregistrată.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/20 to-zinc-950 border border-purple-500/10 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-center"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white mb-3 tracking-tight">Salutare!</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Astăzi este <span className="text-zinc-100 font-bold">{format(new Date(), 'EEEE, dd MMMM', { locale: ro })}</span>. 
            </p>
            <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status Rapid</p>
              <p className="text-sm text-zinc-300">
                Ai <span className="text-blue-400 font-black">{stats.demosToDo} demo-uri</span> de finalizat.
              </p>
            </div>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-purple-500/5" />
        </motion.div>
      </div>

      <div className="flex items-center space-x-3 mt-8">
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
          <LayoutDashboard className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Statistici Rapide</h2>
          <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Performanță curentă</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSwitchTab(card.tab)}
            className={`relative overflow-hidden bg-zinc-900/50 border ${card.border} p-8 rounded-3xl cursor-pointer hover:bg-zinc-800/50 transition-all group shadow-xl`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`${card.bg} p-4 rounded-2xl`}>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
              <ArrowUpRight className="w-6 h-6 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
            
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
            <p className={`text-3xl font-black ${card.color} tracking-tight`}>{card.value}</p>
            
            {/* Decorative background element */}
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${card.bg} blur-3xl rounded-full opacity-40 group-hover:opacity-80 transition-opacity`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DashboardTab;
