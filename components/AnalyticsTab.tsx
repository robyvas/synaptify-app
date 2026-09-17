import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  PieChart as PieChartIcon
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Client } from '../types';

interface AnalyticsTabProps {
  clients: Client[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ clients }) => {
  const stats = useMemo(() => {
    const totalApproached = clients.length;
    const totalFinalized = clients.filter(c => c.status === 'Finalizat').length;
    const totalRejected = clients.filter(c => c.status === 'Refuzat').length;
    
    const totalClosed = totalFinalized + totalRejected;
    const conversionRate = totalClosed > 0 
      ? (totalFinalized / totalClosed) * 100 
      : 0;

    // Average Closing Time
    const closedClients = clients.filter(c => c.closedAt);
    const totalDays = closedClients.reduce((acc, curr) => {
      const start = parseISO(curr.createdAt);
      const end = parseISO(curr.closedAt!);
      return acc + Math.max(0, differenceInDays(end, start));
    }, 0);
    const avgClosingTime = closedClients.length > 0 
      ? (totalDays / closedClients.length).toFixed(1) 
      : "0";

    // Average Project Value
    const clientsWithPrice = clients.filter(c => c.price > 0);
    const totalPrice = clientsWithPrice.reduce((acc, curr) => acc + curr.price, 0);
    const avgProjectValue = clientsWithPrice.length > 0 
      ? Math.round(totalPrice / clientsWithPrice.length) 
      : 0;

    return {
      totalApproached,
      totalFinalized,
      totalRejected,
      conversionRate: conversionRate.toFixed(1),
      avgClosingTime,
      avgProjectValue
    };
  }, [clients]);

  const cards = [
    {
      title: 'Clienți Abordați',
      value: stats.totalApproached,
      icon: Users,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10'
    },
    {
      title: 'Clienți Finalizați',
      value: stats.totalFinalized,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Clienți Refuzați',
      value: stats.totalRejected,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    },
    {
      title: 'Rata de Conversie',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      subtitle: 'Din totalul lead-urilor închise'
    },
    {
      title: 'Timp Mediu Închidere',
      value: `${stats.avgClosingTime} zile`,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Valoare Medie Proiect',
      value: `${stats.avgProjectValue.toLocaleString()} RON`,
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
          <BarChart3 className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Analytics</h2>
          <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Performanță și Statistici</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{card.title}</p>
            <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
            {card.subtitle && (
              <p className="text-[10px] text-zinc-600 mt-1 font-medium italic">{card.subtitle}</p>
            )}

            {/* Decorative background element */}
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* Visual Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center">
            <PieChartIcon className="w-4 h-4 mr-2 text-purple-400" />
            Distribuție Statusuri
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Finalizați', count: stats.totalFinalized, color: 'bg-emerald-500', total: stats.totalApproached },
              { label: 'Refuzați', count: stats.totalRejected, color: 'bg-red-500', total: stats.totalApproached },
              { label: 'În Lucru / Negociere', count: stats.totalApproached - stats.totalFinalized - stats.totalRejected, color: 'bg-zinc-700', total: stats.totalApproached }
            ].map((item, i) => {
              const percentage = stats.totalApproached > 0 ? (item.count / stats.totalApproached) * 100 : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="text-zinc-300">{item.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="bg-purple-500/10 p-4 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">Eficiență Vânzări</h3>
          <p className="text-zinc-500 text-xs max-w-[200px]">
            Rata ta de conversie este de <span className="text-purple-400 font-bold">{stats.conversionRate}%</span>. 
            {parseFloat(stats.conversionRate) > 50 ? " Excelentă treabă!" : " Se poate și mai bine."}
          </p>
        </div>
      </div>

      {/* Finalized Clients List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
            Istoric Clienți Finalizați
          </h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {clients.filter(c => c.status === 'Finalizat').length > 0 ? (
            clients
              .filter(c => c.status === 'Finalizat')
              .sort((a, b) => {
                if (a.closedAt && b.closedAt) return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime();
                return 0;
              })
              .map(client => (
              <div key={client.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                <div>
                  <h4 className="font-bold text-zinc-200">{client.businessName}</h4>
                  <p className="text-xs text-zinc-500">{client.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{client.price.toLocaleString()} RON</p>
                  <p className="text-xs text-zinc-600">
                    {client.closedAt 
                      ? format(parseISO(client.closedAt), 'dd MMM yyyy', { locale: ro })
                      : 'Data necunoscută'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Nu există clienți finalizați încă.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
