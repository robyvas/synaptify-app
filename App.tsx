import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, IncomeFormData, Client } from './types';
import { auth } from './src/lib/firebase';
import * as db from './src/services/db';
import Login from './components/Login';
import FinancialTab from './components/FinancialTab';
import SalesTab from './components/SalesTab';
import TechnicalTab from './components/TechnicalTab';
import DashboardTab from './components/DashboardTab';
import AnalyticsTab from './components/AnalyticsTab';

import { RefreshCw, AlertTriangle, Wallet, Users, Settings, LayoutDashboard, BarChart3, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'financiar' | 'sales' | 'technical' | 'analytics'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Reset scroll on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Live subscriptions to Firestore (only once authenticated)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubTransactions = db.subscribeToTransactions((data) => {
      setTransactions(data);
      setLoading(false);
      setError(null);
    });
    const unsubClients = db.subscribeToClients((data) => {
      setClients(data);
    });

    return () => {
      unsubTransactions();
      unsubClients();
    };
  }, [user]);

  const addTransaction = async (data: IncomeFormData) => {
    setSyncing(true);
    try {
      await db.addTransaction(data);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`A apărut o eroare la salvare: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setSyncing(true);
    try {
      await db.deleteTransaction(id);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Nu s-a putut șterge: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const totalIncome = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const addClient = async (client: Client) => {
    setSyncing(true);
    try {
      await db.addClient(client);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Eroare la salvarea clientului: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    const oldClient = clients.find(c => c.id === updatedClient.id);

    let updateType: Client['lastUpdateType'] = 'general';
    if (oldClient) {
      if (oldClient.status !== updatedClient.status) updateType = 'status';
      else if (oldClient.techStatus !== updatedClient.techStatus) updateType = 'techStatus';
      else if (oldClient.notes !== updatedClient.notes) updateType = 'notes';
      else if (oldClient.techNotes !== updatedClient.techNotes) updateType = 'techNotes';
      else if (oldClient.price !== updatedClient.price) updateType = 'price';
      else if (oldClient.gbpLink !== updatedClient.gbpLink) updateType = 'general';
      else if (oldClient.appointments.length !== updatedClient.appointments.length) updateType = 'general';
    }

    const clientWithUpdate = {
      ...updatedClient,
      lastUpdateAt: new Date().toISOString(),
      lastUpdateType: updateType
    };

    setSyncing(true);
    try {
      await db.updateClient(clientWithUpdate);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Eroare la actualizarea clientului: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteClient = async (id: string) => {
    setSyncing(true);
    try {
      await db.deleteClient(id);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Eroare la ștergerea clientului: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (user === null) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-x-hidden">
      {/* Header Decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-emerald-500 to-purple-600 z-50"></div>

      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-6 py-6 md:py-12 flex-grow overflow-x-hidden">

        {/* App Title & Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center mb-8 sm:mb-12 gap-4 sm:gap-6 text-center"
        >
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-br from-purple-900/60 to-zinc-900 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/20 flex items-center justify-center p-1 relative">
              <img
                src="/logo.png"
                alt="Synaptify Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).classList.remove('hidden');
                    (fallback as HTMLElement).classList.add('flex');
                  }
                }}
              />
              <div className="logo-fallback hidden w-full h-full items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 rounded-xl text-white font-black text-xl sm:text-2xl shadow-inner">
                S
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              Synaptify
            </h1>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3 bg-zinc-900/60 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-zinc-800 backdrop-blur-md shadow-lg text-xs sm:text-sm">
            {syncing ? (
              <div className="flex items-center text-purple-400 font-bold">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                Sincronizare...
              </div>
            ) : error ? (
              <div className="flex items-center text-red-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                Deconectat
              </div>
            ) : (
              <div className="flex items-center text-emerald-400 font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                Conectat la Cloud
              </div>
            )}
            <span className="text-zinc-600">|</span>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-grow pb-28 md:pb-20">
          {loading && activeTab === 'financiar' ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              <p className="text-zinc-600 text-sm animate-pulse">Se încarcă datele...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardTab
                    clients={clients}
                    transactions={transactions}
                    onSwitchTab={setActiveTab}
                    currentMonthIncome={currentMonthIncome}
                  />
                )}

                {activeTab === 'financiar' && (
                  <FinancialTab
                    transactions={transactions}
                    onAddTransaction={addTransaction}
                    onDeleteTransaction={deleteTransaction}
                    currentMonthIncome={currentMonthIncome}
                    onCurrentMonthIncomeChange={setCurrentMonthIncome}
                    error={error}
                  />
                )}

                {activeTab === 'sales' && (
                  <SalesTab
                    clients={clients}
                    onAddClient={addClient}
                    onUpdateClient={updateClient}
                    onDeleteClient={deleteClient}
                  />
                )}

                {activeTab === 'technical' && (
                  <TechnicalTab
                    clients={clients}
                    onUpdateClient={updateClient}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsTab clients={clients} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 z-40 p-2">
        <div className="max-w-screen-2xl mx-auto flex justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'dashboard' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mb-1 ${activeTab === 'dashboard' ? 'text-purple-400' : ''}`} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('financiar')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'financiar' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wallet className={`w-5 h-5 mb-1 ${activeTab === 'financiar' ? 'text-emerald-400' : ''}`} />
            <span>Financiar</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'sales' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className={`w-5 h-5 mb-1 ${activeTab === 'sales' ? 'text-purple-400' : ''}`} />
            <span>Sales</span>
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'technical' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Settings className={`w-5 h-5 mb-1 ${activeTab === 'technical' ? 'text-blue-400' : ''}`} />
            <span>Technical</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'analytics' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-1 ${activeTab === 'analytics' ? 'text-orange-400' : ''}`} />
            <span>Analytics</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="text-center py-6 text-zinc-800 text-xs border-t border-zinc-900 mt-auto hidden md:block">
        <p>Datele sunt salvate automat în Firebase.</p>
      </footer>
    </div>
  );
};

export default App;
