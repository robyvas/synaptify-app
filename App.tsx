import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, IncomeFormData, Client } from './types';
import FinancialTab from './components/FinancialTab';
import SalesTab from './components/SalesTab';
import TechnicalTab from './components/TechnicalTab';
import DashboardTab from './components/DashboardTab';
import AnalyticsTab from './components/AnalyticsTab';

import { RefreshCw, AlertTriangle, Wallet, Users, Settings, LayoutDashboard, BarChart3 } from 'lucide-react';

// ====================================================================================
// CONFIGURARE OBLIGATORIE
// ====================================================================================
const DATA_API_URL = "https://script.google.com/macros/s/AKfycbwckl89l0cbbK-qD7xElrKXrR1IotZbqWH8oPPHCLxYjCgfn-AUj3-F5R01Qab0vSqt/exec";
// ====================================================================================

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'financiar' | 'sales' | 'technical' | 'analytics'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);

  // Reset scroll on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Load Data (Transactions + Clients)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`${DATA_API_URL}?t=${Date.now()}`, {
          redirect: 'follow'
        });
        
        if (!response.ok) {
          let errorMsg = `Server error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // Not JSON
          }
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        const sanitize = (raw: any[]): Transaction[] => {
          return raw.map(item => {
            const isDate = (s: any) => s && !isNaN(Date.parse(s)) && String(s).includes('T');
            
            const rawType = item.type || (item.tip === 'cheltuiala' || item.tip === 'expense' ? 'expense' : 'income');
            const type = rawType === 'expense' ? 'expense' : 'income';

            const isCompany = Boolean(
              item.isCompany === true || 
              item.isCompany === 'true' || 
              item.isCompany === 1 || 
              item.isCompany === '1' ||
              item.peFirma === true ||
              item.peFirma === 'true'
            );

            let companySplit = undefined;
            if (item.companySplit) {
              if (typeof item.companySplit === 'object') {
                companySplit = item.companySplit;
              } else if (typeof item.companySplit === 'string') {
                try {
                  companySplit = JSON.parse(item.companySplit);
                } catch (e) {
                  // Ignore JSON parse error
                }
              }
            }

            const amount = Number(item.amount) || 0;

            if (isCompany && !companySplit) {
              const half = Math.round(amount / 2);
              companySplit = {
                type: 'both' as const,
                robertPercent: 50,
                iustinPercent: 50,
                robertAmount: half,
                iustinAmount: amount - half
              };
            }

            return {
              id: item.id || uuidv4(),
              title: item.title || (type === 'expense' ? 'Cheltuială' : 'Venit'),
              amount,
              type,
              categories: Array.isArray(item.categories) ? item.categories : 
                          (typeof item.categories === 'string' ? item.categories.split(',').map((s: string) => s.trim()) : []),
              date: isDate(item.date) ? item.date : new Date().toISOString(),
              isCompany,
              companySplit
            };
          });
        };

        // Handle response format
        if (data.transactions) {
          setTransactions(sanitize(data.transactions).reverse());
        } else if (Array.isArray(data)) {
          setTransactions(sanitize(data).reverse());
        }

        if (data.clients) {
          const sanitizedClients = data.clients.map((c: any) => ({
            ...c,
            id: c.id || uuidv4(),
            businessName: c.businessName || 'Business Fără Nume',
            clientName: c.clientName || 'Client Fără Nume',
            phone: String(c.phone || ''),
            status: c.status || 'Lead Nou',
            techStatus: c.techStatus || 'De Făcut',
            price: Number(c.price) || 0,
            probability: Number(c.probability) || 0,
            demoDeadline: c.demoDeadline || new Date().toISOString(),
            notes: c.notes || '',
            techNotes: c.techNotes || '',
            createdAt: c.createdAt || new Date().toISOString(),
            appointments: Array.isArray(c.appointments) ? c.appointments : []
          }));
          setClients(sanitizedClients.reverse());
        }
        
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Nu s-au putut încărca datele. Verifică conexiunea.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add Transaction
  const addTransaction = async (data: IncomeFormData) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      title: data.title,
      amount: parseFloat(data.amount) || 0,
      type: data.type || 'income',
      categories: data.categories,
      date: new Date().toISOString(),
      isCompany: Boolean(data.isCompany),
      companySplit: data.companySplit
    };

    // Optimistic UI Update
    setTransactions(prev => [newTransaction, ...prev]);
    setSyncing(true);
    
    try {
      const response = await fetch(DATA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Using text/plain to avoid CORS preflight issues with GAS
        body: JSON.stringify({ action: 'add', transaction: newTransaction }),
        redirect: 'follow'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`A apărut o eroare la salvarea în Sheet: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    const backup = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));
    setSyncing(true);

    try {
      const response = await fetch(DATA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', id: id }),
        redirect: 'follow'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Nu s-a putut șterge din Sheet: ${err.message}`);
      setTransactions(backup);
    } finally {
      setSyncing(false);
    }
  };

  const totalIncome = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Sales Handlers (Now synced with Google Sheets)
  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    setSyncing(true);
    try {
      const response = await fetch(DATA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addClient', client }),
        redirect: 'follow'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Eroare la salvarea clientului: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    const oldClient = clients.find(c => c.id === updatedClient.id);
    
    // Determine what changed for notifications
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

    setClients(prev => prev.map(c => c.id === updatedClient.id ? clientWithUpdate : c));
    
    setSyncing(true);
    try {
      const response = await fetch(DATA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'updateClient', client: clientWithUpdate }),
        redirect: 'follow'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Eroare la actualizarea clientului: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteClient = async (id: string) => {
    const backup = [...clients];
    setClients(prev => prev.filter(c => c.id !== id));
    
    setSyncing(true);
    try {
      const response = await fetch(DATA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteClient', id }),
        redirect: 'follow'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Eroare la ștergerea clientului: ${err.message}`);
      setClients(backup);
    } finally {
      setSyncing(false);
    }
  };

  // Ecran de Avertizare dacă Developerul nu a pus link-ul
  if (false) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-zinc-900 border border-red-900/50 p-8 rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Aplicația nu este conectată</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Pentru ca aplicația să funcționeze cu Sheet-ul tău, trebuie să adaugi 
            <strong> Web App URL</strong> în fișierul <code>App.tsx</code> la linia 14.
          </p>
          <div className="bg-zinc-950 p-4 rounded text-left text-xs font-mono text-zinc-500 overflow-hidden">
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbziFJPZ9w6TAz74-V_uv9GdKlU1KHTEMVffeQorlk_jpeJThFviPS9lRBkxQLciDFcT/exec";
          </div>
        </div>
      </div>
    );
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
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-grow pb-28 md:pb-20">
          {loading && activeTab === 'financiar' ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              <p className="text-zinc-600 text-sm animate-pulse">Se descarcă datele din Google Drive...</p>
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
        <p>Datele sunt salvate automat în Google Sheet.</p>
      </footer>
    </div>
  );
};

export default App;