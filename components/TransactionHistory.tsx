import React from 'react';
import { Trash2, Calendar, ArrowUpRight, ArrowDownRight, Building2, User, Users, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  title?: string;
  emptyMessage?: string;
  filterType?: 'all' | 'income' | 'expense';
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  onDelete,
  title = "Registru Activități",
  emptyMessage = "Nu există intrări în registru."
}) => {
  if (transactions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800"
      >
        <p className="font-medium text-zinc-400">{emptyMessage}</p>
        <p className="text-xs text-zinc-600 mt-1">Tranzacțiile înregistrate vor apărea automat aici.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <span className="text-zinc-600 text-xs font-medium">{transactions.length} {transactions.length === 1 ? 'tranzacție' : 'tranzacții'}</span>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode='popLayout'>
          {transactions.map((t, idx) => {
            const isExpense = t.type === 'expense';
            const hasCompanySplit = t.isCompany && t.companySplit;
            const split = t.companySplit;

            return (
              <motion.div 
                key={`${t.id}-${idx}`}
                layout
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isExpense
                    ? (t.isCompany 
                        ? 'bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-rose-950/20 border-rose-900/40 hover:border-rose-500/40' 
                        : 'bg-zinc-900 border-zinc-800/60 hover:border-rose-500/30 hover:bg-zinc-800/50')
                    : (t.isCompany 
                        ? 'bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-blue-950/20 border-blue-900/40 hover:border-blue-500/40' 
                        : 'bg-zinc-900 border-zinc-800/60 hover:border-purple-500/30 hover:bg-zinc-800/50')
                }`}
              >
                {/* Hover highlight effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                  isExpense ? 'bg-gradient-to-r from-rose-500/5 to-transparent' : 'bg-gradient-to-r from-purple-500/5 to-transparent'
                }`} />

                <div className="relative z-10 flex items-start space-x-4 mb-4 md:mb-0">
                  <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 border ${
                    isExpense
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : (t.isCompany 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                  }`}>
                    {isExpense ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : t.isCompany ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-zinc-100 text-lg leading-tight">{t.title}</h4>
                      {isExpense && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Cheltuială
                        </span>
                      )}
                      {t.isCompany && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          isExpense 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          <Building2 className="w-3 h-3 mr-1" />
                          Pe Firmă
                        </span>
                      )}
                    </div>
                    
                    {/* Categories */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(Array.isArray(t.categories) ? t.categories : 
                        (typeof t.categories === 'string' ? [t.categories] : [])).map((cat, catIdx) => (
                        <span key={catIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/80">
                          <Tag className="w-3 h-3 mr-1 text-zinc-500" />
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Company Split Attribution details */}
                    {hasCompanySplit && split && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center">
                          <Users className="w-3 h-3 mr-1 text-zinc-400" /> Împărțire:
                        </span>
                        
                        {/* Robert share */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/50">
                          <User className="w-3 h-3 mr-1 text-blue-400" />
                          Robert: {split.robertAmount?.toLocaleString() || Math.round(t.amount * (split.robertPercent || 0) / 100).toLocaleString()} lei ({split.robertPercent}%)
                        </span>

                        {/* Iustin share */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                          <User className="w-3 h-3 mr-1 text-purple-400" />
                          Iustin: {split.iustinAmount?.toLocaleString() || Math.round(t.amount * (split.iustinPercent || 0) / 100).toLocaleString()} lei ({split.iustinPercent}%)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-zinc-500 mt-2 font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                      {t.date && !isNaN(new Date(t.date).getTime()) ? 
                        new Date(t.date).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Dată invalidă'}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto pl-14 md:pl-0 shrink-0">
                  <div className="text-right">
                    <span className={`text-xl md:text-2xl font-black whitespace-nowrap block ${
                      isExpense ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isExpense ? '-' : '+'}{new Intl.NumberFormat('ro-RO', { style: 'decimal', maximumFractionDigits: 0 }).format(t.amount)} lei
                    </span>
                    {t.isCompany && (
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        {isExpense ? 'Deductibil Firmă' : 'Facturat Firmă'}
                      </span>
                    )}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, color: "#ef4444" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(t.id)}
                    className="p-2 text-zinc-600 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                    aria-label="Sterge intrare"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionHistory;
