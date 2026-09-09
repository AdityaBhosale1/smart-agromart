import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  MapPin, 
  Sprout, 
  CreditCard, 
  Receipt, 
  Send, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpDown, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Share2, 
  DollarSign, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import farmerService, { getFarmerCreditStatus } from '../services/farmerService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/formatters';

export const Farmers = () => {
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [purchases, setPurchases] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [creditStatusFilter, setCreditStatusFilter] = useState('All');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('All');

  // Sorting & Pagination States
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawers States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingFarmerId, setEditingFarmerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // overview, purchases, ledger, payments, crops

  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentFarmer, setPaymentFarmer] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 1000, method: 'Cash', date: new Date().toISOString().split('T')[0], refId: 'PAY-2026-0082', notes: 'Partial credit clearance' });

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [formError, setFormError] = useState('');

  // Add / Edit Farmer Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    alt_mobile: '',
    village: 'Solapur',
    district: 'Solapur',
    primary_crop: 'Wheat',
    land_area: 5,
    credit_limit: 50000,
    pending_credit: 0,
    notes: ''
  });

  // Debounce Search Query (300-500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Farmers from Backend API
  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (villageFilter !== 'All') params.village = villageFilter;
      if (creditStatusFilter === 'Pending' || creditStatusFilter === 'Overdue') params.has_credit = true;

      const data = await farmerService.getFarmers(params);
      setFarmers(data);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError(getApiErrorMessage(err, 'Unable to load farmers from server.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, villageFilter, creditStatusFilter]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Profile Drawer with Live Profile Details, Purchase History & Ledger
  const handleOpenProfileDrawer = async (farmer) => {
    setSelectedFarmer(farmer);
    setShowProfileDrawer(true);
    setProfileLoading(true);
    try {
      const [details, historyData, ledgerData] = await Promise.all([
        farmerService.getFarmer(farmer.id),
        farmerService.getPurchaseHistory(farmer.id),
        farmerService.getCreditLedger(farmer.id)
      ]);
      if (details) setSelectedFarmer(details);
      setPurchases(historyData);
      setLedger(ledgerData);
    } catch (err) {
      console.error('Error loading farmer profile history:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // FILTERING & SORTING LOGIC
  // ------------------------------------------------------------------
  const resetFilters = () => {
    setSearchQuery('');
    setVillageFilter('All');
    setCropFilter('All');
    setCreditStatusFilter('All');
    setCustomerStatusFilter('All');
  };

  const filteredFarmers = (farmers || []).filter(f => {
    if (!f) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(q) || false;
      const matchCode = f.code?.toLowerCase().includes(q) || false;
      const matchMobile = f.mobile?.includes(q) || false;
      const matchVillage = f.village?.toLowerCase().includes(q) || false;
      const matchCrop = f.primary_crop?.toLowerCase().includes(q) || false;
      if (!matchName && !matchCode && !matchMobile && !matchVillage && !matchCrop) return false;
    }

    if (villageFilter !== 'All' && f.village !== villageFilter) return false;
    if (cropFilter !== 'All' && f.primary_crop !== cropFilter) return false;

    if (creditStatusFilter !== 'All') {
      const pending = Number(f.pending_credit || 0);
      if (creditStatusFilter === 'Pending' && pending <= 0) return false;
      if (creditStatusFilter === 'No Credit' && pending > 0) return false;
    }

    return true;
  });

  const sortedFarmers = [...filteredFarmers].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedFarmers.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedFarmers = sortedFarmers.slice(startIndex, startIndex + rowsPerPage);
  const indexOfFirstRow = startIndex;
  const indexOfLastRow = startIndex + paginatedFarmers.length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenAddModal = () => {
    setEditingFarmerId(null);
    setFormData({
      name: '',
      mobile: '',
      alt_mobile: '',
      village: 'Solapur',
      district: 'Solapur',
      primary_crop: 'Wheat',
      land_area: 5,
      credit_limit: 50000,
      pending_credit: 0,
      notes: ''
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (farmer) => {
    setEditingFarmerId(farmer.id);
    setFormData({
      name: farmer.name,
      mobile: farmer.mobile,
      village: farmer.village || 'Solapur',
      district: farmer.district || 'Solapur',
      primary_crop: farmer.primary_crop || 'Wheat',
      land_area: farmer.land_area || 5,
      credit_limit: farmer.credit_limit || 50000,
      pending_credit: farmer.pending_credit || 0,
      status: farmer.status || 'Active'
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) { setFormError('Farmer Full Name is required!'); return; }
    if (!formData.mobile || formData.mobile.length < 10) { setFormError('Valid 10-digit mobile number is required!'); return; }

    setSubmitting(true);
    try {
      if (editingFarmerId) {
        await farmerService.updateFarmer(editingFarmerId, formData);
        showToast('Farmer profile updated successfully!');
      } else {
        const created = await farmerService.createFarmer(formData);
        showToast(`Farmer added successfully! Code: ${created.code}`);
      }
      setShowAddEditModal(false);
      await fetchFarmers();
    } catch (err) {
      if (err.status === 409 || err.detail?.includes('mobile') || err.detail?.includes('exists')) {
        setFormError('A farmer with this mobile number already exists.');
      } else {
        setFormError(getApiErrorMessage(err, 'Failed to save farmer profile.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment Handler with Real API Call
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFarmer) return;

    const amt = Number(paymentForm.amount);
    if (amt <= 0) return;

    try {
      await farmerService.recordPayment(paymentFarmer.id, {
        amount: amt,
        payment_method: paymentForm.method,
        notes: paymentForm.notes
      });

      showToast(`Payment of ₹${amt} recorded successfully for ${paymentFarmer.name}`);
      setShowRecordPaymentModal(false);
      await fetchFarmers();
      if (selectedFarmer && selectedFarmer.id === paymentFarmer.id) {
        handleOpenProfileDrawer(paymentFarmer);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to record payment.'));
    }
  };

  // Summary Card Counts
  const safeFarmers = farmers || [];
  const totalCount = safeFarmers.length;
  const activeCount = safeFarmers.filter(f => f?.status === 'Active').length;
  const creditFarmersCount = safeFarmers.filter(f => (Number(f?.pending_credit) || 0) > 0).length;
  const totalCreditSum = safeFarmers.reduce((sum, f) => sum + (Number(f?.pending_credit) || 0), 0);

  return (
    <div className="space-y-4 pb-6 font-sans select-none">
      
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">Farmer Management</h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage farmer profiles, purchase history, credit, crops and relationships
            </p>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Farmers</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Farmers</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-40 text-xs font-semibold">
                <button onClick={() => { alert("Exporting Farmer Database to Excel (.xlsx)..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
                </button>
                <button onClick={() => { alert("Exporting Farmers to CSV..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                <button onClick={() => { alert("Exporting Farmer Directory to PDF..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#15803D] transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Farmer</span>
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-[#064E3B] text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ERROR FEEDBACK BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Unable to load farmers. {error}</span>
          </div>
          <button
            onClick={fetchFarmers}
            className="px-3 py-1 bg-rose-600 text-white rounded-xl hover:bg-rose-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* 1. FARMER SUMMARY CARDS (5 COMPACT CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-emerald-800">Total Farmers</span>
          <span className="text-xl font-extrabold text-emerald-900 font-['Outfit'] mt-1">{totalCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#DCFCE7] border border-emerald-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-[#064E3B]">Active Farmers</span>
          <span className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] mt-1">{activeCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-amber-800">Farmers With Credit</span>
          <span className="text-xl font-extrabold text-amber-900 font-['Outfit'] mt-1">{creditFarmersCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-rose-800">Total Outstanding Credit</span>
          <span className="text-xl font-extrabold text-rose-900 font-['Outfit'] mt-1">₹{totalCreditSum.toLocaleString()}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase text-sky-800">New This Month</span>
          <span className="text-xl font-extrabold text-sky-900 font-['Outfit'] mt-1">12</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH AND MULTI-FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          
          {/* SEARCH FIELD */}
          <div className="sm:col-span-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search farmer by name, mobile, village or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* VILLAGE FILTER */}
          <div>
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Villages</option>
              <option value="Kopargaon">Kopargaon</option>
              <option value="Yeola">Yeola</option>
              <option value="Rahata">Rahata</option>
              <option value="Sinnar">Sinnar</option>
              <option value="Shirol">Shirol</option>
              <option value="Sangamner">Sangamner</option>
            </select>
          </div>

          {/* CROP FILTER */}
          <div>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Crops</option>
              <option value="Onion">Onion</option>
              <option value="Soybean">Soybean</option>
              <option value="Cotton">Cotton</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Wheat">Wheat</option>
              <option value="Maize">Maize</option>
            </select>
          </div>

          {/* CREDIT STATUS FILTER */}
          <div>
            <select
              value={creditStatusFilter}
              onChange={(e) => setCreditStatusFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Credit Status</option>
              <option value="No Credit">No Credit</option>
              <option value="Pending">Pending Credit</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* CUSTOMER STATUS FILTER */}
          <div>
            <select
              value={customerStatusFilter}
              onChange={(e) => setCustomerStatusFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={resetFilters}
            className="text-[11px] font-bold text-emerald-700 hover:text-[#064E3B] underline"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FARMER TABLE WITH SORTING */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs overflow-x-auto space-y-3">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>Farmer</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="pb-2">Mobile</th>
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('village')}>Village</th>
              <th className="pb-2">Primary Crop</th>
              <th className="pb-2 text-right cursor-pointer" onClick={() => handleSort('total_purchases')}>Total Purchases</th>
              <th className="pb-2 text-right cursor-pointer" onClick={() => handleSort('pending_credit')}>Pending Credit</th>
              <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('last_purchase')}>Last Purchase</th>
              <th className="pb-2 text-center">Credit Status</th>
              <th className="pb-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#064E3B] animate-spin" />
                    <span>Loading farmers from server...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedFarmers.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-gray-500 font-medium">
                  No farmer records found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedFarmers.map((f) => {
                const creditStatus = f.credit_status;
                return (
                  <tr key={f.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 font-bold text-[#064E3B]">
                      <div>{f.name}</div>
                      <span className="text-[9px] text-gray-400 font-normal">Code: {f.code}</span>
                    </td>
                    <td className="py-3 text-gray-600 font-medium">{f.mobile}</td>
                    <td className="py-3 font-semibold text-gray-700">{f.village}</td>
                    <td className="py-3 text-emerald-800 font-bold">{f.primary_crop}</td>
                    <td className="py-3 text-right font-extrabold text-[#15803D]">{f.total_purchases}</td>
                    <td className="py-3 text-right font-extrabold text-amber-800">
                      {f.pending_credit > 0 ? formatCurrency(f.pending_credit) : '₹0'}
                    </td>
                    <td className="py-3 text-center text-gray-500">{f.last_purchase}</td>
                    
                    {/* CREDIT STATUS BADGE */}
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        creditStatus === 'No Credit' ? 'bg-emerald-100 text-emerald-800' :
                        creditStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {creditStatus}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenProfileDrawer(f)} className="p-1 text-gray-400 hover:text-emerald-700" title="View Profile"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenEditModal(f)} className="p-1 text-gray-400 hover:text-emerald-700" title="Edit Farmer"><Edit className="w-3.5 h-3.5" /></button>
                        {f.pending_credit > 0 && (
                          <>
                            <button onClick={() => { setPaymentFarmer(f); setPaymentForm({...paymentForm, amount: f.pending_credit}); setShowRecordPaymentModal(true); }} className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#064E3B] text-white hover:bg-[#15803D]" title="Record Payment">Pay</button>
                            <button onClick={() => { setWhatsappFarmer(f); setShowWhatsappModal(true); }} className="p-1 text-emerald-600 hover:text-emerald-800" title="Send WhatsApp Reminder"><Send className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Showing {indexOfFirstRow + 1}–{Math.min(indexOfLastRow, totalItems)} of {totalItems} farmers</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="p-1 border rounded bg-gray-50 font-bold"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-bold">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="p-1.5 rounded-lg border bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1 bg-[#064E3B] text-white rounded-lg">{currentPage}</span>
            <span>/ {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="p-1.5 rounded-lg border bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. ADD / EDIT FARMER MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">
                {editingFarmerId ? 'Edit Farmer Profile' : 'Register New Farmer'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">

              
              {/* PERSONAL DETAILS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  1. Personal & Contact Details
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Farmer Full Name*</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" placeholder="e.g. Rahul Jadhav" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Mobile Number*</label>
                    <input required type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" placeholder="9876543210" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Alternate Mobile</label>
                    <input type="text" value={formData.alt_mobile} onChange={e => setFormData({...formData, alt_mobile: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Village*</label>
                    <input required type="text" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Taluka</label>
                    <input type="text" value={formData.taluka} onChange={e => setFormData({...formData, taluka: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">District</label>
                    <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">State</label>
                    <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* FARM DETAILS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  2. Farm & Agriculture Details
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Primary Crop*</label>
                    <input required type="text" value={formData.primary_crop} onChange={e => setFormData({...formData, primary_crop: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Land Area</label>
                    <input type="number" value={formData.land_area} onChange={e => setFormData({...formData, land_area: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Land Unit</label>
                    <select value={formData.land_unit} onChange={e => setFormData({...formData, land_unit: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50">
                      <option value="Acre">Acre</option>
                      <option value="Hectare">Hectare</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Irrigation Type</label>
                    <select value={formData.irrigation_type} onChange={e => setFormData({...formData, irrigation_type: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50">
                      {['Drip', 'Rainfed', 'Sprinkler', 'Canal', 'Well', 'Borewell', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* BUSINESS & CREDIT DETAILS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  3. Business & Credit Configuration
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Preferred Payment</label>
                    <select value={formData.preferred_payment} onChange={e => setFormData({...formData, preferred_payment: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold">
                      {['Cash', 'UPI', 'Credit', 'Mixed'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Credit Limit (₹)</label>
                    <input type="number" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Opening Credit (₹)</label>
                    <input type="number" value={formData.pending_credit} onChange={e => setFormData({...formData, pending_credit: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold text-rose-600" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">{editingFarmerId ? 'Update Profile' : 'Register Farmer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6-9. DETAILED FARMER PROFILE DRAWER (WITH TABS) */}
      {/* ------------------------------------------------------------------ */}
      {showProfileDrawer && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-full p-6 space-y-4 overflow-y-auto shadow-2xl font-sans text-xs">
            
            {/* PROFILE HEADER */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">{selectedFarmer.name}</h2>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                    {selectedFarmer.code}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{selectedFarmer.village}, {selectedFarmer.district} &bull; Mob: {selectedFarmer.mobile}</p>
              </div>
              <button onClick={() => setShowProfileDrawer(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {/* TAB SELECTOR BUTTONS */}
            <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'purchases', label: 'Purchase History' },
                { id: 'ledger', label: 'Credit Ledger' },
                { id: 'crops', label: 'Crop Advice' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    profileTab === t.id ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {profileTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-gray-50 border">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Lifetime Sales</span>
                    <span className="text-base font-extrabold text-[#064E3B]">{selectedFarmer.total_purchases}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Bills</span>
                    <span className="text-base font-extrabold text-[#064E3B]">{selectedFarmer.total_bills}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase">Pending Credit</span>
                    <span className="text-base font-extrabold text-amber-900">₹{selectedFarmer.pending_credit.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Credit Limit</span>
                    <span className="text-base font-extrabold text-emerald-900">₹{selectedFarmer.credit_limit.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 space-y-2 border">
                  <span className="font-bold text-gray-700 block">Personal & Farm Details</span>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>Primary Crop: <strong>{selectedFarmer.primary_crop}</strong></div>
                    <div>Irrigation: <strong>{selectedFarmer.irrigation_type}</strong></div>
                    <div>Land Area: <strong>{selectedFarmer.land_area} {selectedFarmer.land_unit}</strong></div>
                    <div>Season: <strong>{selectedFarmer.season}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PURCHASE HISTORY */}
            {profileTab === 'purchases' && (
              <div className="space-y-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-gray-400 uppercase text-[9px]">
                      <th className="pb-1.5">Date</th>
                      <th className="pb-1.5">Invoice</th>
                      <th className="pb-1.5">Products</th>
                      <th className="pb-1.5 text-right">Total</th>
                      <th className="pb-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 text-gray-500">{p.date}</td>
                        <td className="py-2 font-mono font-bold text-[#064E3B]">{p.invoice}</td>
                        <td className="py-2 font-medium">{p.products}</td>
                        <td className="py-2 text-right font-extrabold text-[#15803D]">₹{p.total}</td>
                        <td className="py-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: CREDIT LEDGER */}
            {profileTab === 'ledger' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex justify-between font-bold text-amber-900">
                  <span>Current Pending Balance:</span>
                  <span>₹{selectedFarmer.pending_credit.toLocaleString()}</span>
                </div>

                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-gray-400 uppercase text-[9px]">
                      <th className="pb-1.5">Date</th>
                      <th className="pb-1.5">Transaction</th>
                      <th className="pb-1.5">Ref</th>
                      <th className="pb-1.5 text-right">Debit (+)</th>
                      <th className="pb-1.5 text-right">Credit (-)</th>
                      <th className="pb-1.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.map(l => (
                      <tr key={l.id}>
                        <td className="py-2 text-gray-500">{l.date}</td>
                        <td className="py-2 font-bold text-gray-800">{l.transaction}</td>
                        <td className="py-2 font-mono text-gray-500">{l.reference}</td>
                        <td className="py-2 text-right font-bold text-rose-600">{l.debit > 0 ? `₹${l.debit}` : '-'}</td>
                        <td className="py-2 text-right font-bold text-emerald-700">{l.credit > 0 ? `₹${l.credit}` : '-'}</td>
                        <td className="py-2 text-right font-extrabold text-[#064E3B]">₹{l.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: CROP ADVICE & SMART RECOMMENDATIONS */}
            {profileTab === 'crops' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold">
                    <Sparkles className="w-4 h-4 text-[#22C55E]" />
                    <span>Smart Crop Recommendations ({selectedFarmer.primary_crop})</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    Based on {selectedFarmer.name}'s land area ({selectedFarmer.land_area} Acres) & season ({selectedFarmer.season}):
                  </p>
                  <ul className="list-disc list-inside text-emerald-900 space-y-1 font-semibold">
                    <li>NPK 19:19:19 Fertigation Powder (5kg/acre)</li>
                    <li>Micronutrient Zinc-Sulphate Complex</li>
                    <li>Bio-Fungicide Trichoderma Viride for soil treatment</li>
                  </ul>
                </div>
              </div>
            )}

            <button onClick={() => setShowProfileDrawer(false)} className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Close Profile</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 10. RECORD PAYMENT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showRecordPaymentModal && paymentFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Record Farmer Payment</h2>
              <button onClick={() => setShowRecordPaymentModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex justify-between font-bold text-amber-900">
              <span>{paymentFarmer.name} (Pending Credit):</span>
              <span>₹{paymentFarmer.pending_credit.toLocaleString()}</span>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Payment Amount Received (₹)*</label>
                <input required type="number" min="1" max={paymentFarmer.pending_credit} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl font-bold text-emerald-800 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full p-2 border rounded-xl font-bold">
                    {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Date</label>
                  <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="w-full p-2 border rounded-xl" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Transaction Ref / Receipt No</label>
                <input type="text" value={paymentForm.refId} onChange={e => setPaymentForm({...paymentForm, refId: e.target.value})} className="w-full p-2 border rounded-xl font-mono" />
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowRecordPaymentModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Confirm & Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 11. PAYMENT RECEIPT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showReceiptModal && generatedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-[#064E3B]">Payment Recorded Successfully!</h3>
            <p className="text-xs text-gray-500">Receipt No: <strong className="text-gray-800">{generatedReceipt.receiptNo}</strong></p>

            <div className="p-3 rounded-xl bg-gray-50 border space-y-1 text-left">
              <div className="flex justify-between"><span>Farmer:</span><span className="font-bold">{generatedReceipt.farmer.name}</span></div>
              <div className="flex justify-between"><span>Amount Paid:</span><span className="font-extrabold text-emerald-700">₹{generatedReceipt.amount}</span></div>
              <div className="flex justify-between"><span>Remaining Credit:</span><span className="font-bold text-amber-800">₹{generatedReceipt.remainingCredit}</span></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 py-2 rounded-xl bg-gray-100 font-bold">Done</button>
              <button onClick={() => { alert(`WhatsApp receipt sent to ${generatedReceipt.farmer.mobile}`); setShowReceiptModal(false); }} className="flex-1 py-2 rounded-xl bg-[#064E3B] text-white font-bold">Share WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 13. WHATSAPP REMINDER SIMULATOR MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showWhatsappModal && whatsappFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">WhatsApp Payment Reminder</h2>
              <button onClick={() => setShowWhatsappModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 font-mono text-[11px] text-emerald-900">
              <p>Hello {whatsappFarmer.name},</p>
              <p>This is a payment reminder from Smart AgroMart.</p>
              <p>Pending Amount: ₹{whatsappFarmer.pending_credit.toLocaleString()}</p>
              <p>Due Date: {whatsappFarmer.due_date || '20 Sep 2026'}</p>
              <p>Please contact the shop for payment details.</p>
              <p>Thank you,<br />Smart AgroMart</p>
            </div>

            <button onClick={() => { alert(`WhatsApp launched for ${whatsappFarmer.mobile}!`); setShowWhatsappModal(false); }} className="w-full py-2.5 rounded-xl bg-[#22C55E] text-[#064E3B] font-extrabold text-xs">
              Send WhatsApp Message Now
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 22. BULK IMPORT FARMERS MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Bulk Farmer Import</h2>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 text-center space-y-2">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-gray-700">Drag & Drop CSV / Excel File</p>
              <p className="text-[10px] text-gray-400">Columns: Farmer Name, Mobile, Village, Taluka, District, Primary Crop, Land Area</p>
              <button onClick={() => alert("Mock CSV File Uploaded! 18 Farmers Registered.")} className="px-4 py-2 rounded-xl bg-[#064E3B] text-white font-bold text-xs mt-2">
                Browse Files
              </button>
            </div>

            <button onClick={() => setShowImportModal(false)} className="w-full py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Farmers;
