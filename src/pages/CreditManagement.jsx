import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Send, FileSpreadsheet, CheckCircle2, 
  AlertCircle, Search, Filter, RefreshCw, Plus, UserCheck, 
  Calendar, Clock, ShieldAlert, FileText, Printer, Download, 
  MessageSquare, ChevronRight, X, ArrowUpRight, ArrowDownLeft, 
  BarChart3, PieChart as PieIcon, AlertTriangle, Check, Layers,
  Copy, Smartphone, UserX, ShieldCheck, Scale
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

import { initialMasterFarmers } from '../services/farmerService';
import { 
  initialMasterCreditAccounts, 
  initialMasterCreditLedger, 
  initialCreditTrend, 
  initialCreditAgingData,
  calculateCreditRisk,
  getFarmersWithCredit,
  getFarmerLedger,
  recordFarmerPayment
} from '../services/creditService';

export const CreditManagement = () => {
  // Shared & Local State
  const [creditAccounts, setCreditAccounts] = useState(initialMasterCreditAccounts);
  const [ledgerEntries, setLedgerEntries] = useState(initialMasterCreditLedger);
  const [farmers, setFarmers] = useState(initialMasterFarmers);
  const [loading, setLoading] = useState(true);

  // Fetch live credit data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      setLoading(true);
      try {
        const [accs, ledger] = await Promise.all([
          getFarmersWithCredit(),
          getFarmerLedger()
        ]);
        if (isMounted) {
          if (accs && accs.length > 0) setCreditAccounts(accs);
          if (ledger && ledger.length > 0) setLedgerEntries(ledger);
        }
      } catch (err) {
        console.error('Failed to load credit data from Supabase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLiveData();
    return () => { isMounted = false; };
  }, []);

  // Active View Tab: 'accounts' (Farmer Credit List) | 'ledger' (Global Ledger) | 'aging' (Aging & Analytics)
  const [activeTab, setActiveTab] = useState('accounts');

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dueDateFilter, setDueDateFilter] = useState('All');
  const [villageFilter, setVillageFilter] = useState('All');
  const [amountRangeFilter, setAmountRangeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Objects & Modals
  const [selectedKhata, setSelectedKhata] = useState(null); // Farmer Khata Drawer
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentKhata, setPaymentKhata] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null); // Payment Receipt Modal
  const [reminderModalFarmer, setReminderModalFarmer] = useState(null); // Individual WhatsApp Reminder
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [bulkFilterType, setBulkFilterType] = useState('Overdue');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // =========================================================================
  // RECORD PAYMENT FORM STATE
  // =========================================================================
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    farmer_id: '',
    payment_amount: 1000,
    payment_method: 'UPI',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: 'Khata partial repayment'
  });

  // Credit Adjustment Form State
  const [adjustmentForm, setAdjustmentForm] = useState({
    farmer_id: '',
    adjustment_type: 'Waiver', // Waiver, Discount Settlement, Write-off
    amount: 100,
    notes: ''
  });

  // =========================================================================
  // KPI CALCULATED METRICS
  // =========================================================================
  const totalOutstandingCredit = useMemo(() => {
    return creditAccounts.reduce((sum, acc) => sum + acc.current_pending, 0);
  }, [creditAccounts]);

  const pendingFarmersCount = useMemo(() => {
    return creditAccounts.filter(acc => acc.current_pending > 0).length;
  }, [creditAccounts]);

  const totalOverdueAmount = useMemo(() => {
    return creditAccounts.reduce((sum, acc) => sum + acc.overdue_amount, 0);
  }, [creditAccounts]);

  const dueThisWeekAmount = useMemo(() => {
    // Calculated mock due this week
    return 26400;
  }, []);

  const paymentsReceivedThisMonth = useMemo(() => {
    return 65800;
  }, []);

  const avgCreditPerFarmer = useMemo(() => {
    if (pendingFarmersCount === 0) return 0;
    return Math.round(totalOutstandingCredit / pendingFarmersCount);
  }, [totalOutstandingCredit, pendingFarmersCount]);

  // Unique Villages List for Filter
  const villagesList = useMemo(() => {
    const vSet = new Set(creditAccounts.map(a => a.village));
    return Array.from(vSet);
  }, [creditAccounts]);

  // =========================================================================
  // FILTERED CREDIT ACCOUNTS
  // =========================================================================
  const filteredCreditAccounts = useMemo(() => {
    return creditAccounts.filter(acc => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        acc.farmer_name.toLowerCase().includes(q) ||
        acc.mobile.includes(q) ||
        acc.farmer_code.toLowerCase().includes(q) ||
        acc.village.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
      const matchesVillage = villageFilter === 'All' || acc.village === villageFilter;

      // Amount Range Filter
      let matchesAmount = true;
      if (amountRangeFilter === 'Under ₹5,000') {
        matchesAmount = acc.current_pending < 5000;
      } else if (amountRangeFilter === '₹5,000 - ₹10,000') {
        matchesAmount = acc.current_pending >= 5000 && acc.current_pending <= 10000;
      } else if (amountRangeFilter === 'Above ₹10,000') {
        matchesAmount = acc.current_pending > 10000;
      }

      // Due Date Filter
      let matchesDueDate = true;
      if (dueDateFilter === 'Overdue') {
        matchesDueDate = acc.status === 'Overdue';
      } else if (dueDateFilter === 'Due Today') {
        matchesDueDate = acc.oldest_due_date === new Date().toISOString().split('T')[0];
      }

      return matchesSearch && matchesStatus && matchesVillage && matchesAmount && matchesDueDate;
    });
  }, [creditAccounts, searchQuery, statusFilter, villageFilter, amountRangeFilter, dueDateFilter]);

  // Pagination
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCreditAccounts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCreditAccounts, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredCreditAccounts.length / rowsPerPage) || 1;

  // Selected Khata Ledger History
  const selectedKhataLedger = useMemo(() => {
    if (!selectedKhata) return [];
    return ledgerEntries.filter(l => l.farmer_id === selectedKhata.farmer_id);
  }, [selectedKhata, ledgerEntries]);

  // =========================================================================
  // HANDLER: RECORD PAYMENT WITH AUTOMATIC FIFO INVOICE ALLOCATION (SUPABASE RPC)
  // =========================================================================
  const handleExecutePayment = async (e) => {
    e.preventDefault();

    const payAmt = Number(recordPaymentForm.payment_amount);
    if (!recordPaymentForm.farmer_id || payAmt <= 0) {
      alert('Please select a farmer and enter a valid payment amount.');
      return;
    }

    const accObj = creditAccounts.find(a => String(a.farmer_id) === String(recordPaymentForm.farmer_id));
    if (!accObj) return;

    const previousPending = accObj.current_pending;

    // Call Supabase RPC record_farmer_payment
    const res = await recordFarmerPayment({
      farmer_id: recordPaymentForm.farmer_id,
      payment_amount: payAmt,
      payment_method: recordPaymentForm.payment_method,
      notes: recordPaymentForm.notes
    });

    if (!res.success) {
      alert(`Payment failed: ${res.error}`);
      return;
    }

    const receiptNo = res.data?.payment_number || `PAY-FMR-${Date.now()}`;
    const newPending = res.data?.remaining_pending_credit !== undefined ? Number(res.data.remaining_pending_credit) : Math.max(0, previousPending - payAmt);

    // Refresh live credit accounts and ledger from Supabase
    const [liveAccs, liveLedger] = await Promise.all([
      getFarmersWithCredit(),
      getFarmerLedger()
    ]);

    if (liveAccs && liveAccs.length > 0) setCreditAccounts(liveAccs);
    if (liveLedger) setLedgerEntries(liveLedger);

    // Show Payment Receipt Modal
    const receiptData = {
      receipt_number: receiptNo,
      farmer_name: accObj.farmer_name,
      mobile: accObj.mobile,
      amount_received: payAmt,
      previous_credit: previousPending,
      remaining_credit: newPending,
      payment_method: recordPaymentForm.payment_method,
      reference: recordPaymentForm.reference || 'N/A',
      date: recordPaymentForm.payment_date
    };

    setReceiptModal(receiptData);
    setIsRecordPaymentOpen(false);

    if (selectedKhata && String(selectedKhata.farmer_id) === String(recordPaymentForm.farmer_id)) {
      setSelectedKhata({
        ...selectedKhata,
        total_paid: selectedKhata.total_paid + payAmt,
        current_pending: newPending,
        status: newPending === 0 ? 'Cleared' : 'Partially Paid'
      });
    }
  };

  // =========================================================================
  // HANDLER: CREDIT ADJUSTMENT / WAIVER
  // =========================================================================
  const handleExecuteAdjustment = (e) => {
    e.preventDefault();

    const adjAmt = Number(adjustmentForm.amount);
    if (!adjustmentForm.farmer_id || adjAmt <= 0) {
      alert('Please select a farmer and enter a valid adjustment amount.');
      return;
    }

    const accObj = creditAccounts.find(a => a.farmer_id === adjustmentForm.farmer_id);
    if (!accObj) return;

    const refNo = `ADJ-2026-00${Math.floor(10 + Math.random() * 90)}`;
    const newPending = Math.max(0, accObj.current_pending - adjAmt);

    // Update Account
    setCreditAccounts(creditAccounts.map(a => {
      if (a.farmer_id === adjustmentForm.farmer_id) {
        return {
          ...a,
          current_pending: newPending,
          status: newPending === 0 ? 'Cleared' : a.status
        };
      }
      return a;
    }));

    // Post Ledger Entry
    setLedgerEntries([
      {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        date: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        farmer_id: adjustmentForm.farmer_id,
        farmer_name: accObj.farmer_name,
        transaction_type: `Adjustment (${adjustmentForm.adjustment_type})`,
        reference: refNo,
        debit: 0,
        credit: adjAmt,
        running_balance: newPending,
        due_date: 'N/A',
        status: 'Adjusted',
        user: 'Admin',
        notes: adjustmentForm.notes || 'Admin credit waiver'
      },
      ...ledgerEntries
    ]);

    setIsAdjustmentModalOpen(false);
    alert(`Credit adjustment of ₹${adjAmt.toLocaleString('en-IN')} applied for ${accObj.farmer_name}. Ledger updated.`);
  };

  // =========================================================================
  // HANDLER: WHATSAPP REMINDER SIMULATOR
  // =========================================================================
  const getWhatsAppMessageText = (farmerName, pendingAmount, dueDate) => {
    return `Hello ${farmerName},\n\nThis is a payment reminder from *Smart AgroMart*.\n\n📌 *Pending Udhar Amount:* ₹${pendingAmount.toLocaleString('en-IN')}\n📅 *Due Date:* ${dueDate}\n\nPlease visit the shop or send payment via UPI to settle your balance.\n\nThank you!\n*Smart AgroMart - AI Powered Agro Shop*`;
  };

  return (
    <div className="space-y-5 pb-8 font-sans">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">
                Credit Management / Digital Khata
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                Udhar Ledger
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Track farmer credit, due payments, ledger transactions and automated payment reminders
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation View Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 mr-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'accounts' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Farmer Accounts
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ledger' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Digital Ledger ({ledgerEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('aging')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'aging' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Credit Analytics
            </button>
          </div>

          <button
            onClick={() => {
              if (creditAccounts.length > 0) {
                setRecordPaymentForm({
                  farmer_id: creditAccounts[0].farmer_id,
                  payment_amount: creditAccounts[0].current_pending || 1000,
                  payment_method: 'UPI',
                  payment_date: new Date().toISOString().split('T')[0],
                  reference: '',
                  notes: 'Repayment'
                });
                setIsRecordPaymentOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#064E3B] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>

          <button
            onClick={() => setIsBulkReminderOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send Reminders</span>
          </button>

          <button
            onClick={() => alert('Digital Khata Ledger exported to Excel & PDF successfully.')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-200 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CREDIT SUMMARY CARDS (6 COMPACT CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Total Outstanding Credit (Purple) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">Total Outstanding</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-purple-950 font-['Outfit']">
              ₹{totalOutstandingCredit.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">Active farmer balances</span>
          </div>
        </div>

        {/* Card 2: Farmers With Pending Credit (Blue) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">Pending Accounts</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-blue-950 font-['Outfit']">
              {pendingFarmersCount} Farmers
            </h3>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Active Udhar accounts</span>
          </div>
        </div>

        {/* Card 3: Overdue Amount (Red) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider">Overdue Amount</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-rose-950 font-['Outfit']">
              ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">Past due limit</span>
          </div>
        </div>

        {/* Card 4: Due This Week (Orange) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-orange-900 uppercase tracking-wider">Due This Week</span>
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-orange-950 font-['Outfit']">
              ₹{dueThisWeekAmount.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-orange-700 font-semibold mt-0.5 block">Expected collection</span>
          </div>
        </div>

        {/* Card 5: Payments Received This Month (Green) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">Payments Received</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">
              ₹{paymentsReceivedThisMonth.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">+18% vs last month</span>
          </div>
        </div>

        {/* Card 6: Average Credit Per Farmer (Light Green) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-teal-900 uppercase tracking-wider">Avg Credit / Farmer</span>
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-teal-950 font-['Outfit']">
              ₹{avgCreditPerFarmer.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">Safe range</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FARMER CREDIT ACCOUNTS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          
          {/* SEARCH AND FILTER BAR */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Search Field */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search farmer, mobile, invoice or transaction..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Credit Status: All</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cleared">Cleared</option>
                </select>
              </div>

              {/* Village Filter */}
              <div>
                <select
                  value={villageFilter}
                  onChange={e => setVillageFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Village: All Villages</option>
                  {villagesList.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Amount Range Filter */}
              <div>
                <select
                  value={amountRangeFilter}
                  onChange={e => setAmountRangeFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Amount: All Ranges</option>
                  <option value="Under ₹5,000">Under ₹5,000</option>
                  <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                  <option value="Above ₹10,000">Above ₹10,000</option>
                </select>
              </div>

            </div>

            {/* Filter Reset Row */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-medium">
                Showing <strong className="text-gray-900">{filteredCreditAccounts.length}</strong> farmer credit accounts
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setVillageFilter('All');
                  setAmountRangeFilter('All');
                  setDueDateFilter('All');
                }}
                className="text-xs text-[#15803D] hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* FARMER CREDIT TABLE */}
          <div className="rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#064E3B]/5 text-[#064E3B] font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Farmer</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">Village</th>
                    <th className="p-3.5 text-right">Total Credit</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Pending</th>
                    <th className="p-3.5">Oldest Due Date</th>
                    <th className="p-3.5 text-center">Credit Status</th>
                    <th className="p-3.5">Last Payment</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {paginatedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 font-bold">
                        No farmer credit accounts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedAccounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td 
                          onClick={() => setSelectedKhata(acc)}
                          className="p-3.5 font-bold text-[#064E3B] cursor-pointer hover:underline"
                        >
                          {acc.farmer_name}
                          <span className="block text-[10px] text-gray-400 font-mono font-normal">{acc.farmer_code}</span>
                        </td>
                        <td className="p-3.5 font-mono text-gray-700">
                          {acc.mobile}
                        </td>
                        <td className="p-3.5 text-gray-800">
                          {acc.village}
                        </td>
                        <td className="p-3.5 text-right font-bold text-gray-900">
                          ₹{acc.total_credit.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-700">
                          ₹{acc.total_paid.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-purple-900">
                          ₹{acc.current_pending.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-gray-600 font-mono">
                          {acc.oldest_due_date}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            acc.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' :
                            acc.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            acc.status === 'Partially Paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-gray-600">
                          {acc.last_payment_date}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedKhata(acc)}
                              title="View Digital Khata"
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-[#064E3B] hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Khata
                            </button>

                            {acc.current_pending > 0 && (
                              <>
                                <button
                                  onClick={() => {
                                    setRecordPaymentForm({
                                      farmer_id: acc.farmer_id,
                                      payment_amount: acc.current_pending,
                                      payment_method: 'UPI',
                                      payment_date: new Date().toISOString().split('T')[0],
                                      reference: '',
                                      notes: `Repayment from ${acc.farmer_name}`
                                    });
                                    setPaymentKhata(acc);
                                    setIsRecordPaymentOpen(true);
                                  }}
                                  title="Record Payment"
                                  className="px-2 py-1 rounded-lg bg-[#064E3B] hover:bg-[#15803D] text-white font-bold text-[11px] transition-colors"
                                >
                                  Pay
                                </button>

                                <button
                                  onClick={() => setReminderModalFarmer(acc)}
                                  title="Send WhatsApp Reminder"
                                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 bg-gray-50/70 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="p-1 rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1 font-bold text-gray-700">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-100"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIGITAL LEDGER VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Global Digital Khata Accounting Ledger</h2>
              <p className="text-xs text-gray-500">Real-time debit (credit sales) & credit (repayments) transaction history</p>
            </div>
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs border border-purple-300 flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>Admin Credit Waiver / Adjustment</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white/90 border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#064E3B]/5 text-[#064E3B] font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Farmer</th>
                    <th className="p-3.5">Transaction Type</th>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5 text-right text-rose-700">Debit (+ Udhar)</th>
                    <th className="p-3.5 text-right text-emerald-700">Credit (- Paid)</th>
                    <th className="p-3.5 text-right">Running Balance</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {ledgerEntries.map(l => (
                    <tr key={l.id} className="hover:bg-emerald-50/40">
                      <td className="p-3.5 text-gray-600 whitespace-nowrap">{l.date}</td>
                      <td className="p-3.5 font-bold text-gray-900">{l.farmer_name}</td>
                      <td className="p-3.5 font-semibold text-[#064E3B]">{l.transaction_type}</td>
                      <td className="p-3.5 font-mono text-gray-600">{l.reference}</td>
                      <td className="p-3.5 text-right font-extrabold text-rose-700">
                        {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-emerald-700">
                        {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-purple-900">
                        ₹{l.running_balance.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-gray-600">{l.due_date}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                          l.status === 'Adjusted' ? 'bg-purple-100 text-purple-800' :
                          l.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-medium">{l.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CREDIT ANALYTICS & AGING VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'aging' && (
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* RECHARTS: MONTHLY CREDIT GIVEN VS COLLECTED */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit']">Credit Collection Trend (Apr – Sep)</h3>
                  <p className="text-xs text-gray-500">Comparing Credit Given (Udhar) vs Payments Collected</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-purple-700">
                    <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Credit Given
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Collected
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={initialCreditTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="credit_given" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCredit)" />
                    <Area type="monotone" dataKey="collected" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CREDIT AGING ANALYSIS BUCKETS */}
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">
                Credit Aging Analysis
              </h3>

              <div className="space-y-3 text-xs">
                {initialCreditAgingData.map(b => (
                  <div key={b.bucket} className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{b.bucket} ({b.count} Farmers)</span>
                      <span>₹{b.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-2.5 rounded-full transition-all"
                        style={{ 
                          width: `${(b.amount / totalOutstandingCredit) * 100}%`,
                          backgroundColor: b.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* UPCOMING DUES LIST */}
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2 flex items-center justify-between">
                <span>Upcoming Due Dues</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </h3>

              <div className="divide-y divide-gray-100 text-xs">
                {creditAccounts.filter(a => a.current_pending > 0).map(a => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-gray-900 block">{a.farmer_name}</span>
                      <span className="text-[11px] text-gray-500 font-mono">Mobile: {a.mobile} ({a.village})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-purple-900 block">₹{a.current_pending.toLocaleString('en-IN')}</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                        Due: {a.oldest_due_date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HIGHEST OUTSTANDING CREDIT & RISK INDICATOR */}
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2 flex items-center justify-between">
                <span>Highest Outstanding Accounts</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </h3>

              <div className="divide-y divide-gray-100 text-xs">
                {creditAccounts.sort((a,b) => b.current_pending - a.current_pending).slice(0, 4).map(a => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-gray-900 block">{a.farmer_name}</span>
                      <span className="text-[11px] text-gray-500 font-mono">Credit Limit: ₹{a.credit_limit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-800 block">₹{a.current_pending.toLocaleString('en-IN')}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        a.credit_risk === 'High Risk' ? 'bg-rose-100 text-rose-800' :
                        a.credit_risk === 'Medium Risk' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {a.credit_risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 1: FARMER DIGITAL KHATA PROFILE */}
      {/* ========================================================================= */}
      {selectedKhata && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white h-full max-w-xl w-full p-6 shadow-2xl border-l border-gray-200 space-y-4 overflow-y-auto custom-scrollbar text-xs">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">{selectedKhata.farmer_name}</h3>
                <span className="text-gray-500 font-mono">{selectedKhata.farmer_code} | {selectedKhata.mobile}</span>
              </div>
              <button onClick={() => setSelectedKhata(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* SUMMARY MATRICS GRID */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Credit Given</span>
                <span className="font-extrabold text-gray-900 text-sm">₹{selectedKhata.total_credit.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Payments</span>
                <span className="font-bold text-emerald-800 text-sm">₹{selectedKhata.total_paid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Current Pending</span>
                <span className="font-extrabold text-purple-900 text-sm">₹{selectedKhata.current_pending.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Credit Limit</span>
                <span className="font-extrabold text-emerald-900">₹{selectedKhata.credit_limit.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Available Credit</span>
                <span className="font-extrabold text-blue-900">
                  ₹{Math.max(0, selectedKhata.credit_limit - selectedKhata.current_pending).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setRecordPaymentForm({
                    farmer_id: selectedKhata.farmer_id,
                    payment_amount: selectedKhata.current_pending,
                    payment_method: 'UPI',
                    payment_date: new Date().toISOString().split('T')[0],
                    reference: '',
                    notes: `Repayment from ${selectedKhata.farmer_name}`
                  });
                  setIsRecordPaymentOpen(true);
                }}
                className="py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => setReminderModalFarmer(selectedKhata)}
                className="py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#064E3B] flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>

            {/* FARMER KHATA TRANSACTION LEDGER */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Farmer Khata Ledger History</h4>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Transaction</th>
                      <th className="p-2">Ref</th>
                      <th className="p-2 text-right">Debit</th>
                      <th className="p-2 text-right">Credit</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {selectedKhataLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">No ledger transactions found.</td>
                      </tr>
                    ) : (
                      selectedKhataLedger.map(l => (
                        <tr key={l.id}>
                          <td className="p-2 text-gray-600">{l.date}</td>
                          <td className="p-2 font-bold text-gray-900">{l.transaction_type}</td>
                          <td className="p-2 font-mono text-gray-500">{l.reference}</td>
                          <td className="p-2 text-right text-rose-700 font-bold">{l.debit > 0 ? `₹${l.debit}` : '-'}</td>
                          <td className="p-2 text-right text-emerald-700 font-bold">{l.credit > 0 ? `₹${l.credit}` : '-'}</td>
                          <td className="p-2 text-right font-extrabold text-purple-900">₹{l.running_balance}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedKhata(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Close Khata
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD PAYMENT MODAL */}
      {/* ========================================================================= */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleExecutePayment} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">+ Record Udhar Repayment</h3>
              <button type="button" onClick={() => setIsRecordPaymentOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Select Farmer Account*</label>
                <select
                  value={recordPaymentForm.farmer_id}
                  onChange={e => {
                    const acc = creditAccounts.find(a => a.farmer_id === e.target.value);
                    setRecordPaymentForm({
                      ...recordPaymentForm,
                      farmer_id: e.target.value,
                      payment_amount: acc ? acc.current_pending : 0
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                >
                  {creditAccounts.map(a => (
                    <option key={a.id} value={a.farmer_id}>
                      {a.farmer_name} (Pending: ₹{a.current_pending.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Repayment Amount (₹)*</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={recordPaymentForm.payment_amount}
                  onChange={e => setRecordPaymentForm({ ...recordPaymentForm, payment_amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-extrabold text-emerald-800 text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Mode</label>
                  <select
                    value={recordPaymentForm.payment_method}
                    onChange={e => setRecordPaymentForm({ ...recordPaymentForm, payment_method: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={recordPaymentForm.payment_date}
                    onChange={e => setRecordPaymentForm({ ...recordPaymentForm, payment_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Transaction Ref / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR981273918"
                  value={recordPaymentForm.reference}
                  onChange={e => setRecordPaymentForm({ ...recordPaymentForm, reference: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRecordPaymentOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-200 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#064E3B] font-['Outfit']">Payment Recorded Successfully</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">Official Udhar Receipt Generated</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-extrabold text-[#064E3B]">{receiptModal.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Farmer:</span>
                <span className="font-bold">{receiptModal.farmer_name}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t pt-1">
                <span>Amount Received:</span>
                <span>₹{receiptModal.amount_received.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Previous Credit:</span>
                <span>₹{receiptModal.previous_credit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-purple-900 font-extrabold border-t pt-1">
                <span>Remaining Credit:</span>
                <span>₹{receiptModal.remaining_credit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Payment Method:</span>
                <span>{receiptModal.payment_method}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-bold pt-1">
              <button
                onClick={() => alert(`Printing Receipt ${receiptModal.receipt_number}...`)}
                className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => alert(`Downloading PDF Receipt ${receiptModal.receipt_number}...`)}
                className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => {
                  const txt = getWhatsAppMessageText(receiptModal.farmer_name, receiptModal.remaining_credit, 'N/A');
                  window.open(`https://wa.me/91${receiptModal.mobile}?text=${encodeURIComponent(txt)}`, '_blank');
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => setReceiptModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INDIVIDUAL WHATSAPP REMINDER */}
      {/* ========================================================================= */}
      {reminderModalFarmer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Send Payment Reminder</h3>
              <button onClick={() => setReminderModalFarmer(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-950 font-medium">
              <span className="font-extrabold block text-sm">{reminderModalFarmer.farmer_name} ({reminderModalFarmer.mobile})</span>
              <div className="whitespace-pre-wrap font-mono text-[11px] bg-white p-3 rounded-xl border border-emerald-300">
                {getWhatsAppMessageText(
                  reminderModalFarmer.farmer_name,
                  reminderModalFarmer.current_pending,
                  reminderModalFarmer.oldest_due_date
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    getWhatsAppMessageText(
                      reminderModalFarmer.farmer_name,
                      reminderModalFarmer.current_pending,
                      reminderModalFarmer.oldest_due_date
                    )
                  );
                  alert('Reminder message copied to clipboard!');
                }}
                className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Message</span>
              </button>

              <button
                onClick={() => {
                  const txt = getWhatsAppMessageText(
                    reminderModalFarmer.farmer_name,
                    reminderModalFarmer.current_pending,
                    reminderModalFarmer.oldest_due_date
                  );
                  window.open(`https://wa.me/91${reminderModalFarmer.mobile}?text=${encodeURIComponent(txt)}`, '_blank');
                  setReminderModalFarmer(null);
                }}
                className="py-2.5 rounded-xl bg-[#15803D] hover:bg-[#064E3B] text-white flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BULK REMINDERS */}
      {/* ========================================================================= */}
      {isBulkReminderOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Bulk Payment Reminders</h3>
              <button onClick={() => setIsBulkReminderOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Target Farmer Group</label>
                <select
                  value={bulkFilterType}
                  onChange={e => setBulkFilterType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  <option value="Overdue">Overdue Farmers (4 Farmers)</option>
                  <option value="Due Today">Due Today (2 Farmers)</option>
                  <option value="Due This Week">Due This Week (8 Farmers)</option>
                  <option value="All Pending">All Pending Credit (23 Farmers)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 font-medium">
                <div className="flex justify-between">
                  <span>Selected Farmers:</span>
                  <span className="font-extrabold">23 Farmers</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Pending Amount:</span>
                  <span className="font-extrabold">₹1,24,500</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsBulkReminderOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Bulk WhatsApp Reminders dispatched to 23 farmers successfully!');
                  setIsBulkReminderOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp Reminders</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CREDIT ADJUSTMENT / WAIVER */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleExecuteAdjustment} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-purple-950 font-['Outfit']">Admin Credit Waiver / Adjustment</h3>
              <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Select Farmer Account*</label>
                <select
                  value={adjustmentForm.farmer_id}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, farmer_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                >
                  <option value="">-- Select Farmer --</option>
                  {creditAccounts.map(a => (
                    <option key={a.id} value={a.farmer_id}>
                      {a.farmer_name} (Pending: ₹{a.current_pending.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Adjustment Type</label>
                  <select
                    value={adjustmentForm.adjustment_type}
                    onChange={e => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                  >
                    <option value="Waiver">Waiver / Discount</option>
                    <option value="Correction">Correction</option>
                    <option value="Bad Debt Write-off">Bad Debt Write-off</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Adjustment Amount (₹)*</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={adjustmentForm.amount}
                    onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-purple-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Special crop discount waiver"
                  value={adjustmentForm.notes}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CreditManagement;
