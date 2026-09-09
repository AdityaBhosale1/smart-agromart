import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, Sparkles, TrendingUp, TrendingDown, RefreshCw, 
  AlertTriangle, ShieldAlert, Package, Calendar, Clock, DollarSign, 
  ArrowUpRight, ArrowDownRight, Layers, CheckCircle2, ChevronRight, 
  Zap, Info, Filter, ShoppingBag, Users, Lightbulb, PieChart, 
  BarChart2, FileText, ExternalLink, HelpCircle, AlertCircle, Award
} from 'lucide-react';

import { 
  ResponsiveContainer, ComposedChart, Line, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

import { 
  getAIOverview,
  initialSalesForecastData, 
  forecastFactors, 
  initialProductDemandForecast,
  seasonalDemandIntel,
  cropIntelData,
  frequentlyBoughtTogether,
  productPerformanceMatrix,
  slowMovingStockData,
  profitInsightsData,
  getDailyAIBrief
} from '../services/aiService';

import { initialMasterFarmers } from '../services/farmerService';

export const AIInsights = () => {
  // Filters & State
  const [forecastPeriod, setForecastPeriod] = useState('30 Days');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeSeason, setActiveSeason] = useState('Kharif');
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [deadStockDays, setDeadStockDays] = useState('30+ Days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveOverview, setLiveOverview] = useState(null);
  const [liveDemandForecast, setLiveDemandForecast] = useState([]);

  // Daily AI Brief List
  const [dailyBrief, setDailyBrief] = useState(getDailyAIBrief());

  useEffect(() => {
    let isMounted = true;
    getAIOverview().then(overview => {
      if (isMounted && overview) {
        setLiveOverview(overview);
        if (overview.demandForecast && overview.demandForecast.length > 0) {
          setLiveDemandForecast(overview.demandForecast);
        }
      }
    }).catch(err => {
      console.error('Error fetching live AI Overview:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Handle Refresh Action
  const handleRefreshInsights = async () => {
    setIsRefreshing(true);
    try {
      const overview = await getAIOverview();
      if (overview) {
        setLiveOverview(overview);
        if (overview.demandForecast && overview.demandForecast.length > 0) {
          setLiveDemandForecast(overview.demandForecast);
        }
      }
    } catch (err) {
      console.error('Error refreshing AI insights:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const demandSource = liveDemandForecast.length > 0 ? liveDemandForecast : initialProductDemandForecast;

  // Filtered Product Demand Data
  const filteredDemandData = useMemo(() => {
    return demandSource.filter(p => {
      return categoryFilter === 'All' || p.category === categoryFilter;
    });
  }, [demandSource, categoryFilter]);

  // Total Potential Stockout Count
  const stockoutRiskCount = useMemo(() => {
    return demandSource.filter(p => p.days_stock_left <= 14).length;
  }, [demandSource]);

  return (
    <div className="space-y-5 pb-8 font-sans">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#15803D] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">AI Insights</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI + Data Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                Rule-Based Forecast
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Smart sales forecasting, demand prediction, stock planning and farmer recommendations
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS & CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 font-bold">
            <span className="text-gray-500 pl-1">Period:</span>
            <select
              value={forecastPeriod}
              onChange={e => setForecastPeriod(e.target.value)}
              className="bg-white p-1 rounded-lg border border-gray-300 text-gray-900"
            >
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 font-bold">
            <span className="text-gray-500 pl-1">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white p-1 rounded-lg border border-gray-300 text-gray-900"
            >
              <option value="All">All Categories</option>
              <option value="Fertilizers">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Pesticides">Pesticides</option>
              <option value="Fungicides">Fungicides</option>
            </select>
          </div>

          <button
            onClick={handleRefreshInsights}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Insights</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 0: DAILY AI BRIEF (TODAY'S SMART BRIEF) */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#064E3B] via-[#043E2F] to-[#064E3B] text-white shadow-lg space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-['Outfit'] tracking-wide">Today's Smart Brief</h2>
              <p className="text-[11px] text-emerald-200 font-medium">Good Morning, Admin — Here are your priority shop insights for today</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-900/80 text-emerald-200 px-3 py-1 rounded-full border border-emerald-600">
            5 Priority Alerts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {dailyBrief.map(b => (
            <div key={b.id} className="p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between gap-2">
              <div className="space-y-1">
                <span className="font-extrabold text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {b.title}
                </span>
                <p className="text-[11px] text-emerald-100 font-normal leading-relaxed">{b.desc}</p>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => {
                    if (b.actionType === 'purchase') {
                      alert(`Navigating to Purchase Entry pre-filled with ${b.title}...`);
                    } else {
                      alert(`Opening ${b.title}...`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#064E3B] font-extrabold text-[10px] flex items-center gap-1"
                >
                  <span>{b.actionText}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AI SUMMARY CARDS (6 COMPACT CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Next Month Sales Forecast */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">Next Month Forecast</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">₹5,61,000</h3>
            <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +16.4% expected
            </span>
          </div>
        </div>

        {/* Card 2: Products Requiring Reorder */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">Reorder Needed</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-amber-950 font-['Outfit']">12 Products</h3>
            <span className="text-[10px] font-bold text-amber-700 mt-0.5 block">Below threshold</span>
          </div>
        </div>

        {/* Card 3: High Demand Products */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">High Demand</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-blue-950 font-['Outfit']">8 Products</h3>
            <span className="text-[10px] font-bold text-blue-700 mt-0.5 block">Monsoon surge</span>
          </div>
        </div>

        {/* Card 4: Potential Stockout Risk */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider">Stockout Risk</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-rose-950 font-['Outfit']">6 Products</h3>
            <span className="text-[10px] font-bold text-rose-700 mt-0.5 block">Critical &lt; 7 days</span>
          </div>
        </div>

        {/* Card 5: Expiring Stock Risk */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-orange-900 uppercase tracking-wider">Expiring Stock Risk</span>
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-orange-950 font-['Outfit']">₹18,450</h3>
            <span className="text-[10px] font-bold text-orange-700 mt-0.5 block">24 Batches &lt; 30 days</span>
          </div>
        </div>

        {/* Card 6: AI Recommendations */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">AI Insights</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-purple-950 font-['Outfit']">14 Active</h3>
            <span className="text-[10px] font-bold text-purple-700 mt-0.5 block">Actionable recommendations</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: SALES FORECAST (HISTORICAL + FORECAST GRAPH) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* RECHARTS HISTORICAL + FORECAST CHART */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Monthly Sales Forecast Engine</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Confidence: 82%
                </span>
              </div>
              <p className="text-xs text-gray-500">Historical Sales (Apr–Sep) + Projected Sales Forecast (Oct–Nov)</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-3 h-1 bg-[#064E3B] rounded-full inline-block"></span> Historical Sales
              </span>
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="w-3 h-1 bg-purple-600 rounded-full border-t border-dashed inline-block"></span> Forecasted Sales
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={initialSalesForecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} formatter={(val) => `₹${val / 1000}K`} />
                <Tooltip formatter={(val) => val ? `₹${val.toLocaleString('en-IN')}` : 'N/A'} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#F3E8FF" opacity={0.5} />
                <Line type="monotone" dataKey="historical" stroke="#064E3B" strokeWidth={3} dot={{ r: 4, fill: '#064E3B' }} />
                <Line type="monotone" dataKey="forecast" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 5, fill: '#8B5CF6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Prediction Callout: "Sales are expected to increase next month."</span>
                <span className="text-[11px] text-emerald-800">Expected Range: <strong>₹5.20L – ₹5.95L</strong> (Confidence Score: <strong>82%</strong>)</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-[#064E3B] text-white font-extrabold text-xs whitespace-nowrap">
              +16.4% Projected Growth
            </span>
          </div>
        </div>

        {/* FORECAST EXPLANATION BOX */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2 flex items-center justify-between">
              <span>Why this forecast?</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </h3>

            <div className="space-y-3 mt-3 text-xs">
              {forecastFactors.map(f => (
                <div key={f.factor} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 space-y-0.5">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{f.factor}</span>
                    <span className="text-emerald-700">{f.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium">{f.impact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>"Forecasts are estimates based on available sales and seasonal shop data. Does not guarantee exact future sales."</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 3 & 4: PRODUCT DEMAND FORECAST & SMART REORDER ENGINE */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Product Demand Forecast & Smart Reorder Engine</h3>
            <p className="text-gray-500 font-medium mt-0.5">
              Formula: <strong className="text-gray-900">Recommended Order = max(0, Predicted Demand + Safety Stock - Current Available Stock)</strong>
            </p>
          </div>
          <span className="text-[10px] font-extrabold bg-[#DCFCE7] text-[#15803D] px-3 py-1 rounded-full border border-emerald-300">
            Real-time Inventory Calculation
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-[#064E3B]/5 text-[#064E3B] font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Current Stock</th>
                <th className="p-3 text-center">30-Day Sales</th>
                <th className="p-3 text-center">Predicted Demand</th>
                <th className="p-3 text-center">Trend</th>
                <th className="p-3 text-center">Est. Days Left</th>
                <th className="p-3 text-center font-bold">Safety Stock</th>
                <th className="p-3 text-center font-extrabold text-[#064E3B]">Recommended Order</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredDemandData.map(p => (
                <tr key={p.id} className="hover:bg-emerald-50/40">
                  <td className="p-3 font-bold text-gray-900">
                    {p.name}
                    <span className="block text-[10px] text-gray-400 font-normal">{p.category}</span>
                  </td>
                  <td className="p-3 text-center font-bold text-gray-800">
                    {p.current_stock} {p.unit}
                  </td>
                  <td className="p-3 text-center text-gray-600">
                    {p.sales_30_days}
                  </td>
                  <td className="p-3 text-center font-extrabold text-[#15803D]">
                    {p.predicted_demand}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-700">
                    {p.trend}
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span className={p.days_stock_left <= 7 ? 'text-rose-700 font-extrabold' : 'text-gray-700'}>
                      {p.days_stock_left} Days
                    </span>
                  </td>
                  <td className="p-3 text-center font-semibold text-gray-600">
                    {p.safety_stock}
                  </td>
                  <td className="p-3 text-center font-extrabold text-lg text-purple-950">
                    {p.reorder_qty} {p.unit}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      p.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      p.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      p.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {p.reorder_qty > 0 ? (
                      <button
                        onClick={() => alert(`Pre-filling Supplier Purchase Order for ${p.name} (${p.reorder_qty} ${p.unit})...`)}
                        className="px-2.5 py-1 rounded-lg bg-[#064E3B] hover:bg-[#15803D] text-white font-bold text-[10px] transition-colors"
                      >
                        Create Purchase
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">Stock OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: SEASONAL DEMAND & CROP INTELLIGENCE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SEASONAL DEMAND INTELLIGENCE */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Seasonal Demand Intelligence</h3>
              <p className="text-gray-500 font-medium">Category demand predictions based on regional farming seasons</p>
            </div>
            
            {/* Season Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 font-bold">
              {['Kharif', 'Rabi', 'Summer'].map(season => (
                <button
                  key={season}
                  onClick={() => setActiveSeason(season)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeSeason === season ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {seasonalDemandIntel[activeSeason].map(s => (
              <div key={s.product} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-gray-900 text-xs block">{s.product}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{s.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">{s.trend}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    s.demand === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.demand} DEMAND
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 italic">
            "Demand estimates are based on seasonal category trends and available historical shop data."
          </p>
        </div>

        {/* CROP-BASED PRODUCT INTELLIGENCE */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Crop-Based Category Intelligence</h3>
              <p className="text-gray-500 font-medium">Safe shop-level product category recommendations by crop</p>
            </div>

            {/* Crop Selector */}
            <select
              value={selectedCrop}
              onChange={e => setSelectedCrop(e.target.value)}
              className="p-1.5 rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-900"
            >
              {Object.keys(cropIntelData).map(crop => (
                <option key={crop} value={crop}>{crop} Crop</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {cropIntelData[selectedCrop]?.suggested_categories.map(cat => (
              <div key={cat.name} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <span className="font-extrabold text-gray-900">{cat.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  cat.status === 'In Stock' ? 'bg-emerald-200 text-emerald-900' :
                  cat.status === 'Low Stock' ? 'bg-amber-200 text-amber-900' :
                  'bg-rose-200 text-rose-900'
                }`}>
                  {cat.status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 italic">
            "Recommendations provide retail shop inventory planning guidance without chemical dose prescription."
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: FARMER SMART RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div>
            <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Farmer Smart Recommendations</h3>
            <p className="text-gray-500 font-medium">Personalized product category suggestions based on crop profile, season & purchase history</p>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-300">
            Explainable AI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {initialMasterFarmers.slice(0, 3).map(farmer => (
            <div key={farmer.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">{farmer.name}</span>
                    <span className="text-[10px] text-gray-500">Crop: <strong>{farmer.primary_crop}</strong> ({farmer.village})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Suggested Categories</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-800 font-bold text-[10px]">
                      Micronutrients
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-800 font-bold text-[10px]">
                      Purple Blotch Fungicide
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-800 font-bold text-[10px]">
                      Soluble 0:0:50
                    </span>
                  </div>
                </div>

                {/* TRANSPARENCY BREAKDOWN BOX */}
                <div className="mt-3 p-2.5 rounded-xl bg-white border border-gray-200 text-[10px] space-y-1 text-gray-600">
                  <span className="font-extrabold text-gray-900 block">Why recommended?</span>
                  <div className="grid grid-cols-2 gap-1 font-medium">
                    <span>• Crop Match: <strong className="text-gray-900">{farmer.primary_crop}</strong></span>
                    <span>• Season: <strong className="text-gray-900">Kharif</strong></span>
                    <span>• History: <strong className="text-gray-900">Fertilizers</strong></span>
                    <span>• Stock: <strong className="text-emerald-700">Available</strong></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-gray-200">
                <button
                  onClick={() => alert(`Opening profile for ${farmer.name}...`)}
                  className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px]"
                >
                  View Farmer
                </button>
                <button
                  onClick={() => alert(`Pre-filling POS Billing for ${farmer.name}...`)}
                  className="py-2 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white text-[11px]"
                >
                  Create Bill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: PRODUCT PERFORMANCE MATRIX & SLOW MOVING / DEAD STOCK */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* PRODUCT PERFORMANCE MATRIX */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Product Performance Matrix</h3>
              <p className="text-gray-500 font-medium">Sales velocity and gross profit margin classification</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="divide-y divide-gray-100">
            {productPerformanceMatrix.map(m => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-gray-900 block">{m.name}</span>
                  <span className="text-[10px] text-gray-400">Margin: {m.margin}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-emerald-800">
                    ₹{m.monthly_profit.toLocaleString('en-IN')}/mo
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    m.classification === 'STAR' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    m.classification === 'FAST MOVING' ? 'bg-emerald-100 text-emerald-800' :
                    m.classification === 'HIGH MARGIN' ? 'bg-blue-100 text-blue-800' :
                    m.classification === 'SLOW MOVING' ? 'bg-orange-100 text-orange-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {m.classification}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLOW MOVING & DEAD STOCK ANALYSIS */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Slow Moving & Dead Stock</h3>
              <p className="text-gray-500 font-medium">Identifies capital blocked in low-velocity inventory</p>
            </div>
            
            <div className="flex items-center gap-1 font-bold text-[11px] bg-gray-100 p-1 rounded-xl">
              <span>Filter:</span>
              <select
                value={deadStockDays}
                onChange={e => setDeadStockDays(e.target.value)}
                className="bg-white p-1 rounded-lg border border-gray-300"
              >
                <option value="30+ Days">30+ Days</option>
                <option value="60+ Days">60+ Days</option>
                <option value="90+ Days">90+ Days</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center text-rose-950 font-bold">
            <span>Potential Dead Stock Capital Blocked:</span>
            <span className="text-base font-extrabold">₹42,650</span>
          </div>

          <div className="space-y-2">
            {slowMovingStockData.map(s => (
              <div key={s.product} className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{s.product}</span>
                  <span className="text-rose-700">₹{s.stock_value.toLocaleString('en-IN')} Value</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Stock: {s.stock} | Last Sold: {s.last_sold}</span>
                  <span className="font-bold text-[#064E3B]">Action: {s.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: EXPIRY RISK & PROFIT INTELLIGENCE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* PROFIT INSIGHTS (RECHARTS BAR CHART) */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Profit Insights</h3>
              <p className="text-xs text-gray-500">Gross profit forecast: <strong className="text-gray-900">₹1,42,000 / month</strong></p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              Highest Margin: 28%
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitInsightsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="product" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                <Bar dataKey="profit" fill="#15803D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER */}
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Frequently Bought Together</h3>
              <p className="text-gray-500 font-medium">Historical billing bundle combinations for cross-selling</p>
            </div>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-2">
            {frequentlyBoughtTogether.map((pair, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-gray-900 block">
                    {pair.itemA} <span className="text-emerald-700 font-normal">+</span> {pair.itemB}
                  </span>
                  <span className="text-[10px] text-gray-500">Bought together in {pair.frequency}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                  {pair.confidence} Match
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AIInsights;
