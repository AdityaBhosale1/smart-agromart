import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, Filter, RefreshCw, FileText, CheckCircle2, 
  AlertTriangle, ArrowUpRight, ArrowDownLeft, DollarSign, Package, 
  Users, Calendar, ChevronRight, X, Printer, Download, Eye, 
  RotateCcw, Edit3, Trash2, Building2, CreditCard, Layers, Tag,
  Clock, ShieldCheck, Check, HelpCircle
} from 'lucide-react';

import { productService, initialMasterProducts, getStockStatus } from '../services/productService';
import { initialProductBatches, initialStockMovements, getExpiryStatus } from '../services/inventoryService';
import { supplierService, initialMasterSuppliers, initialSupplierPayments } from '../services/supplierService';
import { purchaseService, initialMasterPurchases, initialPurchaseReturns } from '../services/purchaseService';

export const Purchases = () => {
  // Shared state references
  const [purchases, setPurchases] = useState(initialMasterPurchases);
  const [suppliers, setSuppliers] = useState(initialMasterSuppliers);
  const [products, setProducts] = useState(initialMasterProducts);
  const [batches, setBatches] = useState(initialProductBatches);
  const [movements, setMovements] = useState(initialStockMovements);
  const [payments, setPayments] = useState(initialSupplierPayments);
  const [returns, setReturns] = useState(initialPurchaseReturns);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [supData, purData, prodData] = await Promise.all([
          supplierService.getSuppliers(),
          purchaseService.getPurchases(),
          productService.getProducts()
        ]);
        if (supData && supData.length > 0) setSuppliers(supData);
        if (purData && purData.length > 0) setPurchases(purData);
        if (prodData && prodData.length > 0) setProducts(prodData);
      } catch (err) {
        console.error('Error fetching live purchase data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Active View Tab: 'list' (Purchases Table) | 'suppliers' (Suppliers List) | 'new' (New Purchase Form)
  const [activeTab, setActiveTab] = useState('list');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('This Month');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawers
  const [selectedPurchase, setSelectedPurchase] = useState(null); // For Purchase Details Modal
  const [selectedSupplier, setSelectedSupplier] = useState(null); // For Supplier Profile Drawer
  const [successPurchaseModal, setSuccessPurchaseModal] = useState(null); // For Purchase Success Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState(null);
  const [isPurchaseReturnOpen, setIsPurchaseReturnOpen] = useState(false);
  const [returnPurchase, setReturnPurchase] = useState(null);

  // Cost Update Option Configuration ('latest' | 'unchanged')
  const [costUpdateOption, setCostUpdateOption] = useState('latest');

  // =========================================================================
  // NEW PURCHASE FORM STATE
  // =========================================================================
  const defaultPurchaseForm = () => ({
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    supplier_invoice_number: '',
    supplier_invoice_date: new Date().toISOString().split('T')[0],
    payment_due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    other_charges: 0,
    round_off: 0,
    paid_amount: 0,
    payment_method: 'Cash',
    payment_reference: '',
    items: [
      {
        id: Date.now(),
        product_id: initialMasterProducts[0].id,
        product_name: initialMasterProducts[0].name,
        batch_number: 'BT-' + Math.floor(1000 + Math.random() * 9000),
        manufacturing_date: '2026-02-01',
        expiry_date: '2027-08-30',
        quantity: 10,
        unit: initialMasterProducts[0].unit,
        purchase_rate: initialMasterProducts[0].purchase_price,
        gst_rate: initialMasterProducts[0].gst_rate,
        discount: 0
      }
    ]
  });

  const [newPurchase, setNewPurchase] = useState(defaultPurchaseForm());

  // Quick Add Supplier Form State
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    contact_person: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    gstin: '',
    pan: '',
    bank_name: '',
    account_number: '',
    ifsc: '',
    notes: ''
  });

  // Quick Add Product Form State
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Fertilizers',
    brand: '',
    hsn_code: '3105',
    gst_rate: 5,
    purchase_price: 1000,
    selling_price: 1150,
    unit: 'Bags',
    minimum_stock: 10
  });

  // Record Payment Form State
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    supplier_id: '',
    amount: 0,
    payment_method: 'Bank Transfer',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Purchase Return Form State
  const [purchaseReturnForm, setPurchaseReturnForm] = useState({
    purchase_id: '',
    item_id: '',
    product_id: '',
    product_name: '',
    batch_number: '',
    return_qty: 1,
    reason: 'Damaged Stock',
    refund_amount: 0,
    notes: ''
  });

  // =========================================================================
  // CALCULATED KPI METRICS
  // =========================================================================
  const totalPurchasesMonth = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.status !== 'Cancelled' ? p.grand_total : 0), 0);
  }, [purchases]);

  const totalPurchaseOrdersCount = useMemo(() => purchases.length, [purchases]);

  const totalPendingSupplierPayments = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.current_payable, 0);
  }, [suppliers]);

  const totalStockAddedMonth = useMemo(() => {
    return purchases.reduce((sum, p) => {
      if (p.status === 'Cancelled') return sum;
      return sum + p.items.reduce((iSum, item) => iSum + Number(item.quantity || 0), 0);
    }, 0);
  }, [purchases]);

  const activeSuppliersCount = useMemo(() => {
    return suppliers.filter(s => s.status === 'Active').length;
  }, [suppliers]);

  // =========================================================================
  // FILTERED PURCHASES DATA
  // =========================================================================
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.purchase_number.toLowerCase().includes(q) ||
        p.supplier_name.toLowerCase().includes(q) ||
        p.supplier_invoice_number.toLowerCase().includes(q) ||
        p.products_summary.toLowerCase().includes(q);

      const matchesSupplier = supplierFilter === 'All' || p.supplier_name === supplierFilter;
      const matchesPurchaseStatus = purchaseStatusFilter === 'All' || p.status === purchaseStatusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'All' || p.payment_status === paymentStatusFilter;

      return matchesSearch && matchesSupplier && matchesPurchaseStatus && matchesPaymentStatus;
    });
  }, [purchases, searchQuery, supplierFilter, purchaseStatusFilter, paymentStatusFilter]);

  // Pagination
  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPurchases.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPurchases, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredPurchases.length / rowsPerPage) || 1;

  // Selected Supplier Details in New Purchase Form
  const activeSelectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === newPurchase.supplier_id) || null;
  }, [suppliers, newPurchase.supplier_id]);

  // Purchase Form Math Calculations
  const purchaseFormCalculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    newPurchase.items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.purchase_rate) || 0;
      const gstPct = Number(item.gst_rate) || 0;
      const discPct = Number(item.discount) || 0;

      const gross = qty * rate;
      const discAmount = gross * (discPct / 100);
      const taxable = gross - discAmount;
      const gstAmount = taxable * (gstPct / 100);
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const total = taxable + gstAmount;

      subtotal += gross;
      totalDiscount += discAmount;
      totalTaxable += taxable;
      totalCGST += cgst;
      totalSGST += sgst;
    });

    const otherCharges = Number(newPurchase.other_charges) || 0;
    const roundOff = Number(newPurchase.round_off) || 0;
    const grandTotal = Math.round(totalTaxable + totalCGST + totalSGST + otherCharges + roundOff);

    const paid = Number(newPurchase.paid_amount) || 0;
    const pending = Math.max(0, grandTotal - paid);

    let paymentStatus = 'Pending';
    if (paid >= grandTotal && grandTotal > 0) {
      paymentStatus = 'Paid';
    } else if (paid > 0 && paid < grandTotal) {
      paymentStatus = 'Partially Paid';
    }

    return {
      subtotal,
      totalDiscount,
      totalTaxable,
      totalCGST,
      totalSGST,
      otherCharges,
      roundOff,
      grandTotal,
      paid,
      pending,
      paymentStatus
    };
  }, [newPurchase]);

  // =========================================================================
  // HANDLERS FOR NEW PURCHASE FORM
  // =========================================================================
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newPurchase.items];
    updatedItems[index][field] = value;

    // If product selection changed, sync unit, default rate & name
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updatedItems[index].product_name = prod.name;
        updatedItems[index].unit = prod.unit;
        updatedItems[index].purchase_rate = prod.purchase_price;
        updatedItems[index].gst_rate = prod.gst_rate;
      }
    }

    setNewPurchase({ ...newPurchase, items: updatedItems });
  };

  const handleAddPurchaseItem = () => {
    const firstProd = products[0];
    const newItem = {
      id: Date.now(),
      product_id: firstProd ? firstProd.id : '',
      product_name: firstProd ? firstProd.name : '',
      batch_number: 'BT-' + Math.floor(1000 + Math.random() * 9000),
      manufacturing_date: '2026-02-01',
      expiry_date: '2027-08-30',
      quantity: 10,
      unit: firstProd ? firstProd.unit : 'Bags',
      purchase_rate: firstProd ? firstProd.purchase_price : 1000,
      gst_rate: firstProd ? firstProd.gst_rate : 5,
      discount: 0
    };
    setNewPurchase({ ...newPurchase, items: [...newPurchase.items, newItem] });
  };

  const handleRemovePurchaseItem = (index) => {
    if (newPurchase.items.length === 1) {
      alert('A purchase invoice must contain at least one item.');
      return;
    }
    const updated = newPurchase.items.filter((_, i) => i !== index);
    setNewPurchase({ ...newPurchase, items: updated });
  };

  // Complete Purchase Core Execution
  const handleCompletePurchase = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!newPurchase.supplier_id) {
      alert('Please select a valid supplier.');
      return;
    }
    if (!newPurchase.supplier_invoice_number.trim()) {
      alert('Please enter the Supplier Invoice Number.');
      return;
    }
    if (newPurchase.items.length === 0) {
      alert('Please add at least one product to the purchase invoice.');
      return;
    }

    // Expiry and Mfg date validation
    for (const item of newPurchase.items) {
      if (!item.batch_number.trim()) {
        alert(`Batch Number is required for product ${item.product_name}.`);
        return;
      }
      if (new Date(item.manufacturing_date) > new Date(item.expiry_date)) {
        alert(`Manufacturing date cannot be after Expiry date for ${item.product_name}.`);
        return;
      }
      if (getExpiryStatus(item.expiry_date) === 'Expired') {
        alert(`Expiry date for ${item.product_name} (${item.expiry_date}) is already expired.`);
        return;
      }
    }

    const { grandTotal, paid, pending, paymentStatus, subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST } = purchaseFormCalculations;
    const supplierObj = suppliers.find(s => String(s.id) === String(newPurchase.supplier_id));

    setSubmitting(true);
    try {
      const purchasePayload = {
        supplier_id: newPurchase.supplier_id,
        supplier_name: supplierObj ? supplierObj.name : 'Unknown Supplier',
        supplier_mobile: supplierObj ? supplierObj.mobile : '',
        supplier_invoice_number: newPurchase.supplier_invoice_number,
        supplier_invoice_date: newPurchase.supplier_invoice_date,
        payment_due_date: newPurchase.payment_due_date,
        reference_number: newPurchase.reference_number,
        item_discount: totalDiscount,
        grand_total: grandTotal,
        paid_amount: paid,
        payment_method: newPurchase.payment_method,
        notes: newPurchase.notes || 'Direct Purchase Stock Inward',
        items: newPurchase.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          batch_number: item.batch_number,
          manufacturing_date: item.manufacturing_date,
          expiry_date: item.expiry_date,
          quantity: Number(item.quantity),
          unit: item.unit,
          purchase_rate: Number(item.purchase_rate),
          gst_rate: Number(item.gst_rate),
          discount: Number(item.discount || 0)
        }))
      };

      const result = await purchaseService.createPurchase(purchasePayload);

      // Refresh live state from backend
      const [updatedSuppliers, updatedPurchases, updatedProducts] = await Promise.all([
        supplierService.getSuppliers(),
        purchaseService.getPurchases(),
        productService.getProducts()
      ]);

      if (updatedSuppliers) setSuppliers(updatedSuppliers);
      if (updatedPurchases) setPurchases(updatedPurchases);
      if (updatedProducts) setProducts(updatedProducts);

      const returnedRecord = {
        id: result?.purchase_number || result?.id || `PUR-${Date.now().toString().slice(-4)}`,
        purchase_number: result?.purchase_number || `PUR-${Date.now().toString().slice(-4)}`,
        purchase_date: newPurchase.purchase_date,
        supplier_id: newPurchase.supplier_id,
        supplier_name: supplierObj ? supplierObj.name : 'Unknown Supplier',
        supplier_invoice_number: newPurchase.supplier_invoice_number,
        grand_total: grandTotal,
        paid_amount: paid,
        pending_amount: pending,
        payment_status: paymentStatus,
        status: 'Completed',
        items: newPurchase.items
      };

      setSuccessPurchaseModal(returnedRecord);
      setNewPurchase(defaultPurchaseForm());
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to create purchase in Supabase:', err);
      alert(`Error creating purchase: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Add Supplier Handler
  const handleSaveNewSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim() || !newSupplierForm.mobile.trim()) {
      alert('Supplier Name and Mobile Number are required.');
      return;
    }

    try {
      const created = await supplierService.addSupplier(newSupplierForm);
      const updatedSuppliers = await supplierService.getSuppliers();
      setSuppliers(updatedSuppliers);
      if (created && created.id) {
        setNewPurchase({ ...newPurchase, supplier_id: String(created.id) });
      }
      setIsAddSupplierOpen(false);
      setNewSupplierForm({
        name: '', contact_person: '', mobile: '', alternate_mobile: '', email: '',
        address: '', city: '', district: '', state: 'Maharashtra', pincode: '',
        gstin: '', pan: '', bank_name: '', account_number: '', ifsc: '', notes: ''
      });
    } catch (err) {
      console.error('Failed to save supplier in Supabase:', err);
      alert(`Error saving supplier: ${err.message || err}`);
    }
  };

  // Quick Add Product Handler
  const handleSaveNewProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      alert('Product Name is required.');
      return;
    }

    const newId = `P${100 + products.length + 1}`;
    const newProd = {
      id: newId,
      name: newProductForm.name,
      category: newProductForm.category,
      brand: newProductForm.brand || 'Generic',
      hsn_code: newProductForm.hsn_code || '3105',
      gst_rate: Number(newProductForm.gst_rate) || 5,
      purchase_price: Number(newProductForm.purchase_price) || 1000,
      selling_price: Number(newProductForm.selling_price) || 1200,
      current_stock: 0,
      minimum_stock: Number(newProductForm.minimum_stock) || 10,
      unit: newProductForm.unit || 'Bags',
      batch_number: 'N/A',
      manufacturing_date: 'N/A',
      expiry_date: 'N/A',
      supplier: activeSelectedSupplier ? activeSelectedSupplier.name : 'Unknown',
      recommended_crops: ['All Crops'],
      season: 'All Season',
      usage_guide: 'Follow manufacturer instructions.',
      status: 'Out of Stock',
      description: 'Newly registered agricultural product'
    };

    setProducts([...products, newProd]);
    setIsQuickAddProductOpen(false);
    
    // Automatically add as item in purchase
    const newItem = {
      id: Date.now(),
      product_id: newId,
      product_name: newProd.name,
      batch_number: 'BT-' + Math.floor(1000 + Math.random() * 9000),
      manufacturing_date: '2026-02-01',
      expiry_date: '2027-08-30',
      quantity: 10,
      unit: newProd.unit,
      purchase_rate: newProd.purchase_price,
      gst_rate: newProd.gst_rate,
      discount: 0
    };
    setNewPurchase({ ...newPurchase, items: [...newPurchase.items, newItem] });
  };

  // Record Supplier Payment Handler
  const handleRecordSupplierPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!recordPaymentForm.supplier_id || Number(recordPaymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount and select a supplier.');
      return;
    }

    try {
      await supplierService.recordSupplierPayment(recordPaymentForm);
      const updatedSuppliers = await supplierService.getSuppliers();
      setSuppliers(updatedSuppliers);
      setIsRecordPaymentOpen(false);
      alert('Supplier payment recorded successfully.');
    } catch (err) {
      console.error('Failed to record supplier payment:', err);
      alert(`Error recording supplier payment: ${err.message || err}`);
    }
  };

  // Purchase Return Handler
  const handleExecutePurchaseReturn = (e) => {
    e.preventDefault();
    const retQty = Number(purchaseReturnForm.return_qty);
    if (!purchaseReturnForm.purchase_id || retQty <= 0) {
      alert('Please enter a valid return quantity.');
      return;
    }

    const purObj = purchases.find(p => p.id === purchaseReturnForm.purchase_id);
    if (!purObj) return;

    const retId = `PRET-2026-000${returns.length + 5}`;
    const refundAmt = Number(purchaseReturnForm.refund_amount) || (retQty * (purchaseReturnForm.purchase_rate || 1000));

    const returnRecord = {
      id: retId,
      date: new Date().toISOString().split('T')[0],
      purchase_number: purObj.purchase_number,
      supplier_name: purObj.supplier_name,
      product_name: purchaseReturnForm.product_name,
      batch_number: purchaseReturnForm.batch_number,
      quantity_returned: retQty,
      unit: purchaseReturnForm.unit || 'Units',
      reason: purchaseReturnForm.reason,
      refund_amount: refundAmt,
      status: 'Approved'
    };

    setReturns([returnRecord, ...returns]);

    // Reduce inventory batch quantity & product master current stock
    setProducts(products.map(p => {
      if (p.id === purchaseReturnForm.product_id) {
        const newStock = Math.max(0, p.current_stock - retQty);
        return {
          ...p,
          current_stock: newStock,
          status: getStockStatus(newStock, p.minimum_stock, p.expiry_date)
        };
      }
      return p;
    }));

    // Add Purchase Return Stock Movement
    setMovements([
      {
        id: `MOV-${Math.floor(1000 + Math.random() * 9000)}`,
        date_time: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        product_name: purchaseReturnForm.product_name,
        batch_number: purchaseReturnForm.batch_number,
        movement_type: 'Purchase Return',
        reference: retId,
        quantity_in: '-',
        quantity_out: retQty,
        balance: Math.max(0, (products.find(p => p.id === purchaseReturnForm.product_id)?.current_stock || 0) - retQty),
        user: 'Admin'
      },
      ...movements
    ]);

    // Reduce supplier payable or update purchase status
    setSuppliers(suppliers.map(s => {
      if (s.name === purObj.supplier_name) {
        return {
          ...s,
          current_payable: Math.max(0, s.current_payable - refundAmt)
        };
      }
      return s;
    }));

    setPurchases(purchases.map(p => {
      if (p.id === purObj.id) {
        return {
          ...p,
          status: 'Returned / Partially Returned'
        };
      }
      return p;
    }));

    setIsPurchaseReturnOpen(false);
    alert(`Purchase Return executed. ${retQty} units returned to supplier and stock updated.`);
  };

  return (
    <div className="space-y-5 pb-8 font-sans">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">Purchases</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-emerald-300">
                Stock Inward ERP
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Manage supplier purchases, stock inward, batches, invoices and purchase payments
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS & VIEW TOGGLE */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation View Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 mr-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'list' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Purchases List
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'suppliers' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Suppliers Directory ({suppliers.length})
            </button>
          </div>

          <button
            onClick={() => setActiveTab('new')}
            className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#064E3B] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Purchase</span>
          </button>

          <button
            onClick={() => {
              setNewSupplierForm({
                name: '', contact_person: '', mobile: '', alternate_mobile: '', email: '',
                address: '', city: '', district: '', state: 'Maharashtra', pincode: '',
                gstin: '', pan: '', bank_name: '', account_number: '', ifsc: '', notes: ''
              });
              setIsAddSupplierOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>

          <button
            onClick={() => alert('Purchases register exported to Excel & PDF successfully.')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-200 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export Purchases</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PURCHASE SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Purchases This Month */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Purchases This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803D] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-[#064E3B] font-['Outfit']">
              ₹{totalPurchasesMonth.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Purchase Orders */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Purchase Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-blue-900 font-['Outfit']">
              {totalPurchaseOrdersCount}
            </h3>
            <p className="text-[11px] font-medium text-gray-500 mt-1">42 Inward transactions</p>
          </div>
        </div>

        {/* Card 3: Pending Supplier Payments */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending Supplier Payments</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-amber-900 font-['Outfit']">
              ₹{totalPendingSupplierPayments.toLocaleString('en-IN')}
            </h3>
            <button
              onClick={() => {
                if (suppliers.length > 0) {
                  setRecordPaymentForm({
                    supplier_id: suppliers[0].id,
                    amount: suppliers[0].current_payable || 10000,
                    payment_method: 'Bank Transfer',
                    reference: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                  setIsRecordPaymentOpen(true);
                }
              }}
              className="text-[11px] font-bold text-amber-700 hover:underline mt-1 block"
            >
              Pay Suppliers →
            </button>
          </div>
        </div>

        {/* Card 4: Stock Added This Month */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stock Added This Month</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-teal-950 font-['Outfit']">
              {totalStockAddedMonth.toLocaleString()} Units
            </h3>
            <p className="text-[11px] font-medium text-gray-500 mt-1">across fertilizers & seeds</p>
          </div>
        </div>

        {/* Card 5: Active Suppliers */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Suppliers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-indigo-950 font-['Outfit']">
              {activeSuppliersCount}
            </h3>
            <p className="text-[11px] font-medium text-indigo-700 mt-1">100% Verified GSTIN</p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT VIEWS SWITCHING */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VIEW 1: PURCHASES LIST VIEW */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'list' && (
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
                  placeholder="Search purchase, invoice, supplier or product..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              {/* Supplier Filter */}
              <div>
                <select
                  value={supplierFilter}
                  onChange={e => setSupplierFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Supplier: All Suppliers</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Purchase Status Filter */}
              <div>
                <select
                  value={purchaseStatusFilter}
                  onChange={e => setPurchaseStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Purchase Status: All</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned / Partially Returned">Returned</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">Payment: All</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

            </div>

            {/* Filter Reset Row */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-medium">
                Showing <strong className="text-gray-900">{filteredPurchases.length}</strong> purchase orders
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSupplierFilter('All');
                  setPurchaseStatusFilter('All');
                  setPaymentStatusFilter('All');
                  setDateRangeFilter('This Month');
                }}
                className="text-xs text-[#15803D] hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* PURCHASES TABLE */}
          <div className="rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#064E3B]/5 text-[#064E3B] font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Purchase ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Supplier Invoice</th>
                    <th className="p-3.5">Products</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Pending</th>
                    <th className="p-3.5 text-center">Payment Status</th>
                    <th className="p-3.5 text-center">Purchase Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {paginatedPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400 font-bold">
                        No purchase orders found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3.5 font-bold text-[#064E3B]">
                          {p.purchase_number}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-gray-600">
                          {p.purchase_date}
                        </td>
                        <td className="p-3.5 font-bold text-gray-900">
                          {p.supplier_name}
                        </td>
                        <td className="p-3.5 font-mono text-gray-600">
                          {p.supplier_invoice_number}
                        </td>
                        <td className="p-3.5 max-w-[200px] truncate text-gray-600" title={p.products_summary}>
                          {p.products_summary}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-gray-900">
                          ₹{p.grand_total.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-700">
                          ₹{p.paid_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-amber-700">
                          ₹{p.pending_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            p.payment_status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {p.payment_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.status === 'Completed' ? 'bg-teal-100 text-teal-800' :
                            p.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedPurchase(p)}
                              title="View Purchase Details"
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#064E3B] hover:text-white text-gray-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {p.pending_amount > 0 && (
                              <button
                                onClick={() => {
                                  const supp = suppliers.find(s => s.name === p.supplier_name);
                                  setRecordPaymentForm({
                                    supplier_id: supp ? supp.id : suppliers[0].id,
                                    amount: p.pending_amount,
                                    payment_method: 'Bank Transfer',
                                    reference: '',
                                    notes: `Payment for ${p.purchase_number}`,
                                    date: new Date().toISOString().split('T')[0]
                                  });
                                  setIsRecordPaymentOpen(true);
                                }}
                                title="Record Supplier Payment"
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-200 transition-colors"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPurchaseReturnForm({
                                  purchase_id: p.id,
                                  item_id: p.items[0]?.id || '',
                                  product_id: p.items[0]?.product_id || '',
                                  product_name: p.items[0]?.product_name || '',
                                  batch_number: p.items[0]?.batch_number || '',
                                  return_qty: 1,
                                  reason: 'Damaged Stock',
                                  refund_amount: p.items[0]?.purchase_rate || 1000,
                                  notes: ''
                                });
                                setReturnPurchase(p);
                                setIsPurchaseReturnOpen(true);
                              }}
                              title="Purchase Return"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
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

      {/* ------------------------------------------------------------------------- */}
      {/* VIEW 2: SUPPLIERS DIRECTORY VIEW */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Registered Agricultural Suppliers</h2>
              <p className="text-xs text-gray-500">Manage wholesaler profiles, credit accounts and bank details</p>
            </div>
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#064E3B] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white/90 border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#064E3B]/5 text-[#064E3B] font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Supplier Name</th>
                    <th className="p-3.5">Contact Person</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">GSTIN</th>
                    <th className="p-3.5 text-right">Total Purchases</th>
                    <th className="p-3.5 text-right">Pending Payable</th>
                    <th className="p-3.5">Last Purchase</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-emerald-50/40">
                      <td className="p-3.5 font-extrabold text-[#064E3B]">
                        {s.name}
                        <span className="block text-[10px] text-gray-400 font-mono font-normal">{s.supplier_code}</span>
                      </td>
                      <td className="p-3.5 text-gray-800">{s.contact_person}</td>
                      <td className="p-3.5 font-mono text-gray-700">{s.mobile}</td>
                      <td className="p-3.5 font-mono text-gray-600">{s.gstin}</td>
                      <td className="p-3.5 text-right font-bold text-gray-900">₹{s.total_purchases.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-extrabold text-amber-700">₹{s.current_payable.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-gray-600">{s.last_purchase_date}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSupplier(s)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#064E3B] hover:text-white font-bold text-[11px] transition-colors"
                          >
                            Profile
                          </button>
                          {s.current_payable > 0 && (
                            <button
                              onClick={() => {
                                setRecordPaymentForm({
                                  supplier_id: s.id,
                                  amount: s.current_payable,
                                  payment_method: 'Bank Transfer',
                                  reference: '',
                                  notes: `Settlement for ${s.name}`,
                                  date: new Date().toISOString().split('T')[0]
                                });
                                setIsRecordPaymentOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VIEW 3: NEW PURCHASE FORM (FULL ENTRY SYSTEM) */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'new' && (
        <form onSubmit={handleCompletePurchase} className="space-y-5">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">New Supplier Purchase Entry</h2>
              <p className="text-xs text-gray-500">Record inward inventory batch stock and create supplier invoice</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Product Cost Strategy Configuration */}
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                <span>Cost Update Rule:</span>
                <select
                  value={costUpdateOption}
                  onChange={e => setCostUpdateOption(e.target.value)}
                  className="bg-white p-1 rounded-lg font-bold border border-gray-300 text-gray-900"
                >
                  <option value="latest">Option A: Update Master Cost to Latest</option>
                  <option value="unchanged">Option B: Keep Master Cost Unchanged</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* LEFT 2 COLUMNS: PURCHASE DETAILS & ITEMS TABLE */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* SECTION A: PURCHASE DETAILS */}
              <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
                <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2 flex items-center justify-between">
                  <span>Section A: Purchase & Supplier Details</span>
                  <span className="text-[10px] text-gray-400 font-normal">* Required fields</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Purchase Date*</label>
                    <input
                      required
                      type="date"
                      value={newPurchase.purchase_date}
                      onChange={e => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700">Supplier Name*</label>
                      <button
                        type="button"
                        onClick={() => setIsAddSupplierOpen(true)}
                        className="text-[10px] font-extrabold text-[#15803D] hover:underline"
                      >
                        + Add Supplier
                      </button>
                    </div>
                    <select
                      required
                      value={newPurchase.supplier_id}
                      onChange={e => setNewPurchase({ ...newPurchase, supplier_id: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-bold text-gray-900"
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.gstin})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Supplier Invoice Number*</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. INV-AG-2048"
                      value={newPurchase.supplier_invoice_number}
                      onChange={e => setNewPurchase({ ...newPurchase, supplier_invoice_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Supplier Invoice Date</label>
                    <input
                      type="date"
                      value={newPurchase.supplier_invoice_date}
                      onChange={e => setNewPurchase({ ...newPurchase, supplier_invoice_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Payment Due Date</label>
                    <input
                      type="date"
                      value={newPurchase.payment_due_date}
                      onChange={e => setNewPurchase({ ...newPurchase, payment_due_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Ref / PO Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PO-8812"
                      value={newPurchase.reference_number}
                      onChange={e => setNewPurchase({ ...newPurchase, reference_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* SELECTED SUPPLIER INFO BADGE */}
                {activeSelectedSupplier && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-900">
                    <div>
                      <span className="font-extrabold text-sm block">{activeSelectedSupplier.name}</span>
                      <span className="text-[11px] font-mono text-emerald-800">
                        GSTIN: {activeSelectedSupplier.gstin} | Mobile: {activeSelectedSupplier.mobile}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Current Payable</span>
                      <span className="font-extrabold text-amber-800 text-sm">
                        ₹{activeSelectedSupplier.current_payable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* SECTION B: PURCHASE ITEMS TABLE & MULTI-BATCH SUPPORT */}
              <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit']">Section B: Purchase Items & Batches</h3>
                    <p className="text-[11px] text-gray-500">Supports multiple batches for the same product in a single inward entry</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddProductOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[#064E3B] font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Product</span>
                  </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 w-8">#</th>
                        <th className="p-2 min-w-[180px]">Product*</th>
                        <th className="p-2 min-w-[110px]">Batch No*</th>
                        <th className="p-2 min-w-[110px]">Expiry Date*</th>
                        <th className="p-2 w-20 text-center">Qty*</th>
                        <th className="p-2 w-20">Unit</th>
                        <th className="p-2 w-24 text-right">Rate (₹)*</th>
                        <th className="p-2 w-16 text-center">GST %</th>
                        <th className="p-2 w-16 text-center">Disc %</th>
                        <th className="p-2 w-24 text-right">Taxable</th>
                        <th className="p-2 w-28 text-right">Total (₹)</th>
                        <th className="p-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {newPurchase.items.map((item, idx) => {
                        const qty = Number(item.quantity) || 0;
                        const rate = Number(item.purchase_rate) || 0;
                        const gstPct = Number(item.gst_rate) || 0;
                        const discPct = Number(item.discount) || 0;

                        const gross = qty * rate;
                        const taxable = gross - (gross * (discPct / 100));
                        const total = taxable + (taxable * (gstPct / 100));

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-2 font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-2">
                              <select
                                required
                                value={item.product_id}
                                onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-900"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="text"
                                value={item.batch_number}
                                onChange={e => handleItemChange(idx, 'batch_number', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white font-mono font-bold uppercase"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="date"
                                value={item.expiry_date}
                                onChange={e => handleItemChange(idx, 'expiry_date', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-center font-extrabold text-[#064E3B]"
                              />
                            </td>
                            <td className="p-2 text-gray-500 font-bold">{item.unit}</td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.purchase_rate}
                                onChange={e => handleItemChange(idx, 'purchase_rate', Number(e.target.value))}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-right font-extrabold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.gst_rate}
                                onChange={e => handleItemChange(idx, 'gst_rate', Number(e.target.value))}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.discount}
                                onChange={e => handleItemChange(idx, 'discount', Number(e.target.value))}
                                className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-center"
                              />
                            </td>
                            <td className="p-2 text-right font-bold text-gray-700">
                              ₹{taxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-extrabold text-emerald-800">
                              ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePurchaseItem(idx)}
                                className="p-1 rounded-md hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddPurchaseItem}
                  className="w-full py-2.5 rounded-xl bg-dashed border-2 border-dashed border-emerald-300 hover:border-[#15803D] hover:bg-emerald-50/50 text-[#15803D] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Product Item Row</span>
                </button>

              </div>

            </div>

            {/* RIGHT COLUMN: PURCHASE SUMMARY & PAYMENT DETAILS */}
            <div className="space-y-5">
              
              {/* SECTION C: PURCHASE FINANCIAL SUMMARY */}
              <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">
                  Purchase Summary
                </h3>

                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Subtotal</span>
                    <span className="font-bold">₹{purchaseFormCalculations.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Item Discount</span>
                    <span className="font-bold text-rose-600">-₹{purchaseFormCalculations.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Taxable Amount</span>
                    <span className="font-bold">₹{purchaseFormCalculations.totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>CGST</span>
                    <span>₹{purchaseFormCalculations.totalCGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>SGST</span>
                    <span>₹{purchaseFormCalculations.totalSGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* Additional Transport / Loading Charges */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <label className="font-bold text-gray-700">Transport / Other Charges (₹)</label>
                    <input
                      type="number"
                      value={newPurchase.other_charges}
                      onChange={e => setNewPurchase({ ...newPurchase, other_charges: Number(e.target.value) })}
                      className="w-24 p-1.5 rounded-lg border border-gray-300 text-right font-bold text-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700">Round Off (₹)</label>
                    <input
                      type="number"
                      value={newPurchase.round_off}
                      onChange={e => setNewPurchase({ ...newPurchase, round_off: Number(e.target.value) })}
                      className="w-24 p-1.5 rounded-lg border border-gray-300 text-right font-bold text-gray-900"
                    />
                  </div>
                </div>

                {/* GRAND TOTAL BIG BOX */}
                <div className="p-4 rounded-xl bg-[#064E3B] text-white flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-200 block">Grand Total</span>
                    <span className="text-xl font-extrabold font-['Outfit']">
                      ₹{purchaseFormCalculations.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Tag className="w-6 h-6 text-emerald-300" />
                </div>
              </div>

              {/* SECTION D: PAYMENT SECTION */}
              <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-extrabold text-sm text-[#064E3B] font-['Outfit'] border-b pb-2">
                  Payment Details
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Payment Mode</label>
                    <select
                      value={newPurchase.payment_method}
                      onChange={e => setNewPurchase({ ...newPurchase, payment_method: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-900"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit / Pay Later">Credit / Pay Later (0 Paid)</option>
                      <option value="Split Payment">Split Payment</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={purchaseFormCalculations.grandTotal}
                      value={newPurchase.paid_amount}
                      onChange={e => setNewPurchase({ ...newPurchase, paid_amount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-extrabold text-emerald-800 text-base"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Payment Ref / Transaction ID</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR90128390"
                      value={newPurchase.payment_reference}
                      onChange={e => setNewPurchase({ ...newPurchase, payment_reference: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 font-mono"
                    />
                  </div>

                  {/* AUTO CALCULATED PENDING STATUS */}
                  <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>Pending Balance:</span>
                      <span className="text-amber-800">₹{purchaseFormCalculations.pending.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Payment Status:</span>
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                        purchaseFormCalculations.paymentStatus === 'Paid' ? 'bg-emerald-200 text-emerald-900' :
                        purchaseFormCalculations.paymentStatus === 'Partially Paid' ? 'bg-amber-200 text-amber-900' :
                        'bg-rose-200 text-rose-900'
                      }`}>
                        {purchaseFormCalculations.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PRIMARY SUBMIT ACTIONS */}
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert('Purchase saved as draft.');
                      setActiveTab('list');
                    }}
                    className="w-1/3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    Save Draft
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-3 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Complete Purchase</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PURCHASE SUCCESS SCREEN */}
      {/* ========================================================================= */}
      {successPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-200 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#064E3B] font-['Outfit']">Purchase Added Successfully</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">Stock Updated in Inventory Immediately</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Purchase ID:</span>
                <span className="font-extrabold text-[#064E3B]">{successPurchaseModal.purchase_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supplier:</span>
                <span className="font-bold">{successPurchaseModal.supplier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items Inwarded:</span>
                <span className="font-bold">{successPurchaseModal.items_count} Product(s)</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-500">Grand Total:</span>
                <span className="font-extrabold text-gray-900">₹{successPurchaseModal.grand_total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid Amount:</span>
                <span className="font-bold">₹{successPurchaseModal.paid_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Pending Balance:</span>
                <span className="font-bold">₹{successPurchaseModal.pending_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2">
              <button
                onClick={() => {
                  setSelectedPurchase(successPurchaseModal);
                  setSuccessPurchaseModal(null);
                }}
                className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                View Purchase
              </button>
              <button
                onClick={() => alert(`Printing Official Purchase Receipt ${successPurchaseModal.purchase_number}...`)}
                className="py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Purchase</span>
              </button>
            </div>

            <button
              onClick={() => setSuccessPurchaseModal(null)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PURCHASE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">
                  Purchase Invoice {selectedPurchase.purchase_number}
                </h3>
                <p className="text-gray-500 font-medium">Inward Date: {selectedPurchase.purchase_date}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Supplier</span>
                <span className="font-extrabold text-gray-900">{selectedPurchase.supplier_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Supplier Invoice</span>
                <span className="font-mono font-bold text-gray-700">{selectedPurchase.supplier_invoice_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Payment Status</span>
                <span className="font-bold text-emerald-800">{selectedPurchase.payment_status}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Purchase Status</span>
                <span className="font-bold text-teal-800">{selectedPurchase.status}</span>
              </div>
            </div>

            {/* ITEMS BREAKDOWN TABLE */}
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Inward Items & Batch Breakdown</h4>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">GST</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPurchase.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-gray-900">{item.product_name}</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">{item.batch_number}</td>
                        <td className="p-2 text-gray-600">{item.expiry_date}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">₹{item.purchase_rate}</td>
                        <td className="p-2 text-right">{item.gst_rate}%</td>
                        <td className="p-2 text-right font-bold text-gray-900">₹{item.total_amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">₹{selectedPurchase.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (CGST+SGST):</span>
                <span className="font-bold">₹{(selectedPurchase.cgst + selectedPurchase.sgst).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport / Other Charges:</span>
                <span className="font-bold">₹{selectedPurchase.other_charges}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-extrabold text-sm text-[#064E3B]">
                <span>Grand Total:</span>
                <span>₹{selectedPurchase.grand_total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold pt-1">
                <span>Paid Amount:</span>
                <span>₹{selectedPurchase.paid_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Pending Balance:</span>
                <span>₹{selectedPurchase.pending_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK ADD SUPPLIER MODAL */}
      {/* ========================================================================= */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveNewSupplier} className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">+ Register New Supplier</h3>
              <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Supplier Name*</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mahyco Seeds Agency"
                  value={newSupplierForm.name}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={newSupplierForm.contact_person}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, contact_person: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mobile Number*</label>
                <input
                  required
                  type="text"
                  placeholder="9876543210"
                  value={newSupplierForm.mobile}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, mobile: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Alternate Mobile</label>
                <input
                  type="text"
                  value={newSupplierForm.alternate_mobile}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, alternate_mobile: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">GSTIN</label>
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={newSupplierForm.gstin}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, gstin: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Address</label>
                <input
                  type="text"
                  placeholder="Market Yard, Station Road"
                  value={newSupplierForm.address}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">City / District</label>
                <input
                  type="text"
                  placeholder="Nashik"
                  value={newSupplierForm.city}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, city: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Bank Name</label>
                <input
                  type="text"
                  placeholder="State Bank of India"
                  value={newSupplierForm.bank_name}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, bank_name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Account Number</label>
                <input
                  type="text"
                  placeholder="30981234567"
                  value={newSupplierForm.account_number}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, account_number: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">IFSC Code</label>
                <input
                  type="text"
                  placeholder="SBIN0001234"
                  value={newSupplierForm.ifsc}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, ifsc: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD SUPPLIER PAYMENT */}
      {/* ========================================================================= */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRecordSupplierPaymentSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Record Supplier Payment</h3>
              <button type="button" onClick={() => setIsRecordPaymentOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Supplier*</label>
                <select
                  value={recordPaymentForm.supplier_id}
                  onChange={e => {
                    const s = suppliers.find(sup => sup.id === e.target.value);
                    setRecordPaymentForm({
                      ...recordPaymentForm,
                      supplier_id: e.target.value,
                      amount: s ? s.current_payable : 0
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: ₹{s.current_payable.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Payment Amount (₹)*</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={recordPaymentForm.amount}
                  onChange={e => setRecordPaymentForm({ ...recordPaymentForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-extrabold text-emerald-800 text-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Payment Method</label>
                <select
                  value={recordPaymentForm.payment_method}
                  onChange={e => setRecordPaymentForm({ ...recordPaymentForm, payment_method: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR98127391827"
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
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PURCHASE RETURN MODAL */}
      {/* ========================================================================= */}
      {isPurchaseReturnOpen && returnPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleExecutePurchaseReturn} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-rose-800 font-['Outfit']">Execute Purchase Return</h3>
              <button type="button" onClick={() => setIsPurchaseReturnOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <span className="font-bold block">Invoice: {returnPurchase.purchase_number}</span>
                <span>Supplier: {returnPurchase.supplier_name}</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Select Product to Return</label>
                <select
                  value={purchaseReturnForm.product_id}
                  onChange={e => {
                    const item = returnPurchase.items.find(i => i.product_id === e.target.value);
                    if (item) {
                      setPurchaseReturnForm({
                        ...purchaseReturnForm,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        batch_number: item.batch_number,
                        purchase_rate: item.purchase_rate,
                        unit: item.unit
                      });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  {returnPurchase.items.map(item => (
                    <option key={item.id} value={item.product_id}>
                      {item.product_name} (Batch: {item.batch_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Return Qty*</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={purchaseReturnForm.return_qty}
                    onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, return_qty: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Return Reason</label>
                  <select
                    value={purchaseReturnForm.reason}
                    onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, reason: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                  >
                    <option value="Damaged Stock">Damaged Stock</option>
                    <option value="Wrong Product">Wrong Product</option>
                    <option value="Expired / Short Expiry">Expired / Short Expiry</option>
                    <option value="Excess Quantity">Excess Quantity</option>
                    <option value="Quality Issue">Quality Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Refund / Credit Adjustment (₹)</label>
                <input
                  type="number"
                  value={purchaseReturnForm.refund_amount}
                  onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, refund_amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-right"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsPurchaseReturnOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Stock Return
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SUPPLIER PROFILE DRAWER */}
      {/* ========================================================================= */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl border-l border-gray-200 space-y-5 overflow-y-auto custom-scrollbar text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">{selectedSupplier.name}</h3>
                <span className="text-gray-500 font-mono">{selectedSupplier.supplier_code}</span>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Lifetime Purchases</span>
                <span className="font-extrabold text-gray-900 text-sm">₹{selectedSupplier.total_purchases.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Paid</span>
                <span className="font-bold text-emerald-800 text-sm">₹{selectedSupplier.total_paid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Pending Payable</span>
                <span className="font-extrabold text-amber-800 text-sm">₹{selectedSupplier.current_payable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2 text-gray-700">
              <h4 className="font-bold text-gray-900 border-b pb-1">Supplier Profile Info</h4>
              <div className="flex justify-between"><span>Contact Person:</span><span className="font-bold">{selectedSupplier.contact_person}</span></div>
              <div className="flex justify-between"><span>Mobile:</span><span className="font-mono">{selectedSupplier.mobile}</span></div>
              <div className="flex justify-between"><span>GSTIN:</span><span className="font-mono">{selectedSupplier.gstin}</span></div>
              <div className="flex justify-between"><span>Address:</span><span>{selectedSupplier.address}, {selectedSupplier.city}</span></div>
              <div className="flex justify-between"><span>Bank:</span><span>{selectedSupplier.bank_name} ({selectedSupplier.account_number})</span></div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: QUICK CREATE PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isQuickAddProductOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveNewProduct} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">+ Quick Create Product</h3>
              <button type="button" onClick={() => setIsQuickAddProductOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Product Name*</label>
              <input
                required
                type="text"
                placeholder="e.g. Zinc Sulphate 33% 1kg"
                value={newProductForm.name}
                onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Category</label>
                <select
                  value={newProductForm.category}
                  onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold"
                >
                  <option value="Fertilizers">Fertilizers</option>
                  <option value="Pesticides">Pesticides</option>
                  <option value="Seeds">Seeds</option>
                  <option value="Fungicides">Fungicides</option>
                  <option value="Tools">Tools</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Mahadhan"
                  value={newProductForm.brand}
                  onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Purchase Rate (₹)</label>
                <input
                  type="number"
                  value={newProductForm.purchase_price}
                  onChange={e => setNewProductForm({ ...newProductForm, purchase_price: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Selling Price (₹)</label>
                <input
                  type="number"
                  value={newProductForm.selling_price}
                  onChange={e => setNewProductForm({ ...newProductForm, selling_price: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold text-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">GST %</label>
                <input
                  type="number"
                  value={newProductForm.gst_rate}
                  onChange={e => setNewProductForm({ ...newProductForm, gst_rate: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsQuickAddProductOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold"
              >
                Add & Populate Item
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Purchases;
