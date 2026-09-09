import React, { useState, useEffect, useCallback } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  History, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpDown, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Info, 
  ShieldAlert, 
  Sprout, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Clock,
  Layers,
  Sliders,
  AlertOctagon,
  ArrowRight,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import productService, { getStockStatus } from '../services/productService';
import inventoryService, { getExpiryStatus, calculateReorderQuantity } from '../services/inventoryService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/formatters';

export const Inventory = () => {
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  const [productsList, setProductsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [movementsList, setMovementsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawers
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productBatches, setProductBatches] = useState([]);
  const [productMovements, setProductMovements] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');

  // Add Stock Form State
  const [addStockForm, setAddStockForm] = useState({
    productId: '',
    supplierId: 1,
    supplier: 'Kailash Agro Agency',
    invoiceNo: 'PUR-2026-0001',
    batchNo: 'BCH-2026-X1',
    quantity: 50,
    unit: 'Bags',
    purchasePrice: 260,
    gst: 5,
    manufDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  // Stock Adjustment Form State
  const [adjForm, setAdjForm] = useState({
    productId: '',
    batchId: '',
    adjustmentType: 'ADD', // ADD or REDUCE
    quantity: 10,
    reason: 'Stock count correction'
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Inventory Data from API
  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, batches, movements] = await Promise.all([
        productService.getProducts(),
        inventoryService.getBatches(),
        inventoryService.getMovements()
      ]);
      setProductsList(prods);
      setBatchesList(batches);
      setMovementsList(movements);

      if (prods.length > 0 && !addStockForm.productId) {
        setAddStockForm(prev => ({ ...prev, productId: prods[0].id }));
        setAdjForm(prev => ({ ...prev, productId: prods[0].id }));
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(getApiErrorMessage(err, 'Unable to load inventory data from server.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Load Batch Details & Movements for Selected Product
  const handleOpenProductDetails = async (product) => {
    setSelectedProduct(product);
    setShowDetailsDrawer(true);
    setDetailsLoading(true);
    try {
      const [batches, movements] = await Promise.all([
        inventoryService.getBatches(product.id),
        inventoryService.getMovements(product.id)
      ]);
      setProductBatches(batches);
      setProductMovements(movements);
    } catch (err) {
      console.error('Error fetching product batch details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // FILTERING & SORTING LOGIC
  // ------------------------------------------------------------------
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStockStatusFilter('All');
    setExpiryStatusFilter('All');
    setSupplierFilter('All');
  };

  const filteredProducts = (productsList || []).filter(p => {
    if (!p) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q) || false;
      const matchCode = (p.product_code || p.id?.toString() || '').toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q) || false;
      if (!matchName && !matchCode && !matchBrand) return false;
    }

    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;

    if (stockStatusFilter !== 'All') {
      const status = getStockStatus(p.current_stock || 0, p.minimum_stock || 0, p.expiry_date);
      if (status !== stockStatusFilter) return false;
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + rowsPerPage);
  const indexOfFirstRow = startIndex;
  const indexOfLastRow = startIndex + paginatedProducts.length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createBatch(addStockForm);
      setAlertSuccess(`Stock added successfully for batch ${addStockForm.batchNo}!`);
      setShowAddStockModal(false);
      await fetchInventoryData();
      setTimeout(() => setAlertSuccess(''), 3000);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to add stock batch.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.adjustStock(adjForm.productId, adjForm.batchId, adjForm.adjustmentType, adjForm.physicalStock, adjForm.reason);
      setAlertSuccess('Stock physical adjustment recorded.');
      setShowAdjustmentModal(false);
      await fetchInventoryData();
      setTimeout(() => setAlertSuccess(''), 3000);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to save stock adjustment.'));
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Counts
  const safeProductsList = productsList || [];
  const totalProductsCount = safeProductsList.length;
  const totalStockUnits = safeProductsList.reduce((sum, p) => sum + (Number(p?.current_stock) || 0), 0);
  const lowStockCount = safeProductsList.filter(p => getStockStatus(p?.current_stock || 0, p?.minimum_stock || 0, p?.expiry_date) === 'Low Stock').length;
  const outOfStockCount = safeProductsList.filter(p => getStockStatus(p?.current_stock || 0, p?.minimum_stock || 0, p?.expiry_date) === 'Out of Stock').length;
  const expiringCount = safeProductsList.filter(p => getExpiryStatus(p?.expiry_date) === 'Expiring Soon').length;

  // Chart Data
  const categoryChartData = [
    { name: 'Fertilizers', value: safeProductsList.filter(p => p?.category === 'Fertilizers').length, color: '#15803D' },
    { name: 'Seeds', value: safeProductsList.filter(p => p?.category === 'Seeds').length, color: '#3B82F6' },
    { name: 'Pesticides', value: safeProductsList.filter(p => p?.category === 'Pesticides').length, color: '#A855F7' },
    { name: 'Fungicides', value: safeProductsList.filter(p => p?.category === 'Fungicides').length, color: '#F97316' },
    { name: 'Tools', value: safeProductsList.filter(p => p?.category === 'Tools').length, color: '#64748B' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans select-none">
      
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">Inventory Management</h1>
            <p className="text-xs text-gray-500 font-medium">
              Track stock, batches, expiry, movements and smart reorder requirements
            </p>
          </div>
        </div>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Inventory</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-40 text-xs font-semibold">
                <button onClick={() => { alert("Exporting Inventory Audit to Excel (.xlsx)..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
                </button>
                <button onClick={() => { alert("Exporting Stock to CSV..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                <button onClick={() => { alert("Exporting Inventory Audit Report to PDF..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#15803D] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Stock</span>
          </button>
        </div>
      </div>

      {/* ALERT BANNER */}
      {alertSuccess && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* ERROR FEEDBACK BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Unable to load data. {error}</span>
          </div>
          <button
            onClick={fetchInventoryData}
            className="px-3 py-1 bg-rose-600 text-white rounded-xl hover:bg-rose-700 flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. INVENTORY SUMMARY CARDS (5 CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-emerald-800">Total Products</span>
          <span className="text-xl font-extrabold text-emerald-900 font-['Outfit'] mt-1">{totalProductsCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-sky-800">Total Stock Units</span>
          <span className="text-xl font-extrabold text-sky-900 font-['Outfit'] mt-1">{totalStockUnits.toLocaleString()}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-amber-800">Low Stock Products</span>
          <span className="text-xl font-extrabold text-amber-900 font-['Outfit'] mt-1">{lowStockCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-rose-800">Out of Stock</span>
          <span className="text-xl font-extrabold text-rose-900 font-['Outfit'] mt-1">{outOfStockCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase text-orange-800">Expiring Soon</span>
          <span className="text-xl font-extrabold text-orange-900 font-['Outfit'] mt-1">{expiringCount}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH AND FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          
          {/* SEARCH FIELD */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product, batch, category or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* CATEGORY FILTER */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Categories</option>
              <option value="Fertilizers">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Pesticides">Pesticides</option>
              <option value="Fungicides">Fungicides</option>
              <option value="Tools">Tools</option>
            </select>
          </div>

          {/* STOCK STATUS FILTER */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* EXPIRY STATUS FILTER */}
          <div>
            <select
              value={expiryStatusFilter}
              onChange={(e) => setExpiryStatusFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Expiry Status</option>
              <option value="Safe">Safe</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
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
      {/* 3. MAIN INVENTORY TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs overflow-x-auto space-y-3">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('name')}>Product</th>
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('category')}>Category</th>
              <th className="pb-2">Batch</th>
              <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('current_stock')}>Available Stock</th>
              <th className="pb-2 text-center">Min Stock</th>
              <th className="pb-2 text-right">Purchase Price</th>
              <th className="pb-2 text-right">Selling Price</th>
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('expiry_date')}>Expiry Date</th>
              <th className="pb-2 text-center">Stock Status</th>
              <th className="pb-2 text-center">Expiry Status</th>
              <th className="pb-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#064E3B] animate-spin" />
                    <span>Loading inventory stock from server...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-gray-500 font-medium">
                  No inventory stock records found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const stockStatus = p.status || getStockStatus(p.current_stock, p.minimum_stock, p.expiry_date);
                const expiryStatus = getExpiryStatus(p.expiry_date);

                return (
                  <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 font-bold text-[#064E3B]">
                      <div>{p.name}</div>
                      <span className="text-[9px] text-gray-400 font-normal">Code: {p.product_code || p.id}</span>
                    </td>
                    <td className="py-3 font-semibold text-gray-700">{p.category}</td>
                    <td className="py-3 font-mono text-gray-500 font-semibold">{p.batch_number || 'Multiple Batches'}</td>
                    <td className="py-3 text-center font-extrabold text-[#15803D]">{p.current_stock} {p.unit}</td>
                    <td className="py-3 text-center text-gray-400">{p.minimum_stock} {p.unit}</td>
                    <td className="py-3 text-right font-medium text-gray-600">{formatCurrency(p.purchase_price)}</td>
                    <td className="py-3 text-right font-extrabold text-[#15803D]">{formatCurrency(p.selling_price)}</td>
                    <td className="py-3 font-medium text-gray-700">{formatDate(p.expiry_date)}</td>
                    
                    {/* STOCK STATUS BADGE */}
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        stockStatus === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                        stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {stockStatus}
                      </span>
                    </td>

                    {/* EXPIRY STATUS BADGE */}
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        expiryStatus === 'Safe' ? 'bg-emerald-100 text-emerald-800' :
                        expiryStatus === 'Expiring Soon' ? 'bg-orange-100 text-orange-800' :
                        'bg-rose-900 text-white'
                      }`}>
                        {expiryStatus}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenProductDetails(p)} className="p-1 text-gray-400 hover:text-emerald-700" title="View Batches & Movements"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setAddStockForm({...addStockForm, productId: p.id}); setShowAddStockModal(true); }} className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#064E3B] text-white hover:bg-[#15803D]" title="Add Stock">+ Stock</button>
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
            <span>Showing {indexOfFirstRow + 1}–{Math.min(indexOfLastRow, totalItems)} of {totalItems} products</span>
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
      {/* 13 & 14. SMART REORDER & REORDER FORMULA SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs space-y-3 backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#15803D]" />
            <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit']">Smart Stock Reorder Advisor</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-500 font-mono">
            Formula: Reorder = Predicted Demand + Safety Stock - Current Stock
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: 'Urea Fertilizer 45kg', current: 8, min: 10, sales30: 38, demand: 42, recommend: calculateReorderQuantity(42, 8, 10), priority: 'HIGH' },
            { name: 'DAP Fertilizer 50kg', current: 42, min: 15, sales30: 52, demand: 55, recommend: calculateReorderQuantity(55, 42, 15), priority: 'MEDIUM' },
            { name: 'Glyphosate 41% SL', current: 6, min: 10, sales30: 18, demand: 22, recommend: calculateReorderQuantity(22, 6, 10), priority: 'HIGH' },
          ].map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between space-y-2 text-xs">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-[#064E3B] text-xs">{r.name}</h4>
                  <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${r.priority === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>{r.priority}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600 mt-1">
                  <span>Current: <strong>{r.current}</strong></span>
                  <span>30-Day Sales: <strong>{r.sales30}</strong></span>
                  <span>Min Stock: <strong>{r.min}</strong></span>
                  <span>Demand: <strong>{r.demand}</strong></span>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="font-extrabold text-[#15803D]">Reorder: {r.recommend} Bags</span>
                <button onClick={() => alert(`Purchase Order created for ${r.name} (${r.recommend} Bags)`)} className="px-2 py-0.5 rounded bg-[#064E3B] text-white text-[9px] font-bold">Issue PO</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 15 & 16. EXPIRY & LOW STOCK ALERTS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EXPIRY ALERTS */}
        <div className="p-4 rounded-2xl bg-white/90 border border-orange-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-xs text-[#064E3B] uppercase tracking-wider font-['Outfit']">Expiry Alerts (Within 30 Days)</h3>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-orange-900">Glyphosate 41% SL (Batch GLY-B091)</p>
                <p className="text-[10px] text-orange-700">6 Bottles &bull; Expires in 20 Days (28 Sep 2026)</p>
              </div>
              <button onClick={() => alert("Action logged: Priority discount offered for quick clearance")} className="px-2 py-1 rounded bg-orange-600 text-white text-[10px] font-bold">Action Taken</button>
            </div>
          </div>
        </div>

        {/* LOW STOCK ALERTS */}
        <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs text-[#064E3B] uppercase tracking-wider font-['Outfit']">Low Stock Alerts</h3>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-amber-900">⚠ Urea Fertilizer 45kg stock is low</p>
                <p className="text-[10px] text-amber-700">Current: 8 Bags | Minimum: 10 Bags | Recommended: Order 40 Bags</p>
              </div>
              <button onClick={() => alert("Purchase requisition launched for Urea 45kg")} className="px-2 py-1 rounded bg-[#064E3B] text-white text-[10px] font-bold">Create Purchase</button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 9. STOCK MOVEMENT HISTORY LOG */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">
          Stock Movement History Log
        </h3>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[9px]">
              <th className="pb-2">Date & Time</th>
              <th className="pb-2">Product Name</th>
              <th className="pb-2">Batch</th>
              <th className="pb-2 text-center">Type</th>
              <th className="pb-2">Reference</th>
              <th className="pb-2 text-center">In</th>
              <th className="pb-2 text-center">Out</th>
              <th className="pb-2 text-right">Balance</th>
              <th className="pb-2 text-center">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movementsList.map((m) => (
              <tr key={m.id} className="hover:bg-emerald-50/30">
                <td className="py-2.5 text-gray-600 text-[11px]">{m.date_time}</td>
                <td className="py-2.5 font-bold text-[#064E3B]">{m.product_name}</td>
                <td className="py-2.5 font-mono text-[10px] text-gray-500">{m.batch_number}</td>
                <td className="py-2.5 text-center">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    m.movement_type === 'Purchase' ? 'bg-emerald-100 text-emerald-800' :
                    m.movement_type === 'Sale' ? 'bg-sky-100 text-sky-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {m.movement_type}
                  </span>
                </td>
                <td className="py-2.5 font-mono text-gray-600">{m.reference}</td>
                <td className="py-2.5 text-center font-bold text-emerald-700">{m.quantity_in}</td>
                <td className="py-2.5 text-center font-bold text-rose-600">{m.quantity_out}</td>
                <td className="py-2.5 text-right font-extrabold text-[#064E3B]">{m.balance}</td>
                <td className="py-2.5 text-center text-gray-500">{m.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. ADD STOCK MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">+ Add Stock to Inventory</h2>
              <button onClick={() => setShowAddStockModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Select Product*</label>
                <select value={addStockForm.productId} onChange={e => setAddStockForm({...addStockForm, productId: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold">
                  {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Supplier Name*</label>
                  <input required type="text" value={addStockForm.supplier} onChange={e => setAddStockForm({...addStockForm, supplier: e.target.value})} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Invoice Number*</label>
                  <input required type="text" value={addStockForm.invoiceNo} onChange={e => setAddStockForm({...addStockForm, invoiceNo: e.target.value})} className="w-full p-2 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Batch Number*</label>
                  <input required type="text" value={addStockForm.batchNo} onChange={e => setAddStockForm({...addStockForm, batchNo: e.target.value})} className="w-full p-2 border rounded-xl font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Quantity Added*</label>
                  <input required type="number" min="1" value={addStockForm.quantity} onChange={e => setAddStockForm({...addStockForm, quantity: Number(e.target.value)})} className="w-full p-2 border rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Purchase Price (₹)*</label>
                  <input required type="number" value={addStockForm.purchasePrice} onChange={e => setAddStockForm({...addStockForm, purchasePrice: Number(e.target.value)})} className="w-full p-2 border rounded-xl font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Manufacturing Date</label>
                  <input type="date" value={addStockForm.manufDate} onChange={e => setAddStockForm({...addStockForm, manufDate: e.target.value})} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Expiry Date*</label>
                  <input required type="date" value={addStockForm.expiryDate} onChange={e => setAddStockForm({...addStockForm, expiryDate: e.target.value})} className="w-full p-2 border rounded-xl font-bold" />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowAddStockModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Confirm & Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. STOCK ADJUSTMENT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Stock Physical Adjustment</h2>
              <button onClick={() => setShowAdjustmentModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Select Product</label>
                <select value={adjForm.productId} onChange={e => setAdjForm({...adjForm, productId: e.target.value})} className="w-full p-2 border rounded-xl font-bold">
                  {productsList.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.current_stock})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Actual Physical Stock</label>
                  <input required type="number" min="0" value={adjForm.physicalStock} onChange={e => setAdjForm({...adjForm, physicalStock: Number(e.target.value)})} className="w-full p-2 border rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Adjustment Reason</label>
                  <select value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} className="w-full p-2 border rounded-xl font-bold">
                    {['Damaged', 'Expired', 'Lost', 'Manual Correction', 'Sample / Giveaway', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Notes / Audit Observations</label>
                <textarea value={adjForm.notes} onChange={e => setAdjForm({...adjForm, notes: e.target.value})} className="w-full p-2 border rounded-xl" rows="2" />
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="flex-1 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-[#064E3B] text-white font-bold">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 10. MULTI-BATCH PRODUCT DETAILS DRAWER */}
      {/* ------------------------------------------------------------------ */}
      {showDetailsDrawer && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-4 overflow-y-auto shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">{selectedProduct.name}</h2>
                <span className="text-[10px] text-gray-500">{selectedProduct.category} &bull; Total Stock: {selectedProduct.current_stock} {selectedProduct.unit}</span>
              </div>
              <button onClick={() => setShowDetailsDrawer(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {/* MULTI BATCH LIST */}
            <div className="space-y-3">
              <span className="font-bold text-gray-700 text-xs block">Active Product Batches</span>
              
              {detailsLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#064E3B]" />
                  <span>Loading batch details...</span>
                </div>
              ) : (productBatches.length > 0 ? productBatches : batchesList.filter(b => b.product_id === selectedProduct.id || b.product_name === selectedProduct.name)).length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-xs">No batch records registered yet.</div>
              ) : (
                (productBatches.length > 0 ? productBatches : batchesList.filter(b => b.product_id === selectedProduct.id || b.product_name === selectedProduct.name)).map(batch => (
                  <div key={batch.id} className="p-3 rounded-xl bg-gray-50 border space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[#064E3B] font-mono">{batch.batch_number}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">{batch.current_quantity} {selectedProduct.unit}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t">
                      <span>Expiry: <strong>{formatDate(batch.expiry_date)}</strong></span>
                      <span>Purchase: <strong>{formatCurrency(batch.purchase_price)}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>


            <button onClick={() => setShowDetailsDrawer(false)} className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Close Drawer</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
