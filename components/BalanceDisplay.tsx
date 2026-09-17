import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface BalanceDisplayProps {
  total: number;
  count: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ total, count }) => {
  const formattedTotal = new Intl.NumberFormat('ro-RO', { 
    style: 'decimal', 
    maximumFractionDigits: 0 
  }).format(total);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl shadow-purple-900/10"
    >
      {/* Animated Background Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl"
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex items-center space-x-2 text-zinc-400 uppercase tracking-widest text-xs font-semibold">
          <Wallet className="w-4 h-4 text-purple-400" />
          <span>Balanța Totală</span>
        </div>
        
        <motion.h1 
          key={total} // Triggers animation when total changes
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl md:text-7xl font-bold text-emerald-400 tracking-tight drop-shadow-sm"
        >
          {formattedTotal} <span className="text-2xl md:text-4xl text-emerald-600">lei</span>
        </motion.h1>

        <div className="flex items-center space-x-2 text-sm text-zinc-500">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>{count} {count === 1 ? 'înregistrare' : 'înregistrări'} acumulate</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceDisplay;