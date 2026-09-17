import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, addMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Transaction } from '../types';

interface MonthlyStatsProps {
  transactions: Transaction[];
  onMonthChange?: (total: number) => void;
  title?: string;
  subtitle?: string;
  amountLabel?: string;
  theme?: 'emerald' | 'rose' | 'purple';
}

const MonthlyStats: React.FC<MonthlyStatsProps> = ({ 
  transactions, 
  onMonthChange,
  title = "Încasări Lunare",
  subtitle = "Sumar pe perioadă",
  amountLabel = "Total Încasat",
  theme = 'emerald'
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthlyTotal = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    return transactions
      .filter(t => {
        try {
          if (!t.date) return false;
          const date = parseISO(t.date);
          if (isNaN(date.getTime())) return false;
          return isWithinInterval(date, { start, end });
        } catch (e) {
          return false;
        }
      })
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions, selectedMonth]);

  React.useEffect(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    
    if (onMonthChange && isWithinInterval(new Date(), { start, end })) {
      onMonthChange(monthlyTotal);
    }
  }, [monthlyTotal, selectedMonth, onMonthChange]);

  const formattedTotal = new Intl.NumberFormat('ro-RO', { 
    style: 'decimal', 
    maximumFractionDigits: 0 
  }).format(monthlyTotal);

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const isRose = theme === 'rose';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            isRose 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-inner">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all"
            aria-label="Luna anterioară"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 min-w-[140px] text-center">
            <span className="text-sm font-bold text-zinc-100 capitalize">
              {format(selectedMonth, 'MMMM yyyy', { locale: ro })}
            </span>
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all"
            aria-label="Luna următoare"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {isRose ? (
              <MinusCircle className="w-12 h-12 text-rose-400" />
            ) : (
              <TrendingUp className="w-12 h-12 text-emerald-400" />
            )}
          </div>
          
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">{amountLabel}</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-4xl font-black tracking-tight ${
              isRose ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formattedTotal}
            </span>
            <span className={`text-xl font-bold ${
              isRose ? 'text-rose-600' : 'text-emerald-600'
            }`}>lei</span>
          </div>
          
          <div className="mt-4 flex items-center space-x-2 text-[10px] text-zinc-600 font-bold uppercase">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isRose ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span>Actualizat în timp real</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MonthlyStats;
