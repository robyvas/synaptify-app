import React, { useState, useEffect } from 'react';
import { MinusCircle, CreditCard, Type, Tag, Building2, User, Users, Sliders, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IncomeFormData, CompanySplitType, CompanySplit } from '../types';

interface ExpenseFormProps {
  onAdd: (data: IncomeFormData) => void;
}

const EXPENSE_CATEGORIES = [
  'Software & SaaS',
  'Marketing & Ads',
  'Echipamente & Hardware',
  'Salarii & Colaboratori',
  'Contabilitate & Taxe',
  'Sediu & Utilități',
  'Altele'
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Company fields
  const [isCompany, setIsCompany] = useState(false);
  const [splitType, setSplitType] = useState<CompanySplitType>('both');
  const [robertPercent, setRobertPercent] = useState<number>(50);
  const [iustinPercent, setIustinPercent] = useState<number>(50);
  const [robertAmount, setRobertAmount] = useState<string>('0');
  const [iustinAmount, setIustinAmount] = useState<string>('0');

  // Recalculate amounts whenever total amount or split changes
  useEffect(() => {
    const total = parseFloat(amount) || 0;
    if (splitType === 'robert') {
      setRobertPercent(100);
      setIustinPercent(0);
      setRobertAmount(total.toFixed(0));
      setIustinAmount('0');
    } else if (splitType === 'iustin') {
      setRobertPercent(0);
      setIustinPercent(100);
      setRobertAmount('0');
      setIustinAmount(total.toFixed(0));
    } else if (splitType === 'both') {
      setRobertPercent(50);
      setIustinPercent(50);
      const half = Math.round(total / 2);
      setRobertAmount(half.toString());
      setIustinAmount((total - half).toString());
    } else if (splitType === 'custom') {
      const rAmt = Math.round((total * robertPercent) / 100);
      const iAmt = total - rAmt;
      setRobertAmount(rAmt.toString());
      setIustinAmount(iAmt.toString());
    }
  }, [amount, splitType]);

  const handleRobertPercentChange = (val: number) => {
    const clampedR = Math.max(0, Math.min(100, val));
    const clampedI = 100 - clampedR;
    setRobertPercent(clampedR);
    setIustinPercent(clampedI);

    const total = parseFloat(amount) || 0;
    const rAmt = Math.round((total * clampedR) / 100);
    const iAmt = total - rAmt;
    setRobertAmount(rAmt.toString());
    setIustinAmount(iAmt.toString());
  };

  const handleIustinPercentChange = (val: number) => {
    const clampedI = Math.max(0, Math.min(100, val));
    const clampedR = 100 - clampedI;
    setIustinPercent(clampedI);
    setRobertPercent(clampedR);

    const total = parseFloat(amount) || 0;
    const iAmt = Math.round((total * clampedI) / 100);
    const rAmt = total - iAmt;
    setRobertAmount(rAmt.toString());
    setIustinAmount(iAmt.toString());
  };

  const handleRobertAmountChange = (valStr: string) => {
    setRobertAmount(valStr);
    const total = parseFloat(amount) || 0;
    const rVal = parseFloat(valStr) || 0;
    const clampedRVal = Math.max(0, Math.min(total, rVal));
    const iVal = Math.max(0, total - clampedRVal);
    
    setIustinAmount(iVal.toString());
    if (total > 0) {
      const rPct = Math.round((clampedRVal / total) * 100);
      setRobertPercent(rPct);
      setIustinPercent(100 - rPct);
    }
  };

  const handleIustinAmountChange = (valStr: string) => {
    setIustinAmount(valStr);
    const total = parseFloat(amount) || 0;
    const iVal = parseFloat(valStr) || 0;
    const clampedIVal = Math.max(0, Math.min(total, iVal));
    const rVal = Math.max(0, total - clampedIVal);
    
    setRobertAmount(rVal.toString());
    if (total > 0) {
      const iPct = Math.round((clampedIVal / total) * 100);
      setIustinPercent(iPct);
      setRobertPercent(100 - iPct);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || selectedCategories.length === 0) return;
    
    let companySplitData: CompanySplit | undefined = undefined;
    if (isCompany) {
      companySplitData = {
        type: splitType,
        robertPercent,
        iustinPercent,
        robertAmount: parseFloat(robertAmount) || 0,
        iustinAmount: parseFloat(iustinAmount) || 0,
      };
    }

    onAdd({ 
      title, 
      amount, 
      type: 'expense',
      categories: selectedCategories,
      isCompany,
      companySplit: companySplitData
    });

    setTitle('');
    setAmount('');
    setSelectedCategories([]);
    setIsCompany(false);
    setSplitType('both');
    setRobertPercent(50);
    setIustinPercent(50);
  };

  const totalNum = parseFloat(amount) || 0;

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit} 
      className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl"
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center">
          <MinusCircle className="w-5 h-5 mr-2 text-rose-500" />
          Adaugă Cheltuială Nouă
        </h2>
        <span className="text-xs text-zinc-500 font-medium">Secțiunea Cheltuieli</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
            Descriere Cheltuială
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Type className="h-4 w-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="ex: Abonament Cursor AI / OpenAI API / Reclame Meta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-sm font-medium"
              required
            />
          </div>
        </div>

        <div className="relative group">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
            Sumă Cheltuială (RON)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <CreditCard className="h-4 w-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors" />
            </div>
            <input
              type="number"
              placeholder="ex: 450"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-sm font-bold"
              required
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
          <Tag className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Categorie Cheltuială
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center space-x-1.5 ${
                  isSelected 
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/30 ring-1 ring-rose-400/40' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-xs text-amber-500/90 pl-1 font-medium">* Selectează cel puțin o categorie pentru cheltuială</p>
        )}
      </div>

      {/* "Pe Firmă" Toggle Section */}
      <div className="pt-2">
        <div 
          onClick={() => setIsCompany(!isCompany)}
          className={`cursor-pointer border rounded-2xl p-4 md:p-5 transition-all duration-200 flex items-center justify-between ${
            isCompany 
              ? 'bg-gradient-to-r from-rose-950/40 via-zinc-900 to-indigo-950/40 border-rose-500/40 shadow-lg shadow-rose-950/20' 
              : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isCompany 
                ? 'bg-rose-600 text-white border-rose-400/50 shadow-md shadow-rose-900/40' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-zinc-100">Cheltuială Pe Firmă</span>
                {isCompany && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Activ
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bifează dacă această cheltuială este deductibilă/achitată pe firmă și trebuie repartizată între asociați.
              </p>
            </div>
          </div>

          <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <div className={`w-12 h-6.5 rounded-full transition-colors duration-300 p-1 flex items-center ${
              isCompany ? 'bg-rose-600 justify-end' : 'bg-zinc-800 justify-start'
            }`}>
              <motion.div 
                layout 
                className="w-4.5 h-4.5 bg-white rounded-full shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Company Attribution & Split Controls */}
        <AnimatePresence>
          {isCompany && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden bg-zinc-950/80 border border-rose-500/20 rounded-2xl p-5 md:p-6 space-y-5"
            >
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-3">
                  Atribuire Cheltuială Firmă
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Robert */}
                  <button
                    type="button"
                    onClick={() => setSplitType('robert')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      splitType === 'robert'
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <User className="w-4 h-4 text-blue-400" />
                      {splitType === 'robert' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <span className="text-xs font-bold block text-zinc-200">Robert</span>
                    <span className="text-[10px] text-blue-400 font-semibold">100% (Integral)</span>
                  </button>

                  {/* Iustin */}
                  <button
                    type="button"
                    onClick={() => setSplitType('iustin')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      splitType === 'iustin'
                        ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <User className="w-4 h-4 text-purple-400" />
                      {splitType === 'iustin' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <span className="text-xs font-bold block text-zinc-200">Iustin</span>
                    <span className="text-[10px] text-purple-400 font-semibold">100% (Integral)</span>
                  </button>

                  {/* Amândoi */}
                  <button
                    type="button"
                    onClick={() => setSplitType('both')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      splitType === 'both'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {splitType === 'both' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold block text-zinc-200">Amândoi</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">50% - 50% Egal</span>
                  </button>

                  {/* Personalizat */}
                  <button
                    type="button"
                    onClick={() => setSplitType('custom')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      splitType === 'custom'
                        ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      {splitType === 'custom' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-xs font-bold block text-zinc-200">Personalizat</span>
                    <span className="text-[10px] text-amber-400 font-semibold">Procente / Sume</span>
                  </button>
                </div>
              </div>

              {/* Custom Split Inputs */}
              {splitType === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center">
                      <Sliders className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      Ajustează Procente sau Sume Exacte
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Total: <strong className="text-zinc-200">{totalNum.toLocaleString()} RON</strong>
                    </span>
                  </div>

                  {/* Range Slider for rapid percentage adjustment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-blue-400">Robert: {robertPercent}%</span>
                      <span className="text-purple-400">Iustin: {iustinPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={robertPercent}
                      onChange={(e) => handleRobertPercentChange(parseInt(e.target.value) || 0)}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Robert Custom Field */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 flex items-center">
                          <User className="w-3.5 h-3.5 mr-1" /> Robert
                        </span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={robertPercent}
                            onChange={(e) => handleRobertPercentChange(parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-center text-xs font-bold text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-zinc-400">%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Sumă Robert"
                          value={robertAmount}
                          onChange={(e) => handleRobertAmountChange(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">RON</span>
                      </div>
                    </div>

                    {/* Iustin Custom Field */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center">
                          <User className="w-3.5 h-3.5 mr-1" /> Iustin
                        </span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={iustinPercent}
                            onChange={(e) => handleIustinPercentChange(parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-center text-xs font-bold text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="text-xs text-zinc-400">%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Sumă Iustin"
                          value={iustinAmount}
                          onChange={(e) => handleIustinAmountChange(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">RON</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Real-time Split Preview Bar */}
              <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium">Repartiție Cheltuială Firmă:</span>
                  <span className="text-zinc-300 font-bold">
                    Robert: <strong className="text-blue-400">{parseFloat(robertAmount) || 0} lei ({robertPercent}%)</strong>
                    {' '}•{' '}
                    Iustin: <strong className="text-purple-400">{parseFloat(iustinAmount) || 0} lei ({iustinPercent}%)</strong>
                  </span>
                </div>
                
                {/* Visual Ratio Bar */}
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
                  <div 
                    style={{ width: `${robertPercent}%` }} 
                    className="h-full bg-blue-500 transition-all duration-300"
                    title={`Robert: ${robertPercent}%`}
                  />
                  <div 
                    style={{ width: `${iustinPercent}%` }} 
                    className="h-full bg-purple-500 transition-all duration-300"
                    title={`Iustin: ${iustinPercent}%`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: selectedCategories.length === 0 ? 1 : 1.01 }}
        whileTap={{ scale: selectedCategories.length === 0 ? 1 : 0.99 }}
        disabled={selectedCategories.length === 0}
        className={`w-full mt-4 py-3.5 px-6 text-white font-bold rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
          selectedCategories.length === 0 
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
            : isCompany
              ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-rose-900/30 focus:ring-rose-500'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-900/30 focus:ring-rose-500'
        }`}
      >
        {isCompany ? 'Înregistrează Cheltuiala (Pe Firmă)' : 'Înregistrează Cheltuiala'}
      </motion.button>
    </motion.form>
  );
};

export default ExpenseForm;
