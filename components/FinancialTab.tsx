import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2, 
  User, 
  Users, 
  PlusCircle,
  MinusCircle,
  Layers,
  Scale,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Transaction, IncomeFormData } from '../types';
import BalanceDisplay from './BalanceDisplay';
import IncomeForm from './IncomeForm';
import ExpenseForm from './ExpenseForm';
import TransactionHistory from './TransactionHistory';
import IncomeChart from './IncomeChart';
import MonthlyStats from './MonthlyStats';

interface FinancialTabProps {
  transactions: Transaction[];
  onAddTransaction: (data: IncomeFormData) => void;
  onDeleteTransaction: (id: string) => void;
  currentMonthIncome: number;
  onCurrentMonthIncomeChange: (amount: number) => void;
  error?: string | null;
}

type MainFinancialSection = 'incasari' | 'cheltuieli' | 'profit';
type SubViewType = 'total' | 'firma';

const FinancialTab: React.FC<FinancialTabProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currentMonthIncome,
  onCurrentMonthIncomeChange,
  error
}) => {
  const [mainSection, setMainSection] = useState<MainFinancialSection>('incasari');
  const [subView, setSubView] = useState<SubViewType>('total');

  // Filter transactions by type
  const incomeTransactions = useMemo(() => {
    return transactions.filter(t => t.type !== 'expense');
  }, [transactions]);

  const expenseTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  // Company transactions
  const companyIncomeTransactions = useMemo(() => {
    return incomeTransactions.filter(t => t.isCompany);
  }, [incomeTransactions]);

  const companyExpenseTransactions = useMemo(() => {
    return expenseTransactions.filter(t => t.isCompany);
  }, [expenseTransactions]);

  // Total sums
  const totalIncome = useMemo(() => {
    return incomeTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [incomeTransactions]);

  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenseTransactions]);

  const totalNetProfit = totalIncome - totalExpense;
  const totalProfitMargin = totalIncome > 0 ? Math.round((totalNetProfit / totalIncome) * 100) : 0;

  // Calculate current month expenses
  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return expenseTransactions
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
  }, [expenseTransactions]);

  // Helper for computing partner splits
  const computeSplitStats = (txList: Transaction[]) => {
    const total = txList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    let totalRobert = 0;
    let totalIustin = 0;
    let robertTxCount = 0;
    let iustinTxCount = 0;

    txList.forEach(t => {
      const split = t.companySplit;
      const amt = Number(t.amount) || 0;

      if (split) {
        const rAmt = split.robertAmount !== undefined ? split.robertAmount : Math.round((amt * (split.robertPercent || 0)) / 100);
        const iAmt = split.iustinAmount !== undefined ? split.iustinAmount : (amt - rAmt);
        
        totalRobert += rAmt;
        totalIustin += iAmt;

        if (rAmt > 0) robertTxCount++;
        if (iAmt > 0) iustinTxCount++;
      } else {
        const half = Math.round(amt / 2);
        totalRobert += half;
        totalIustin += (amt - half);
        robertTxCount++;
        iustinTxCount++;
      }
    });

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const currentMonthCompanyAmt = txList
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

    const robertPercentOfTotal = total > 0 ? Math.round((totalRobert / total) * 100) : 0;
    const iustinPercentOfTotal = total > 0 ? (100 - robertPercentOfTotal) : 0;

    return {
      total,
      totalRobert,
      totalIustin,
      robertTxCount,
      iustinTxCount,
      currentMonthCompanyAmt,
      robertPercentOfTotal,
      iustinPercentOfTotal,
      txCount: txList.length,
      averageTx: txList.length > 0 ? Math.round(total / txList.length) : 0
    };
  };

  const companyIncomeStats = useMemo(() => computeSplitStats(companyIncomeTransactions), [companyIncomeTransactions]);
  const companyExpenseStats = useMemo(() => computeSplitStats(companyExpenseTransactions), [companyExpenseTransactions]);

  // Company Net Profit & Partner Net Profit
  const companyNetProfit = companyIncomeStats.total - companyExpenseStats.total;
  const companyProfitMargin = companyIncomeStats.total > 0 
    ? Math.round((companyNetProfit / companyIncomeStats.total) * 100) 
    : 0;

  const robertNetProfit = companyIncomeStats.totalRobert - companyExpenseStats.totalRobert;
  const iustinNetProfit = companyIncomeStats.totalIustin - companyExpenseStats.totalIustin;

  return (
    <div className="space-y-8">
      {/* Header & Main Section Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl shadow-inner shrink-0">
            <Wallet className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight truncate">Management Financiar</h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 uppercase font-semibold tracking-wider truncate">
              {mainSection === 'incasari' && (subView === 'total' ? 'Venituri Generale & Registru Încasări' : 'Încasări Pe Firmă & Repartiție Asociați')}
              {mainSection === 'cheltuieli' && (subView === 'total' ? 'Cheltuieli Generale & Registru Ieșiri' : 'Cheltuieli Pe Firmă & Asumare Asociați')}
              {mainSection === 'profit' && 'Bilanț General & Profit Net Asociați'}
            </p>
          </div>
        </div>

        {/* Primary Tab Switcher: Încasări | Cheltuieli | Bilanț & Profit */}
        <div className="grid grid-cols-3 sm:flex sm:items-center bg-zinc-950 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-xl w-full md:w-auto gap-1">
          <button
            onClick={() => setMainSection('incasari')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 text-center ${
              mainSection === 'incasari'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Încasări ({incomeTransactions.length})</span>
          </button>

          <button
            onClick={() => setMainSection('cheltuieli')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 text-center ${
              mainSection === 'cheltuieli'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Cheltuieli ({expenseTransactions.length})</span>
          </button>

          <button
            onClick={() => setMainSection('profit')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 text-center ${
              mainSection === 'profit'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Profit & Bilanț</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: ÎNCASĂRI (VENITURI) */}
      {/* ========================================================================= */}
      {mainSection === 'incasari' && (
        <div className="space-y-6">
          {/* Sub-view toggle (Total vs Pe Firmă) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/80 p-2.5 sm:p-2 rounded-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider pl-1">Filtru Vizualizare:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center sm:space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
              <button
                onClick={() => setSubView('total')}
                className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                  subView === 'total'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Total ({incomeTransactions.length})</span>
              </button>
              <button
                onClick={() => setSubView('firma')}
                className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                  subView === 'firma'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Pe Firmă ({companyIncomeTransactions.length})</span>
              </button>
            </div>
          </div>

          {/* VIEW: ÎNCASĂRI TOTAL */}
          {subView === 'total' && (
            <motion.div
              key="income-total"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { title: 'Total Încasat', value: `${totalIncome.toLocaleString()} RON`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { title: 'Venit Lună', value: `${currentMonthIncome.toLocaleString()} RON`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { title: 'Nr. Încasări', value: incomeTransactions.length, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Medie Încasare', value: `${Math.round(incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0).toLocaleString()} RON`, icon: DollarSign, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
                  { title: 'Venit Firmă', value: `${companyIncomeStats.total.toLocaleString()} RON`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Status Cloud', value: 'Activ', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group shadow-xl"
                  >
                    <div className={`${card.bg} p-3 rounded-2xl w-fit mb-4`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
                    <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                    <div className={`absolute -right-6 -bottom-6 w-28 h-28 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
                  </motion.div>
                ))}
              </div>

              {/* Main Balance Display Area */}
              <section>
                <BalanceDisplay total={totalIncome} count={incomeTransactions.length} />
              </section>

              {/* Monthly Summary Section */}
              <section>
                <MonthlyStats 
                  transactions={incomeTransactions} 
                  onMonthChange={onCurrentMonthIncomeChange} 
                  title="Încasări Lunare"
                  amountLabel="Total Încasat"
                  theme="emerald"
                />
              </section>

              {/* Chart Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <IncomeChart 
                  data={incomeTransactions} 
                  title="Evoluție Încasări"
                  categoryTitle="Categorii Încasări"
                  theme="emerald"
                />
              </motion.div>

              {/* Input Section */}
              <section>
                <IncomeForm onAdd={onAddTransaction} />
              </section>

              {/* Divider */}
              <div className="border-t border-zinc-800/80 my-8" />

              {/* List Section */}
              <section className="pb-16">
                <TransactionHistory 
                  transactions={incomeTransactions} 
                  onDelete={onDeleteTransaction} 
                  title="Registru Toate Încasările"
                  emptyMessage="Nu există încasări înregistrate încă."
                />
              </section>
            </motion.div>
          )}

          {/* VIEW: ÎNCASĂRI PE FIRMĂ */}
          {subView === 'firma' && (
            <motion.div
              key="income-firma"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Company Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { title: 'Încasat Pe Firmă', value: `${companyIncomeStats.total.toLocaleString()} RON`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Partea Robert', value: `${companyIncomeStats.totalRobert.toLocaleString()} RON`, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Partea Iustin', value: `${companyIncomeStats.totalIustin.toLocaleString()} RON`, icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { title: 'Încasat Firmă Lună', value: `${companyIncomeStats.currentMonthCompanyAmt.toLocaleString()} RON`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { title: 'Încasări Firmă', value: companyIncomeStats.txCount, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  { title: 'Medie / Încasare', value: `${companyIncomeStats.averageTx.toLocaleString()} RON`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group shadow-xl"
                  >
                    <div className={`${card.bg} p-3 rounded-2xl w-fit mb-4`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
                    <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                    <div className={`absolute -right-6 -bottom-6 w-28 h-28 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
                  </motion.div>
                ))}
              </div>

              {/* Partner Share Comparison Card */}
              <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-blue-950/30 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">Repartiție Asociați Încasări (Pe Firmă)</h3>
                      <p className="text-xs text-zinc-400 font-medium">Bilanț cumulat din toate încasările atribuite pe societate</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300 self-start sm:self-auto">
                    Total Firmă: {companyIncomeStats.total.toLocaleString()} RON
                  </div>
                </div>

                {/* Visual Balance Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" /> Robert ({companyIncomeStats.robertPercentOfTotal}%)
                    </span>
                    <span className="text-purple-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" /> Iustin ({companyIncomeStats.iustinPercentOfTotal}%)
                    </span>
                  </div>
                  
                  <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 shadow-inner p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${companyIncomeStats.robertPercentOfTotal}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-l-full shadow-md"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${companyIncomeStats.iustinPercentOfTotal}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-r-full shadow-md"
                    />
                  </div>
                </div>

                {/* Individual Partner Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Robert Card */}
                  <div className="bg-zinc-950/80 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
                          R
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-100 text-base">Robert</h4>
                          <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Asociat</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {companyIncomeStats.robertPercentOfTotal}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Sumă Încasată</span>
                        <span className="text-3xl font-black text-blue-400 tracking-tight">
                          {companyIncomeStats.totalRobert.toLocaleString()} <span className="text-base text-blue-500/70 font-bold">RON</span>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span>Implicat în:</span>
                        <strong className="text-zinc-200">{companyIncomeStats.robertTxCount} proiecte/încasări</strong>
                      </div>
                    </div>
                  </div>

                  {/* Iustin Card */}
                  <div className="bg-zinc-950/80 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-sm">
                          I
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-100 text-base">Iustin</h4>
                          <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Asociat</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {companyIncomeStats.iustinPercentOfTotal}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Sumă Încasată</span>
                        <span className="text-3xl font-black text-purple-400 tracking-tight">
                          {companyIncomeStats.totalIustin.toLocaleString()} <span className="text-base text-purple-500/70 font-bold">RON</span>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span>Implicat în:</span>
                        <strong className="text-zinc-200">{companyIncomeStats.iustinTxCount} proiecte/încasări</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Notice to Add Transaction */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Pentru a adăuga o nouă încasare, comută pe secțiunea <strong>Total</strong> și bifează opțiunea <strong>Pe Firmă</strong>.</span>
                </div>
                <button
                  onClick={() => setSubView('total')}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors shrink-0"
                >
                  Mergi la formular
                </button>
              </div>

              {/* Company Monthly Summary */}
              <section>
                <MonthlyStats 
                  transactions={companyIncomeTransactions} 
                  title="Încasări Firmă Lunare"
                  theme="emerald"
                />
              </section>

              {/* Company Charts */}
              {companyIncomeTransactions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <IncomeChart 
                    data={companyIncomeTransactions} 
                    title="Evoluție Încasări Pe Firmă"
                    categoryTitle="Categorii Încasări Firmă"
                    theme="emerald"
                  />
                </motion.div>
              )}

              {/* Company Transactions List */}
              <section className="pb-16">
                <TransactionHistory 
                  transactions={companyIncomeTransactions} 
                  onDelete={onDeleteTransaction}
                  title="Registru Încasări Pe Firmă"
                  emptyMessage="Nu există încă încasări marcate 'Pe Firmă'."
                />
              </section>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CHELTUIELI (EXPENSES) */}
      {/* ========================================================================= */}
      {mainSection === 'cheltuieli' && (
        <div className="space-y-6">
          {/* Sub-view toggle (Total vs Pe Firmă) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/80 p-2.5 sm:p-2 rounded-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider pl-1">Filtru Cheltuieli:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center sm:space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
              <button
                onClick={() => setSubView('total')}
                className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                  subView === 'total'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Total ({expenseTransactions.length})</span>
              </button>
              <button
                onClick={() => setSubView('firma')}
                className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                  subView === 'firma'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Pe Firmă ({companyExpenseTransactions.length})</span>
              </button>
            </div>
          </div>

          {/* VIEW: CHELTUIELI TOTAL */}
          {subView === 'total' && (
            <motion.div
              key="expense-total"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { title: 'Total Cheltuieli', value: `${totalExpense.toLocaleString()} RON`, icon: MinusCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { title: 'Cheltuieli Lună', value: `${currentMonthExpense.toLocaleString()} RON`, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { title: 'Nr. Cheltuieli', value: expenseTransactions.length, icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                  { title: 'Medie / Cheltuială', value: `${Math.round(expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0).toLocaleString()} RON`, icon: DollarSign, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
                  { title: 'Cheltuieli Firmă', value: `${companyExpenseStats.total.toLocaleString()} RON`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Status Deductibil', value: 'Activ', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group shadow-xl"
                  >
                    <div className={`${card.bg} p-3 rounded-2xl w-fit mb-4`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
                    <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                    <div className={`absolute -right-6 -bottom-6 w-28 h-28 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
                  </motion.div>
                ))}
              </div>

              {/* Total Expenses Banner Display */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl shadow-rose-900/10"
              >
                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="flex items-center space-x-2 text-zinc-400 uppercase tracking-widest text-xs font-semibold">
                    <MinusCircle className="w-4 h-4 text-rose-500" />
                    <span>Total Cheltuieli Înregistrate</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
                    {totalExpense.toLocaleString()} <span className="text-2xl md:text-3xl text-zinc-500 font-bold">lei</span>
                  </h1>
                  
                  <div className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
                    <span>{expenseTransactions.length} {expenseTransactions.length === 1 ? 'cheltuială înregistrată' : 'cheltuieli înregistrate'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Summary Section */}
              <section>
                <MonthlyStats 
                  transactions={expenseTransactions} 
                  title="Cheltuieli Lunare"
                  subtitle="Sumar cheltuieli pe perioadă"
                  amountLabel="Total Cheltuit"
                  theme="rose"
                />
              </section>

              {/* Chart Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <IncomeChart 
                  data={expenseTransactions} 
                  title="Evoluție Cheltuieli"
                  categoryTitle="Distribuție Categorii Cheltuieli"
                  theme="rose"
                />
              </motion.div>

              {/* Input Form Section */}
              <section>
                <ExpenseForm onAdd={onAddTransaction} />
              </section>

              {/* Divider */}
              <div className="border-t border-zinc-800/80 my-8" />

              {/* List Section */}
              <section className="pb-16">
                <TransactionHistory 
                  transactions={expenseTransactions} 
                  onDelete={onDeleteTransaction} 
                  title="Registru Toate Cheltuielile"
                  emptyMessage="Nu există cheltuieli înregistrate încă."
                />
              </section>
            </motion.div>
          )}

          {/* VIEW: CHELTUIELI PE FIRMĂ */}
          {subView === 'firma' && (
            <motion.div
              key="expense-firma"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Company Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { title: 'Cheltuieli Pe Firmă', value: `${companyExpenseStats.total.toLocaleString()} RON`, icon: Building2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { title: 'Partea Robert', value: `${companyExpenseStats.totalRobert.toLocaleString()} RON`, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { title: 'Partea Iustin', value: `${companyExpenseStats.totalIustin.toLocaleString()} RON`, icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { title: 'Cheltuieli Firmă Lună', value: `${companyExpenseStats.currentMonthCompanyAmt.toLocaleString()} RON`, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { title: 'Nr. Cheltuieli Firmă', value: companyExpenseStats.txCount, icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                  { title: 'Medie / Cheltuială', value: `${companyExpenseStats.averageTx.toLocaleString()} RON`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group shadow-xl"
                  >
                    <div className={`${card.bg} p-3 rounded-2xl w-fit mb-4`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
                    <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                    <div className={`absolute -right-6 -bottom-6 w-28 h-28 ${card.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
                  </motion.div>
                ))}
              </div>

              {/* Partner Expense Share Comparison Card */}
              <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-rose-950/30 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      <Users className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">Repartiție Asociați Cheltuieli (Pe Firmă)</h3>
                      <p className="text-xs text-zinc-400 font-medium">Bilanț cumulat din toate cheltuielile suportate/atribuite pe societate</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300 self-start sm:self-auto">
                    Total Cheltuieli Firmă: {companyExpenseStats.total.toLocaleString()} RON
                  </div>
                </div>

                {/* Visual Balance Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" /> Robert ({companyExpenseStats.robertPercentOfTotal}%)
                    </span>
                    <span className="text-purple-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" /> Iustin ({companyExpenseStats.iustinPercentOfTotal}%)
                    </span>
                  </div>
                  
                  <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 shadow-inner p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${companyExpenseStats.robertPercentOfTotal}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-l-full shadow-md"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${companyExpenseStats.iustinPercentOfTotal}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-r-full shadow-md"
                    />
                  </div>
                </div>

                {/* Individual Partner Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Robert Card */}
                  <div className="bg-zinc-950/80 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
                          R
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-100 text-base">Robert</h4>
                          <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Cheltuială Atribuită</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {companyExpenseStats.robertPercentOfTotal}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Sumă Suportată</span>
                        <span className="text-3xl font-black text-blue-400 tracking-tight">
                          {companyExpenseStats.totalRobert.toLocaleString()} <span className="text-base text-blue-500/70 font-bold">RON</span>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span>Implicat în:</span>
                        <strong className="text-zinc-200">{companyExpenseStats.robertTxCount} cheltuieli</strong>
                      </div>
                    </div>
                  </div>

                  {/* Iustin Card */}
                  <div className="bg-zinc-950/80 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-sm">
                          I
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-100 text-base">Iustin</h4>
                          <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Cheltuială Atribuită</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {companyExpenseStats.iustinPercentOfTotal}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Sumă Suportată</span>
                        <span className="text-3xl font-black text-purple-400 tracking-tight">
                          {companyExpenseStats.totalIustin.toLocaleString()} <span className="text-base text-purple-500/70 font-bold">RON</span>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span>Implicat în:</span>
                        <strong className="text-zinc-200">{companyExpenseStats.iustinTxCount} cheltuieli</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Notice */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Pentru a adăuga o nouă cheltuială, comută pe secțiunea <strong>Total</strong> și bifează opțiunea <strong>Pe Firmă</strong>.</span>
                </div>
                <button
                  onClick={() => setSubView('total')}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors shrink-0"
                >
                  Mergi la formular
                </button>
              </div>

              {/* Company Expense Monthly Summary */}
              <section>
                <MonthlyStats 
                  transactions={companyExpenseTransactions} 
                  title="Cheltuieli Firmă Lunare"
                  subtitle="Sumar cheltuieli pe societate"
                  amountLabel="Total Cheltuit Firmă"
                  theme="rose"
                />
              </section>

              {/* Company Expense Charts */}
              {companyExpenseTransactions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <IncomeChart 
                    data={companyExpenseTransactions} 
                    title="Evoluție Cheltuieli Pe Firmă"
                    categoryTitle="Categorii Cheltuieli Firmă"
                    theme="rose"
                  />
                </motion.div>
              )}

              {/* Company Expenses List */}
              <section className="pb-16">
                <TransactionHistory 
                  transactions={companyExpenseTransactions} 
                  onDelete={onDeleteTransaction}
                  title="Registru Cheltuieli Pe Firmă"
                  emptyMessage="Nu există încă cheltuieli marcate 'Pe Firmă'."
                />
              </section>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PROFIT & BILANȚ NET */}
      {/* ========================================================================= */}
      {mainSection === 'profit' && (
        <motion.div
          key="profit-overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {/* Main Net Profit Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Net Profit */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-emerald-500/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="bg-emerald-500/10 p-3 rounded-2xl w-fit mb-4 border border-emerald-500/20">
                <Scale className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Profit Net Total</p>
              <p className={`text-3xl font-black tracking-tight ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalNetProfit >= 0 ? '+' : ''}{totalNetProfit.toLocaleString()} <span className="text-base text-zinc-500 font-bold">RON</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Marjă Profit:</span>
                <strong className={totalProfitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalProfitMargin}%</strong>
              </div>
            </div>

            {/* 2. Company Net Profit */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/30 border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="bg-blue-500/10 p-3 rounded-2xl w-fit mb-4 border border-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Profit Net Pe Firmă</p>
              <p className={`text-3xl font-black tracking-tight ${companyNetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {companyNetProfit >= 0 ? '+' : ''}{companyNetProfit.toLocaleString()} <span className="text-base text-zinc-500 font-bold">RON</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Marjă Firmă:</span>
                <strong className={companyProfitMargin >= 0 ? 'text-blue-400' : 'text-rose-400'}>{companyProfitMargin}%</strong>
              </div>
            </div>

            {/* 3. Robert Net Profit */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/40 border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="bg-blue-500/10 p-3 rounded-2xl w-fit mb-4 border border-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Profit Net Robert (Firmă)</p>
              <p className={`text-3xl font-black tracking-tight ${robertNetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {robertNetProfit >= 0 ? '+' : ''}{robertNetProfit.toLocaleString()} <span className="text-base text-zinc-500 font-bold">RON</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Încasat: {companyIncomeStats.totalRobert.toLocaleString()} lei</span>
                <span className="text-rose-400">-{companyExpenseStats.totalRobert.toLocaleString()} lei</span>
              </div>
            </div>

            {/* 4. Iustin Net Profit */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/40 border border-purple-500/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="bg-purple-500/10 p-3 rounded-2xl w-fit mb-4 border border-purple-500/20">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Profit Net Iustin (Firmă)</p>
              <p className={`text-3xl font-black tracking-tight ${iustinNetProfit >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                {iustinNetProfit >= 0 ? '+' : ''}{iustinNetProfit.toLocaleString()} <span className="text-base text-zinc-500 font-bold">RON</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Încasat: {companyIncomeStats.totalIustin.toLocaleString()} lei</span>
                <span className="text-rose-400">-{companyExpenseStats.totalIustin.toLocaleString()} lei</span>
              </div>
            </div>
          </div>

          {/* Comparative Summary Table / Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-zinc-800">
              <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                <Scale className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Bilanț Comparativ General & Pe Firmă</h3>
                <p className="text-xs text-zinc-400 font-medium">Comparație detaliată între intrări, ieșiri și marje de rentabilitate</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Scope */}
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="text-sm font-bold text-zinc-200 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-purple-400" /> Bilanț General (Total)
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">{transactions.length} tranzacții</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Venituri:</span>
                    <strong className="text-emerald-400">+{totalIncome.toLocaleString()} RON</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Cheltuieli:</span>
                    <strong className="text-rose-400">-{totalExpense.toLocaleString()} RON</strong>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Profit Net Total:</span>
                    <strong className={`text-lg font-black ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalNetProfit >= 0 ? '+' : ''}{totalNetProfit.toLocaleString()} RON
                    </strong>
                  </div>
                </div>
              </div>

              {/* Company Scope */}
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="text-sm font-bold text-zinc-200 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-blue-400" /> Bilanț Societate (Pe Firmă)
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">
                    {companyIncomeTransactions.length + companyExpenseTransactions.length} tranzacții
                  </span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Încasări Pe Firmă:</span>
                    <strong className="text-emerald-400">+{companyIncomeStats.total.toLocaleString()} RON</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Cheltuieli Pe Firmă:</span>
                    <strong className="text-rose-400">-{companyExpenseStats.total.toLocaleString()} RON</strong>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Profit Net Firmă:</span>
                    <strong className={`text-lg font-black ${companyNetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {companyNetProfit >= 0 ? '+' : ''}{companyNetProfit.toLocaleString()} RON
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Net Position Breakdown */}
            <div className="bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-400" />
                Poziție Netă Individuală Asociați (După Cheltuieli Deductibile)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Robert */}
                <div className="bg-zinc-900/80 p-4 rounded-xl border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      R
                    </div>
                    <div>
                      <span className="text-sm font-bold text-zinc-200 block">Robert</span>
                      <span className="text-[11px] text-zinc-500">
                        +{companyIncomeStats.totalRobert.toLocaleString()} / -{companyExpenseStats.totalRobert.toLocaleString()} lei
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${robertNetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {robertNetProfit >= 0 ? '+' : ''}{robertNetProfit.toLocaleString()} RON
                    </span>
                  </div>
                </div>

                {/* Iustin */}
                <div className="bg-zinc-900/80 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      I
                    </div>
                    <div>
                      <span className="text-sm font-bold text-zinc-200 block">Iustin</span>
                      <span className="text-[11px] text-zinc-500">
                        +{companyIncomeStats.totalIustin.toLocaleString()} / -{companyExpenseStats.totalIustin.toLocaleString()} lei
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${iustinNetProfit >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                      {iustinNetProfit >= 0 ? '+' : ''}{iustinNetProfit.toLocaleString()} RON
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialTab;
