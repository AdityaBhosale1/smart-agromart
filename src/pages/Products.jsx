import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  History, 
  Copy, 
  Download, 
  Upload, 
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
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import productService, { getStockStatus } from '../services/productService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/formatters';

export const Products = () => {
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('All');
  const [gstFilter, setGstFilter] = useState('All');

  // Sorting & Pagination States
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawers States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State for Add / Edit Product
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fertilizers',
    category_id: 1,
    brand: 'IFFCO',
    hsn_code: '3105',
    gst_rate: 5,
    purchase_price: 1000,
    selling_price: 1200,
    current_stock: 50,
    minimum_stock: 10,
    unit: 'Bags',
    batch_number: 'BT2026-X1',
    manufacturing_date: '2026-01-01',
    expiry_date: '2028-12-31',
    supplier: 'IFFCO Marketing',
    recommended_crops: ['Wheat', 'Sugarcane'],
    season: 'Kharif',
    usage_guide: 'Apply during sowing',
    description: ''
  });

  // Debounce search query (300-500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch products from backend API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter !== 'All') {
        const catMap = { 'Fertilizers': 1, 'Seeds': 2, 'Pesticides': 3, 'Fungicides': 4, 'Equipment': 5 };
        if (catMap[categoryFilter]) params.category_id = catMap[categoryFilter];
      }
      const data = await productService.getProducts(params);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(getApiErrorMessage(err, 'Unable to load products from server.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ------------------------------------------------------------------
  // FILTERING & SORTING LOGIC
  // ------------------------------------------------------------------
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStockStatusFilter('All');
    setExpiryFilter('All');
    setGstFilter('All');
  };

  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q) || false;
      const matchCode = p.product_code?.toLowerCase().includes(q) || p.id?.toString().includes(q) || false;
      const matchBrand = p.brand?.toLowerCase().includes(q) || false;
      const matchHsn = p.hsn_code?.toLowerCase().includes(q) || false;
      if (!matchName && !matchCode && !matchBrand && !matchHsn) return false;
    }

    // Category Filter
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;

    // Stock Status Filter
    if (stockStatusFilter !== 'All') {
      const status = getStockStatus(p.current_stock, p.minimum_stock, p.expiry_date);
      if (status !== stockStatusFilter) return false;
    }

    // GST Filter
    if (gstFilter !== 'All' && p.gst_rate !== Number(gstFilter)) return false;

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
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

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      category: 'Fertilizers',
      category_id: 1,
      brand: 'IFFCO',
      hsn_code: '3105',
      gst_rate: 5,
      purchase_price: 260,
      selling_price: 300,
      current_stock: 50,
      minimum_stock: 10,
      unit: 'Bags',
      batch_number: 'BCH-2026-X1',
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      supplier: 'IFFCO Marketing',
      recommended_crops: ['Wheat', 'Sugarcane'],
      season: 'Kharif',
      usage_guide: 'Apply during land preparation',
      description: ''
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product) => {
    setEditingProductId(product.id);
    const catMap = { 'Fertilizers': 1, 'Seeds': 2, 'Pesticides': 3, 'Fungicides': 4, 'Equipment': 5 };
    setFormData({
      name: product.name,
      category: product.category || 'Fertilizers',
      category_id: catMap[product.category] || 1,
      brand: product.brand || '',
      hsn_code: product.hsn_code || '3808',
      gst_rate: product.gst_rate || 5,
      purchase_price: product.purchase_price || 0,
      selling_price: product.selling_price || 0,
      current_stock: product.current_stock || 0,
      minimum_stock: product.minimum_stock || 10,
      unit: product.unit || 'Kg',
      batch_number: product.batch_number || 'BCH-01',
      manufacturing_date: product.manufacturing_date || new Date().toISOString().split('T')[0],
      expiry_date: product.expiry_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      supplier: product.supplier || '',
      recommended_crops: product.recommended_crops || ['Wheat'],
      season: product.season || 'Kharif',
      usage_guide: product.usage_guide || '',
      description: product.description || '',
      status: product.status || 'Active'
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  // Handle Form Submit (Add / Edit) with API
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product Name is required!');
      return;
    }
    if (formData.purchase_price < 0 || formData.selling_price <= 0) {
      setFormError('Prices must be positive numbers!');
      return;
    }
    if (formData.selling_price < formData.purchase_price) {
      setFormError('Selling price is lower than purchase price!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProductId) {
        // Edit Existing Product via API
        await productService.updateProduct(editingProductId, formData);
        showToast('Product updated successfully!');
      } else {
        // Add New Product via API
        await productService.createProduct(formData);
        showToast('Product added successfully!');
      }
      setShowAddEditModal(false);
      await fetchProducts();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save product. Check inputs.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Product Active / Inactive Status
  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.is_active ? 'Inactive' : 'Active';
      await productService.changeProductStatus(product.id, newStatus);
      showToast(`Product set to ${newStatus}`);
      await fetchProducts();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update status.'));
    }
  };

  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const executeSoftDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.changeProductStatus(productToDelete.id, 'Inactive');
      showToast('Product deactivated successfully.');
      setShowDeleteModal(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to deactivate product.'));
    }
  };

  // Profit Margin Calculation
  const profitPerUnit = formData.selling_price - formData.purchase_price;
  const marginPercent = formData.selling_price > 0 ? ((profitPerUnit / formData.selling_price) * 100).toFixed(1) : 0;

  // Summary Card Counts
  const safeProducts = products || [];
  const totalCount = safeProducts.length;
  const fertilizerCount = safeProducts.filter(p => p?.category === 'Fertilizers').length;
  const seedCount = safeProducts.filter(p => p?.category === 'Seeds').length;
  const pesticideCount = safeProducts.filter(p => p?.category === 'Pesticides').length;
  const lowStockCount = safeProducts.filter(p => (p?.current_stock || 0) <= (p?.minimum_stock || 0)).length;

  return (
    <div className="space-y-4 pb-6 font-sans select-none">
      
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">Products Management</h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage fertilizers, seeds, pesticides, fungicides and agricultural products
            </p>
          </div>
        </div>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Products</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Products</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-40 text-xs font-semibold">
                <button onClick={() => { alert("Exporting Products to Excel (.xlsx)..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
                </button>
                <button onClick={() => { alert("Exporting Products to CSV..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                <button onClick={() => { alert("Exporting Catalog to PDF..."); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-700 flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#15803D] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
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
            <span>Unable to load products. {error}</span>
          </div>
          <button
            onClick={fetchProducts}
            className="px-3 py-1 bg-rose-600 text-white rounded-xl hover:bg-rose-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* 1. PRODUCT SUMMARY CARDS (5 COMPACT CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-gray-400">Total Products</span>
          <span className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] mt-1">{totalCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-emerald-800">Fertilizers</span>
          <span className="text-xl font-extrabold text-emerald-900 font-['Outfit'] mt-1">{fertilizerCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-sky-800">Seeds</span>
          <span className="text-xl font-extrabold text-sky-900 font-['Outfit'] mt-1">{seedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-purple-800">Pesticides</span>
          <span className="text-xl font-extrabold text-purple-900 font-['Outfit'] mt-1">{pesticideCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase text-amber-800">Low Stock</span>
          <span className="text-xl font-extrabold text-amber-900 font-['Outfit'] mt-1">{lowStockCount}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH AND FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          
          {/* SEARCH FIELD (2 COLS) */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand, category, batch or HSN..."
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

          {/* EXPIRY FILTER */}
          <div>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Expiry</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Safe">Safe</option>
            </select>
          </div>

          {/* GST RATE FILTER */}
          <div>
            <select
              value={gstFilter}
              onChange={(e) => setGstFilter(e.target.value)}
              className="w-full p-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
            >
              <option value="All">All GST Rates</option>
              <option value="0">0% GST</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
            </select>
          </div>
        </div>

        {/* RESET FILTERS */}
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
      {/* 3. PRODUCTS TABLE WITH SORTING */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs overflow-x-auto space-y-3">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>Product</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="pb-2 cursor-pointer" onClick={() => handleSort('category')}>Category</th>
              <th className="pb-2">Brand</th>
              <th className="pb-2">HSN</th>
              <th className="pb-2 text-right">GST</th>
              <th className="pb-2 text-right">Purchase</th>
              <th className="pb-2 text-right cursor-pointer" onClick={() => handleSort('selling_price')}>Selling</th>
              <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('current_stock')}>Stock</th>
              <th className="pb-2 text-center">Min</th>
              <th className="pb-2 text-center">Status</th>
              <th className="pb-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#064E3B] animate-spin" />
                    <span>Loading products from server...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-gray-500 font-medium">
                  No products found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const status = p.status;
                return (
                  <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 font-bold text-[#064E3B]">
                      <div>{p.name}</div>
                      <span className="text-[9px] text-gray-400 font-normal">Code: {p.product_code || p.id}</span>
                    </td>
                    <td className="py-3 font-semibold text-gray-700">{p.category}</td>
                    <td className="py-3 text-gray-600">{p.brand}</td>
                    <td className="py-3 font-mono text-gray-500">{p.hsn_code}</td>
                    <td className="py-3 text-right text-gray-500">{p.gst_rate}%</td>
                    <td className="py-3 text-right font-medium text-gray-600">{formatCurrency(p.purchase_price)}</td>
                    <td className="py-3 text-right font-extrabold text-[#15803D]">{formatCurrency(p.selling_price)}</td>
                    <td className="py-3 text-center font-bold">{p.current_stock} {p.unit}</td>
                    <td className="py-3 text-center text-gray-400">{p.minimum_stock}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                        status === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                        status === 'Expiring Soon' ? 'bg-orange-100 text-orange-800' :
                        status === 'Expired' ? 'bg-rose-900 text-white' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedProduct(p); setShowDetailsDrawer(true); }} className="p-1 text-gray-400 hover:text-emerald-700" title="View Product"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenEditModal(p)} className="p-1 text-gray-400 hover:text-emerald-700" title="Edit Product"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setHistoryProduct(p); setShowHistoryModal(true); }} className="p-1 text-gray-400 hover:text-emerald-700" title="Stock History"><History className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleToggleStatus(p)} className={`p-1 ${p.is_active ? 'text-emerald-600 hover:text-rose-600' : 'text-rose-500 hover:text-emerald-600'}`} title={p.is_active ? "Deactivate" : "Activate"}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ------------------------------------------------------------------ */}
        {/* 12. PAGINATION CONTROLS */}
        {/* ------------------------------------------------------------------ */}
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
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-[#064E3B] text-white rounded-lg">{currentPage}</span>
            <span>/ {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">
                {editingProductId ? 'Edit Product Master' : 'Add New Agricultural Product'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">

              
              {/* BASIC DETAILS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  1. Basic Product Details
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-gray-700">Product Name*</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" placeholder="e.g. NPK 12:32:16 50kg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Category*</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold">
                      {['Fertilizers', 'Seeds', 'Pesticides', 'Fungicides', 'Herbicides', 'Insecticides', 'Growth Promoters', 'Tools', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Brand Name</label>
                    <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" placeholder="e.g. IFFCO" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">HSN Code</label>
                    <input type="text" value={formData.hsn_code} onChange={e => setFormData({...formData, hsn_code: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-mono" placeholder="3105" />
                  </div>
                </div>
              </div>

              {/* PRICING & TAX (AUTO PROFIT & MARGIN CALCULATOR) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  2. Pricing & Tax (Auto Profit Calculator)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Purchase Price (₹)*</label>
                    <input required type="number" min="0" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Selling Price (₹)*</label>
                    <input required type="number" min="1" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">GST Rate (%)*</label>
                    <select value={formData.gst_rate} onChange={e => setFormData({...formData, gst_rate: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold">
                      {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}% GST</option>)}
                    </select>
                  </div>
                </div>

                {/* CALCULATED PROFIT MARGIN BADGE */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900">Profit Per Unit: ₹{profitPerUnit}</span>
                  <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Margin: {marginPercent}%
                  </span>
                </div>
              </div>

              {/* INVENTORY & BATCH DETAILS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  3. Inventory & Batch Control
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Opening Stock</label>
                    <input required type="number" min="0" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50">
                      {['Bags', 'Kg', 'Gram', 'Litre', 'ML', 'Packet', 'Bottle', 'Piece', 'Box', 'Units'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Min Stock Level</label>
                    <input required type="number" min="0" value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Batch Number</label>
                    <input type="text" value={formData.batch_number} onChange={e => setFormData({...formData, batch_number: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Manuf Date</label>
                    <input type="date" value={formData.manufacturing_date} onChange={e => setFormData({...formData, manufacturing_date: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Expiry Date</label>
                    <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50 font-bold" />
                  </div>
                </div>
              </div>

              {/* AGRICULTURE SPECIFICS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#15803D] tracking-wider block border-b pb-1">
                  4. Agriculture & Crop Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Crop Season</label>
                    <select value={formData.season} onChange={e => setFormData({...formData, season: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50">
                      {['Kharif', 'Rabi', 'Summer', 'All Season'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Supplier Name</label>
                    <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-2 border rounded-xl bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">{editingProductId ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. PRODUCT DETAILS DRAWER */}
      {/* ------------------------------------------------------------------ */}
      {showDetailsDrawer && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-4 overflow-y-auto shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">{selectedProduct.name}</h2>
                <span className="text-[10px] text-gray-500">{selectedProduct.brand} &bull; {selectedProduct.category}</span>
              </div>
              <button onClick={() => setShowDetailsDrawer(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-gray-50 border">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Selling Price</span>
                  <span className="text-base font-extrabold text-[#15803D]">₹{selectedProduct.selling_price}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Current Stock</span>
                  <span className="text-base font-extrabold text-emerald-900">{selectedProduct.current_stock} {selectedProduct.unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                <span className="font-bold text-gray-700 block">Specifications & HSN</span>
                <div className="flex justify-between"><span>HSN Code:</span><span className="font-mono">{selectedProduct.hsn_code}</span></div>
                <div className="flex justify-between"><span>GST Rate:</span><span>{selectedProduct.gst_rate}%</span></div>
                <div className="flex justify-between"><span>Batch Number:</span><span className="font-mono">{selectedProduct.batch_number}</span></div>
                <div className="flex justify-between"><span>Expiry Date:</span><span className="font-bold">{selectedProduct.expiry_date}</span></div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">Agriculture Advice</span>
                <p className="text-emerald-800">Crops: {selectedProduct.recommended_crops?.join(', ')}</p>
                <p className="text-emerald-700">Season: {selectedProduct.season}</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
                <span className="font-bold text-sky-900 block">Monthly Sales Performance</span>
                <div className="flex justify-between text-sky-900"><span>Units Sold:</span><span className="font-bold">142 Units</span></div>
                <div className="flex justify-between text-sky-900"><span>Revenue:</span><span className="font-extrabold">₹1,91,700</span></div>
              </div>
            </div>

            <button onClick={() => setShowDetailsDrawer(false)} className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Close Details</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 9. STOCK HISTORY MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showHistoryModal && historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Stock Audit History</h2>
                <p className="text-[11px] text-gray-500">{historyProduct.name} ({historyProduct.batch_number})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-gray-400 uppercase text-[9px]">
                  <th className="pb-1.5">Date</th>
                  <th className="pb-1.5">Type</th>
                  <th className="pb-1.5">Ref</th>
                  <th className="pb-1.5 text-center">In</th>
                  <th className="pb-1.5 text-center">Out</th>
                  <th className="pb-1.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2">08 Sep 2026</td><td className="font-bold text-emerald-700">Purchase</td><td>PUR-0056</td><td className="text-center text-emerald-700">+50</td><td className="text-center">-</td><td className="text-right font-bold">65</td></tr>
                <tr><td className="py-2">08 Sep 2026</td><td className="font-bold text-rose-600">Sale</td><td>AGM-0048</td><td className="text-center">-</td><td className="text-center text-rose-600">-2</td><td className="text-right font-bold">63</td></tr>
              </tbody>
            </table>

            <button onClick={() => setShowHistoryModal(false)} className="w-full py-2 rounded-xl bg-[#064E3B] text-white font-bold">Close History</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#064E3B]">Deactivate Product?</h3>
            <p className="text-gray-500 leading-relaxed">
              Are you sure you want to deactivate <strong>{productToDelete.name}</strong>? This product may be linked to previous billing records.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={executeSoftDelete} className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold">Confirm Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 10. BULK IMPORT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Bulk Product Import</h2>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 text-center space-y-2">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-gray-700">Drag & Drop CSV / Excel File</p>
              <p className="text-[10px] text-gray-400">Columns: Product Name, Category, Brand, HSN, GST, Purchase Price, Selling Price, Unit, Stock</p>
              <button onClick={() => alert("Mock CSV File Uploaded! 25 Products Imported.")} className="px-4 py-2 rounded-xl bg-[#064E3B] text-white font-bold text-xs mt-2">
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

export default Products;
