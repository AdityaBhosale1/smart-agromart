import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, FileSpreadsheet, FileText, Download, Calendar, Filter, 
  Printer, RefreshCw, DollarSign, TrendingUp, ShoppingBag, Users, 
  CreditCard, PieChart as PieIcon, Layers, CheckCircle2, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Info, HelpCircle, Package, Scale, 
  Clock, ShieldAlert, Sparkles, Sliders, Eye
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

import { 
  getReportOverviewData,
  initialDailySalesTrend,
  initialSalesByCategory,
  initialTopSellingProductsReport,
  initialGSTRateBreakup,
  initialGSTInvoiceSummary,
  initialInventoryValuationReport,
  initialPaymentMethodDistribution,
  initialTopVillagesReport,
  getDailyBusinessSummary,
  getMonthlyBusinessSummary,
  getLiveReportsData,
  exportToCSV
} from '../services/reportService';

import { initialMasterProducts } from '../services/productService';
import { initialMasterSuppliers } from '../services/supplierService';
import { initialMasterFarmers } from '../services/farmerService';

export const Reports = () => {
  // Global Filters State
  const [dateRange, setDateRange] = useState('This Month');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [productFilter, setProductFilter] = useState('All Products');
  const [farmerFilter, setFarmerFilter] = useState('All Farmers');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Active Report Tab: 'overview' | 'sales' | 'profit' | 'gst' | 'inventory' | 'purchases' | 'credit' | 'farmers' | 'ai' | 'builder'
  const [activeTab, setActiveTab] = useState('overview');

  // Custom Report Builder State
  const [customReportType, setCustomReportType] = useState('Sales');
  const [customColumns, setCustomColumns] = useState(['Date', 'Invoice', 'Customer', 'Category', 'Total', 'Profit']);

  // Fetch live reports data on mount and whenever filters change
  const loadReports = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const res = await getLiveReportsData({
        dateRange,
        categoryFilter,
        productFilter,
        farmerFilter,
        paymentMethodFilter
      });
      if (res) {
        setReportData(res);
      }
    } catch (e) {
      console.error('Error loading live reports from Supabase:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange, categoryFilter, productFilter, farmerFilter, paymentMethodFilter]);

  // Handle Refresh Action
  const handleRefreshData = () => {
    loadReports();
  };

  // Export CSV Handler
  const handleExportExcel = () => {
    if (activeTab === 'overview' || activeTab === 'sales') {
      exportToCSV('sales_products_report', topSellingProductsReport);
    } else if (activeTab === 'gst') {
      exportToCSV('gst_rate_breakup_report', gstRateBreakup);
    } else if (activeTab === 'inventory') {
      exportToCSV('inventory_valuation_report', inventoryValuationReport);
    } else if (activeTab === 'purchases') {
      exportToCSV('supplier_purchases_report', supplierReport);
    } else if (activeTab === 'farmers') {
      exportToCSV('farmer_analytics_report', farmerAnalytics.top_farmers);
    } else {
      exportToCSV('smart_agromart_report', topSellingProductsReport);
    }
  };

  // Aggregated Report Metrics (Live with fallback)
  const overview = reportData?.overview || getReportOverviewData();
  const dailySummary = reportData?.dailyBusinessSummary || getDailyBusinessSummary();
  const monthlySummary = reportData?.monthlyBusinessSummary || getMonthlyBusinessSummary();
  const dailySalesTrend = reportData?.dailySalesTrend || initialDailySalesTrend;
  const salesByCategory = reportData?.salesByCategory || initialSalesByCategory;
  const topSellingProductsReport = reportData?.topSellingProductsReport || initialTopSellingProductsReport;
  const gstRateBreakup = reportData?.gstRateBreakup || initialGSTRateBreakup;
  const inventoryValuationReport = reportData?.inventoryValuationReport || initialInventoryValuationReport;
  const paymentMethodDistribution = reportData?.paymentMethodDistribution || initialPaymentMethodDistribution;
  const purchaseReport = reportData?.purchaseReport || { total_purchases: 0, purchase_count: 0, paid_to_suppliers: 0, pending_supplier_payable: 0 };
  const supplierReport = reportData?.supplierReport || [];
  const farmerAnalytics = reportData?.farmerAnalytics || { total_farmers: 0, active_farmers: 0, farmers_with_credit: 0, new_farmers_this_month: 0, avg_spend_per_farmer: 0, top_farmers: [] };
  const billingRegister = reportData?.billingRegister || [];
  const expiryReport = reportData?.expiryReport || [];

  return (
    <div className="space-y-5 pb-8 font-sans print:p-0">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">Reports & Analytics</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-emerald-300">
                ERP Analytics
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Analyze sales, profit, GST, inventory, credit, purchases and farmer activity
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#064E3B] font-bold border border-emerald-300 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#15803D]" />
            <span>Export Excel (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GLOBAL REPORT FILTERS BAR */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Date Range Filter */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700">Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300 bg-gray-50 font-semibold text-gray-900"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Financial Year">This Financial Year</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300 bg-gray-50 font-semibold text-gray-900"
            >
              <option value="All Categories">All Categories</option>
              <option value="Fertilizers">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Pesticides">Pesticides</option>
              <option value="Fungicides">Fungicides</option>
              <option value="Tools">Tools</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700">Product</label>
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300 bg-gray-50 font-semibold text-gray-900"
            >
              <option value="All Products">All Products</option>
              {initialMasterProducts.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Farmer Filter */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700">Farmer</label>
            <select
              value={farmerFilter}
              onChange={e => setFarmerFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300 bg-gray-50 font-semibold text-gray-900"
            >
              <option value="All Farmers">All Farmers</option>
              {initialMasterFarmers.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300 bg-gray-50 font-semibold text-gray-900"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">
            Active Filter Context: <strong className="text-gray-900">{dateRange}</strong> | Category: <strong className="text-gray-900">{categoryFilter}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              className="px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#064E3B] text-white font-bold"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setDateRange('This Month');
                setCategoryFilter('All Categories');
                setProductFilter('All Products');
                setFarmerFilter('All Farmers');
                setPaymentMethodFilter('All');
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HORIZONTAL REPORT NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar p-1 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-bold print:hidden">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'sales', label: 'Sales Report' },
          { id: 'profit', label: 'Profit Analysis' },
          { id: 'gst', label: 'GST Report' },
          { id: 'inventory', label: 'Inventory Valuation' },
          { id: 'purchases', label: 'Purchases' },
          { id: 'credit', label: 'Credit Ledger' },
          { id: 'farmers', label: 'Farmer Analytics' },
          { id: 'ai', label: 'AI Reports' },
          { id: 'builder', label: 'Custom Builder' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#064E3B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & 6 SUMMARY CARDS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          
          {/* 6 REPORT OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            
            {/* Total Sales */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">Total Sales</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">₹{overview.total_sales.toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">{monthlySummary.sales_growth_pct} vs last month</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-teal-900 uppercase tracking-wider">Gross Profit</span>
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-teal-950 font-['Outfit']">₹{overview.gross_profit.toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">Margin: {overview.profit_margin_pct}%</span>
              </div>
            </div>

            {/* Total Bills */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">Total Bills</span>
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-blue-950 font-['Outfit']">{overview.total_bills}</h3>
                <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Avg bill: ₹{overview.avg_bill_value}</span>
              </div>
            </div>

            {/* GST Collected */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">GST Collected</span>
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-amber-950 font-['Outfit']">₹{overview.gst_collected.toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">CGST + SGST</span>
              </div>
            </div>

            {/* Outstanding Credit */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">Outstanding Credit</span>
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-purple-950 font-['Outfit']">₹{overview.outstanding_credit.toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">Farmer accounts</span>
              </div>
            </div>

            {/* Purchase Value */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-orange-900 uppercase tracking-wider">Purchase Value</span>
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-lg font-extrabold text-orange-950 font-['Outfit']">₹{overview.purchase_value.toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-orange-700 font-semibold mt-0.5 block">Stock Inwards</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* DAILY BUSINESS SUMMARY & MONTHLY COMPARISON */}
            <div className="space-y-4">
              
              {/* Daily Business Summary Card */}
              <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-2.5 text-xs">
                <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2 flex items-center justify-between">
                  <span>Today's Business Summary ({dailySummary.date})</span>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </h3>
                <div className="space-y-1.5 font-medium text-gray-700">
                  <div className="flex justify-between"><span>Opening Stock Value:</span><span className="font-bold">₹{dailySummary.opening_stock_value.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-emerald-800"><span>Today's Sales:</span><span className="font-extrabold">₹{dailySummary.today_sales.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-orange-800"><span>Today's Purchases:</span><span className="font-bold">₹{dailySummary.today_purchases.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-teal-800 font-bold border-t pt-1"><span>Today's Gross Profit:</span><span>₹{dailySummary.today_gross_profit.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-purple-800"><span>Credit Given:</span><span className="font-bold">₹{dailySummary.today_credit_given.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-emerald-700"><span>Credit Collected:</span><span className="font-bold">₹{dailySummary.today_credit_collected.toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Monthly Business Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-2 text-xs">
                <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b border-emerald-200 pb-2">
                  Monthly Growth Comparison
                </h3>
                <div className="space-y-1.5 font-medium text-emerald-950">
                  <div className="flex justify-between"><span>This Month Sales:</span><span className="font-extrabold">₹{monthlySummary.this_month_sales.toLocaleString('en-IN')} ({monthlySummary.sales_growth_pct})</span></div>
                  <div className="flex justify-between"><span>This Month Profit:</span><span className="font-extrabold">₹{monthlySummary.this_month_profit.toLocaleString('en-IN')} ({monthlySummary.profit_growth_pct})</span></div>
                  <div className="flex justify-between"><span>Total Invoices:</span><span className="font-bold">{monthlySummary.this_month_bills} Bills ({monthlySummary.bills_growth_pct})</span></div>
                </div>
              </div>

            </div>

            {/* RECHARTS COMBINED SALES & PROFIT TREND */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Daily Sales & Profit Trend</h3>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-emerald-800"><span className="w-3 h-1 bg-[#15803D] rounded-full inline-block"></span> Sales</span>
                  <span className="flex items-center gap-1 text-teal-700"><span className="w-3 h-1 bg-[#0D9488] rounded-full inline-block"></span> Profit</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySalesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReportSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803D" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#15803D" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorReportProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} formatter={(v) => `₹${v / 1000}K`} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="sales" stroke="#15803D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReportSales)" />
                    <Area type="monotone" dataKey="profit" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReportProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALES REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center font-bold">
            <div className="p-2 rounded-xl bg-emerald-50">
              <span className="text-gray-500 block text-[10px]">Total Sales</span>
              <span className="text-base text-[#064E3B] font-extrabold">₹{overview.total_sales.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50">
              <span className="text-gray-500 block text-[10px]">Avg Daily Sales</span>
              <span className="text-base text-blue-900 font-extrabold">₹{overview.avg_daily_sales.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-50">
              <span className="text-gray-500 block text-[10px]">Number of Bills</span>
              <span className="text-base text-purple-900 font-extrabold">{overview.total_bills}</span>
            </div>
            <div className="p-2 rounded-xl bg-teal-50">
              <span className="text-gray-500 block text-[10px]">Average Bill Value</span>
              <span className="text-base text-teal-900 font-extrabold">₹{overview.avg_bill_value}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50">
              <span className="text-gray-500 block text-[10px]">Highest Sales Day</span>
              <span className="text-base text-amber-900 font-extrabold">₹{overview.highest_sales_day.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">Top Selling Products Register</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 font-bold text-gray-700 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-center">Units Sold</th>
                    <th className="p-2.5 text-right">Revenue</th>
                    <th className="p-2.5 text-right">Profit</th>
                    <th className="p-2.5 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topSellingProductsReport.map(p => (
                    <tr key={p.rank} className="hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-gray-500">#{p.rank}</td>
                      <td className="p-2.5 font-extrabold text-gray-900">{p.name}</td>
                      <td className="p-2.5 text-gray-600">{p.category}</td>
                      <td className="p-2.5 text-center font-bold">{p.units_sold}</td>
                      <td className="p-2.5 text-right font-extrabold text-[#064E3B]">₹{p.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">₹{p.profit.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-bold text-gray-700">{p.margin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GST REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'gst' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-center font-bold">
            <div className="p-3 rounded-2xl bg-white border border-gray-200">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Taxable Sales</span>
              <span className="text-lg font-extrabold text-gray-900">₹{overview.taxable_sales.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">CGST (Central Tax)</span>
              <span className="text-lg font-extrabold text-emerald-800">₹{overview.cgst.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">SGST (State Tax)</span>
              <span className="text-lg font-extrabold text-teal-800">₹{overview.sgst.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Total GST Payable</span>
              <span className="text-lg font-extrabold text-amber-900">₹{overview.gst_collected.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">GST Rate Breakup Summary (GSTR-1 / GSTR-3B Format)</h3>
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">GST Tax Slab</th>
                  <th className="p-2.5 text-right">Taxable Value</th>
                  <th className="p-2.5 text-right">CGST</th>
                  <th className="p-2.5 text-right">SGST</th>
                  <th className="p-2.5 text-right font-extrabold text-[#064E3B]">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gstRateBreakup.map(g => (
                  <tr key={g.rate}>
                    <td className="p-2.5 font-bold text-gray-900">{g.rate}</td>
                    <td className="p-2.5 text-right font-medium">₹{g.taxable.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-emerald-800 font-bold">₹{g.cgst.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-teal-800 font-bold">₹{g.sgst.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-extrabold text-[#064E3B]">₹{g.total_gst.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVENTORY VALUATION REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs flex justify-between items-center text-xs">
            <div>
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Total Inventory Valuation</h3>
              <p className="text-gray-500 font-medium">Calculated as Stock × Purchase Cost vs Potential Selling Value</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Stock Asset Value</span>
              <span className="text-xl font-extrabold text-[#064E3B]">₹{(reportData?.totalStockAssetValue || 682400).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">Inventory Stock Valuation Table</h3>
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-center">Stock</th>
                  <th className="p-2.5 text-right">Purchase Cost</th>
                  <th className="p-2.5 text-right">Stock Value</th>
                  <th className="p-2.5 text-right">Selling Value</th>
                  <th className="p-2.5 text-right text-emerald-800 font-extrabold">Potential Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {inventoryValuationReport.map(v => (
                  <tr key={v.product}>
                    <td className="p-2.5 font-bold text-gray-900">{v.product}</td>
                    <td className="p-2.5 text-gray-500">{v.category}</td>
                    <td className="p-2.5 text-center font-bold">{v.stock} {v.unit}</td>
                    <td className="p-2.5 text-right">₹{v.purchase_cost}</td>
                    <td className="p-2.5 text-right font-bold text-gray-900">₹{v.stock_value.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-800">₹{v.selling_value.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-extrabold text-[#064E3B]">₹{v.margin.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PURCHASES REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center font-bold">
            <div className="p-2.5 rounded-xl bg-orange-50">
              <span className="text-gray-500 block text-[10px]">Total Purchases</span>
              <span className="text-base text-orange-950 font-extrabold">₹{purchaseReport.total_purchases.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <span className="text-gray-500 block text-[10px]">Purchase Inwards Count</span>
              <span className="text-base text-blue-900 font-extrabold">{purchaseReport.purchase_count}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <span className="text-gray-500 block text-[10px]">Paid to Suppliers</span>
              <span className="text-base text-emerald-900 font-extrabold">₹{purchaseReport.paid_to_suppliers.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50">
              <span className="text-gray-500 block text-[10px]">Pending Supplier Payable</span>
              <span className="text-base text-rose-900 font-extrabold">₹{purchaseReport.pending_supplier_payable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">Supplier Purchase Summary Table</h3>
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Supplier Name</th>
                  <th className="p-2.5 text-center">Orders Count</th>
                  <th className="p-2.5 text-right">Total Purchases</th>
                  <th className="p-2.5 text-right">Amount Paid</th>
                  <th className="p-2.5 text-right text-rose-700 font-extrabold">Pending Payable</th>
                  <th className="p-2.5">Last Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {supplierReport.map(s => (
                  <tr key={s.supplier}>
                    <td className="p-2.5 font-bold text-gray-900">{s.supplier}</td>
                    <td className="p-2.5 text-center font-bold">{s.purchase_count}</td>
                    <td className="p-2.5 text-right font-bold text-gray-900">₹{s.total_purchase_value.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-bold">₹{s.paid.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-rose-700 font-extrabold">₹{s.pending.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-gray-600 font-mono">{s.last_purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FARMER ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'farmers' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center font-bold">
            <div className="p-2.5 rounded-xl bg-teal-50">
              <span className="text-gray-500 block text-[10px]">Total Registered Farmers</span>
              <span className="text-base text-teal-950 font-extrabold">{farmerAnalytics.total_farmers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <span className="text-gray-500 block text-[10px]">Active Farmers</span>
              <span className="text-base text-emerald-900 font-extrabold">{farmerAnalytics.active_farmers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50">
              <span className="text-gray-500 block text-[10px]">Farmers With Credit</span>
              <span className="text-base text-purple-900 font-extrabold">{farmerAnalytics.farmers_with_credit}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <span className="text-gray-500 block text-[10px]">New Farmers (This Month)</span>
              <span className="text-base text-blue-900 font-extrabold">{farmerAnalytics.new_farmers_this_month}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <span className="text-gray-500 block text-[10px]">Avg Spend / Farmer</span>
              <span className="text-base text-amber-900 font-extrabold">₹{farmerAnalytics.avg_spend_per_farmer.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">Top Purchasing Farmers Table</h3>
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Farmer Name</th>
                  <th className="p-2.5">Village</th>
                  <th className="p-2.5">Primary Crop</th>
                  <th className="p-2.5 text-center">Bills Count</th>
                  <th className="p-2.5 text-right">Total Spend</th>
                  <th className="p-2.5 text-right text-purple-900 font-extrabold">Pending Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(farmerAnalytics.top_farmers || []).map(f => (
                  <tr key={f.farmer}>
                    <td className="p-2.5 font-bold text-gray-900">{f.farmer}</td>
                    <td className="p-2.5 text-gray-600">{f.village}</td>
                    <td className="p-2.5 text-gray-600">{f.crop}</td>
                    <td className="p-2.5 text-center font-bold">{f.bills_count}</td>
                    <td className="p-2.5 text-right font-extrabold text-[#064E3B]">₹{f.total_purchases.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-purple-900 font-extrabold">₹{f.pending_credit.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: CUSTOM REPORT BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'builder' && (
        <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="border-b pb-2">
            <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Custom Report Builder</h3>
            <p className="text-gray-500 font-medium">Select parameters and dimensions to build custom ERP export files</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Report Module Type</label>
              <select
                value={customReportType}
                onChange={e => setCustomReportType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-bold"
              >
                <option value="Sales">Sales & Invoices</option>
                <option value="Inventory">Inventory Valuation & Batches</option>
                <option value="Purchases">Purchases & Supplier Stock Inward</option>
                <option value="Credit">Credit / Digital Khata Accounts</option>
                <option value="Farmers">Farmer Purchase Registers</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Date Range Filter</label>
              <select className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-medium">
                <option>This Month</option>
                <option>Last 30 Days</option>
                <option>Current Kharif Season</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Output Format</label>
              <select className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-bold">
                <option>Excel Worksheet (.xlsx / CSV)</option>
                <option>PDF Document (.pdf)</option>
                <option>CSV Format (.csv)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              onClick={handleExportExcel}
              className="px-5 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate & Download CSV Report</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
