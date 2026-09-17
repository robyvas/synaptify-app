import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';

interface IncomeChartProps {
  data: Transaction[];
  title?: string;
  categoryTitle?: string;
  theme?: 'emerald' | 'rose' | 'purple' | 'blue';
}

const THEME_CONFIG = {
  emerald: {
    stroke: '#10b981',
    gradientStop: '#10b981',
    itemColor: '#34d399',
    gradientId: 'colorAmountEmerald',
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16']
  },
  rose: {
    stroke: '#f43f5e',
    gradientStop: '#f43f5e',
    itemColor: '#fb7185',
    gradientId: 'colorAmountRose',
    colors: ['#f43f5e', '#ec4899', '#a855f7', '#f97316', '#eab308', '#06b6d4', '#64748b']
  },
  purple: {
    stroke: '#a855f7',
    gradientStop: '#a855f7',
    itemColor: '#c084fc',
    gradientId: 'colorAmountPurple',
    colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16']
  },
  blue: {
    stroke: '#3b82f6',
    gradientStop: '#3b82f6',
    itemColor: '#60a5fa',
    gradientId: 'colorAmountBlue',
    colors: ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16']
  }
};

const IncomeChart: React.FC<IncomeChartProps> = ({ 
  data, 
  title = "Evoluție Sume",
  categoryTitle = "Distribuție Categorii",
  theme = 'emerald'
}) => {
  if (data.length === 0) return null;

  const currentTheme = THEME_CONFIG[theme] || THEME_CONFIG.emerald;

  // 1. Process data for the Area Chart (Evolution)
  const chartData = [...data]
    .filter(item => {
      const d = new Date(item.date);
      return !isNaN(d.getTime());
    })
    .reverse()
    .map(item => ({
      name: new Date(item.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }),
      amount: Number(item.amount) || 0,
    }));

  // 2. Process data for the Pie Chart (Categories)
  const categoryMap: Record<string, number> = {};
  
  data.forEach(t => {
    let cats: string[] = [];
    
    if (Array.isArray(t.categories)) {
      cats = t.categories;
    } else if (typeof t.categories === 'string') {
      cats = [t.categories];
    } else {
      cats = ['Neclasificat'];
    }

    if (cats.length === 0) cats = ['Neclasificat'];

    // Split the amount evenly between categories to represent value distribution
    const splitAmount = t.amount / cats.length;
    
    cats.forEach(c => {
      categoryMap[c] = (categoryMap[c] || 0) + splitAmount;
    });
  });

  const pieData = Object.keys(categoryMap)
    .map(key => ({
      name: key,
      value: Math.round(categoryMap[key]),
    }))
    .sort((a, b) => b.value - a.value);

  // Group small categories into "Altele" if there are too many
  const MAX_CATEGORIES = 5;
  let finalPieData = pieData;
  if (pieData.length > MAX_CATEGORIES) {
    const topCategories = pieData.slice(0, MAX_CATEGORIES - 1);
    const otherCategories = pieData.slice(MAX_CATEGORIES - 1);
    const otherValue = otherCategories.reduce((acc, curr) => acc + curr.value, 0);
    finalPieData = [...topCategories, { name: 'Altele', value: otherValue }];
  }

  const totalPieValue = finalPieData.reduce((acc, curr) => acc + curr.value, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('ro-RO', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0];
      const percent = totalPieValue > 0 ? ((pData.value / totalPieValue) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl backdrop-blur-sm z-50">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pData.payload.fill || pData.fill }}></div>
             <p className="text-zinc-200 font-medium text-sm">{pData.name}</p>
          </div>
          <div className="flex flex-col">
             <span className={`${theme === 'rose' ? 'text-rose-400' : 'text-emerald-400'} font-bold text-lg leading-tight`}>
               {formatCurrency(pData.value)} lei
             </span>
             <span className="text-zinc-500 text-xs">
               Reprezintă {percent}% din total
             </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Evolution Chart */}
      <div className="h-80 w-full bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={currentTheme.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentTheme.gradientStop} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={currentTheme.gradientStop} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              width={45}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
              itemStyle={{ color: currentTheme.itemColor }}
              labelStyle={{ color: '#a1a1aa' }}
              formatter={(value: number) => [`${formatCurrency(value)} lei`, 'Sumă']}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={currentTheme.stroke} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#${currentTheme.gradientId})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Categories Chart */}
      <div className="h-80 w-full bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 relative shadow-xl">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">{categoryTitle}</h3>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Total</span>
          <span className="text-lg font-black text-zinc-100">{formatCurrency(totalPieValue)} lei</span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={finalPieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={1000}
            >
              {finalPieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={currentTheme.colors[index % currentTheme.colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: '10px', color: '#a1a1aa', paddingTop: '20px' }}
              formatter={(value) => <span className="text-zinc-400 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeChart;
