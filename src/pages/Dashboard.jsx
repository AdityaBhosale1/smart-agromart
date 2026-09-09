import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  AlertTriangle, 
  Users, 
  Trophy, 
  BrainCircuit, 
  Calendar, 
  Sparkles, 
  Sprout, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown,
  PackageCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  kpiStats as defaultKpiStats, 
  salesTrendData as defaultSalesTrendData, 
  topSellingProducts as defaultTopSellingProducts, 
  inventoryStatusData as defaultInventoryStatusData, 
  aiForecastData, 
  smartAlerts as defaultSmartAlerts 
} from '../data/mockData';
import { getDashboardMetrics } from '../services/dashboardService';
import { getNotifications } from '../services/notificationService';

export const Dashboard = () => {
  const [kpiStats, setKpiStats] = useState(defaultKpiStats);
  const [salesTrendData, setSalesTrendData] = useState(defaultSalesTrendData);
  const [topSellingProducts, setTopSellingProducts] = useState(defaultTopSellingProducts);
  const [inventoryStatusData, setInventoryStatusData] = useState(defaultInventoryStatusData);
  const [liveSmartAlerts, setLiveSmartAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getDashboardMetrics().then(data => {
      if (isMounted && data) {
        if (data.kpiStats) setKpiStats(data.kpiStats);
        if (data.salesTrendData) setSalesTrendData(data.salesTrendData);
        if (data.topSellingProducts) setTopSellingProducts(data.topSellingProducts);
        if (data.inventoryStatusData) setInventoryStatusData(data.inventoryStatusData);
      }
    }).catch(err => {
      console.error('Failed to fetch dashboard metrics:', err);
    });

    getNotifications().then(notifs => {
      if (isMounted && notifs && notifs.length > 0) {
        const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, INFO: 5 };
        const sorted = [...notifs].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
        setLiveSmartAlerts(sorted.slice(0, 4));
      }
    }).catch(() => {});

    setLoading(false);
    return () => { isMounted = false; };
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-4 pb-4">
      
      {/* ------------------------------------------------------------------ */}
      {/* 5. DASHBOARD WELCOME SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-white/90 via-emerald-50/60 to-white/90 border border-emerald-100/90 shadow-xs backdrop-blur-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-[#064E3B] font-['Outfit']">
              Welcome Back, Admin! 👋
            </h1>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-[#DCFCE7] rounded-full border border-emerald-200">
              Active Shop
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            Manage your shop &bull; Empower farmers &bull; Grow together
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* CURRENT DATE DISPLAY */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-gray-200/80 text-xs font-semibold text-gray-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#15803D]" />
            <span>{currentDate}</span>
          </div>

          {/* POSITIVE GREEN FARMING CARD */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#064E3B] text-white shadow-xs border border-emerald-700">
            <Sprout className="w-4 h-4 text-[#22C55E] shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white leading-none">Good Farming</span>
              <span className="text-[9px] text-emerald-300 leading-none mt-0.5">Brighter Tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. DASHBOARD KPI CARDS (6 STATISTIC CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiStats.map((kpi) => {
          const getIcon = (id) => {
            switch(id) {
              case 'sales': return ShoppingCart;
              case 'profit': return TrendingUp;
              case 'bills': return Receipt;
              case 'credit': return CreditCard;
              case 'stock': return AlertTriangle;
              case 'farmers': return Users;
              default: return ShoppingCart;
            }
          };
          const Icon = getIcon(kpi.id);

          return (
            <div 
              key={kpi.id} 
              className={`p-3.5 rounded-2xl border shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between ${kpi.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.accent}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  kpi.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{kpi.change}</span>
                </div>
              </div>

              <div className="mt-2 space-y-0.5">
                <span className="text-[10px] font-semibold opacity-75 block">{kpi.title}</span>
                <span className="text-base font-extrabold font-['Outfit'] tracking-tight block">
                  {kpi.value}
                </span>
              </div>

              {/* MINI SPARKLINE DECORATION */}
              <div className="mt-2 flex items-end gap-1 h-4 pt-1 border-t border-black/5 opacity-70">
                {kpi.sparkline.map((val, idx) => (
                  <div 
                    key={idx} 
                    className="flex-1 bg-current rounded-t-sm opacity-60 hover:opacity-100 transition-opacity" 
                    style={{ height: `${(val / 100) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7 & 8: SALES TREND CHART + TOP SELLING PRODUCTS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 7. SALES TREND CHART */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#15803D] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">Sales Trend</h3>
            </div>
            
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-600 cursor-pointer">
              <span>Last 7 Days</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `₹${val/1000}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#064E3B', borderRadius: '10px', color: '#fff', fontSize: '11px', border: 'none' }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#15803D" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. TOP SELLING PRODUCTS */}
        <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">Top Selling Products</h3>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[9px]">
                  <th className="pb-1.5">#</th>
                  <th className="pb-1.5">Product</th>
                  <th className="pb-1.5 text-right">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topSellingProducts.map((item) => (
                  <tr key={item.rank} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-1.5 font-bold text-gray-400 text-[11px]">{item.rank}</td>
                    <td className="py-1.5 font-bold text-[#064E3B] text-[11px]">
                      <div>{item.name}</div>
                    </td>
                    <td className="py-1.5 text-right font-extrabold text-emerald-700 text-[11px]">
                      {item.units}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 9 & 10: INVENTORY STATUS + AI SALES FORECAST */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 9. INVENTORY STATUS DONUT CHART */}
        <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#15803D] flex items-center justify-center">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">Inventory Status</h3>
          </div>

          <div className="relative h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] uppercase font-bold text-gray-400">Total</span>
              <span className="text-lg font-extrabold text-[#064E3B] font-['Outfit'] leading-none">320</span>
              <span className="text-[9px] text-gray-500 font-semibold">Products</span>
            </div>
          </div>

          {/* LEGEND BADGES */}
          <div className="grid grid-cols-2 gap-1.5 text-xs pt-2 border-t border-gray-100">
            {inventoryStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1 rounded-md bg-gray-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="font-bold text-[#064E3B] text-[10px]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 10. AI SALES FORECAST CARD */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#064E3B] to-[#15803D] text-white flex items-center justify-center shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">AI Sales Forecast</h3>
                <span className="text-[9px] text-emerald-700 font-semibold">Predictive Demand Intelligence</span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-[#DCFCE7] rounded-full border border-emerald-300">
              Live AI Model
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* CHART */}
            <div className="md:col-span-2 h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiForecastData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `₹${val/1000}K`} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Predicted']} />
                  <Line type="monotone" dataKey="sales" stroke="#15803D" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="forecast" stroke="#22C55E" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT PREDICTION BOX */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#064E3B] to-[#15803D] text-white space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-200 text-[11px] font-semibold">
                <span>Predicted Sales</span>
                <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
              </div>
              <span className="text-[10px] text-emerald-300 block">Next Month</span>
              <div className="text-xl font-extrabold text-white font-['Outfit']">
                ₹62,000
              </div>
              <span className="inline-block px-1.5 py-0.5 rounded bg-[#22C55E] text-[#064E3B] font-extrabold text-[10px]">
                +20% Growth
              </span>
              <p className="text-[9px] text-emerald-100/80 pt-0.5 leading-tight">
                Based on past data & Kharif seasonal trends.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 11 & 12: SMART ALERTS + AI INSIGHTS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 11. SMART ALERTS */}
        <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">Smart Alerts</h3>
            </div>
            <button className="text-[11px] font-bold text-emerald-700 hover:underline">View All</button>
          </div>

          <div className="space-y-2 flex-1">
            {(liveSmartAlerts.length > 0 ? liveSmartAlerts : defaultSmartAlerts).map((alert) => (
              <div key={alert.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-800 leading-snug">{alert.title}</p>
                  <span className="text-[9px] text-gray-400 block">{alert.created_at || alert.time || 'Today'}</span>
                </div>
                <button className={`px-2 py-0.5 rounded-md hover:opacity-80 text-[9px] font-bold shrink-0 ${
                  alert.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                  alert.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {alert.action_label || alert.actionText || 'View'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 12. AI INSIGHTS SECTION */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs backdrop-blur-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#22C55E]" />
            <h3 className="font-bold text-sm text-[#064E3B] font-['Outfit']">AI Business Insights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* DEMAND FORECAST */}
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider">Demand Forecast</span>
                <h4 className="font-extrabold text-xs text-[#064E3B]">DAP Fertilizer</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Stock: 35 Bags | Demand: 52 Bags</p>
              </div>
              <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-emerald-700">Order +25 Bags</span>
                <span className="px-1 py-0.5 text-[8px] font-extrabold bg-rose-500 text-white rounded">HIGH</span>
              </div>
            </div>

            {/* SMART REORDER */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-amber-800 tracking-wider">Smart Reorder</span>
                <h4 className="font-extrabold text-xs text-[#064E3B]">Urea 45kg</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Stock: 8 Bags | 30-Day: 42 Bags</p>
              </div>
              <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-amber-800">Recommend: 40 Bags</span>
                <span className="px-1 py-0.5 text-[8px] font-extrabold bg-rose-500 text-white rounded">HIGH</span>
              </div>
            </div>

            {/* SEASONAL DEMAND */}
            <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-sky-800 tracking-wider">Seasonal Demand</span>
                <h4 className="font-extrabold text-xs text-[#064E3B]">Kharif Monsoon</h4>
                <p className="text-[9px] text-gray-600 mt-0.5">Soybean Seeds, Fungicides & DAP high.</p>
              </div>
              <div className="pt-1.5 border-t border-sky-200/60 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-sky-800">Agro Climate AI</span>
                <span className="px-1 py-0.5 text-[8px] font-extrabold bg-emerald-600 text-white rounded">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
