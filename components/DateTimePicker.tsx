import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, setHours, setMinutes, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO String
  onChange: (value: string) => void;
  label?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? parseISO(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? parseISO(value) : new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = parseISO(value);
      setSelectedDate(date);
      setViewDate(date);
    }
  }, [value]);

  // Calendar Logic
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleDateSelect = (day: Date) => {
    const newDate = setHours(setMinutes(day, selectedDate.getHours()), selectedDate.getMinutes());
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type: 'h' | 'm', val: number) => {
    let newDate = new Date(selectedDate);
    if (type === 'h') newDate = setHours(newDate, val);
    else newDate = setMinutes(newDate, val);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onChange(selectedDate.toISOString());
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="text-xs font-medium text-zinc-500 uppercase mb-1.5 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-100 flex items-center justify-between hover:border-zinc-700 transition-all focus:ring-2 focus:ring-purple-500/50 outline-none"
      >
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-4 h-4 text-purple-400" />
          <span>{value ? format(parseISO(value), 'dd MMM yyyy, HH:mm', { locale: ro }) : 'Selectează data și ora'}</span>
        </div>
        <Clock className="w-4 h-4 text-zinc-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div className="fixed inset-0 z-[110] md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 lg:absolute lg:inset-auto lg:top-full lg:left-0 lg:mt-2 z-[120] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-auto lg:w-[320px] max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
                <div className="flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={() => setViewDate(subMonths(viewDate, 1))}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-zinc-100 min-w-[100px] text-center capitalize">
                    {format(viewDate, 'MMMM yyyy', { locale: ro })}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setViewDate(addMonths(viewDate, 1))}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="lg:hidden text-zinc-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto no-scrollbar">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-zinc-600">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                            : isCurrentMonth 
                              ? 'text-zinc-300 hover:bg-zinc-800' 
                              : 'text-zinc-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                {/* Time Picker */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Ora</span>
                      <div className="h-24 overflow-y-auto no-scrollbar w-12 snap-y snap-mandatory custom-scrollbar">
                        {hours.map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleTimeChange('h', h)}
                            className={`h-8 w-full flex items-center justify-center text-sm font-mono snap-center transition-all ${
                              selectedDate.getHours() === h ? 'text-purple-400 font-bold scale-110' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                          >
                            {h.toString().padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-zinc-700 font-bold self-end mb-8">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Min</span>
                      <div className="h-24 overflow-y-auto no-scrollbar w-12 snap-y snap-mandatory custom-scrollbar">
                        {minutes.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleTimeChange('m', m)}
                            className={`h-8 w-full flex items-center justify-center text-sm font-mono snap-center transition-all ${
                              selectedDate.getMinutes() === m ? 'text-purple-400 font-bold scale-110' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                          >
                            {m.toString().padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmă</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateTimePicker;
