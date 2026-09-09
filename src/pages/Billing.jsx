import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Check, 
  Printer, 
  Share2, 
  Download, 
  X, 
  QrCode, 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  UserPlus, 
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { initialProducts, initialFarmers } from '../data/mockData';
import billingService from '../services/billingService';
import productService from '../services/productService';
import farmerService from '../services/farmerService';
import { useShop } from '../context/ShopContext';


export const Billing = () => {
  const { shopLogo, shopProfile } = useShop();
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  const [farmersList, setFarmersList] = useState(initialFarmers);
  const [selectedFarmerId, setSelectedFarmerId] = useState(initialFarmers[0]?.id || 1);
  const [farmerSearch, setFarmerSearch] = useState('');
  
  // Products & Stock State
  const [productsList, setProductsList] = useState(initialProducts);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Billing Cart State (Default to empty array to prevent stale mock IDs)
  const [cart, setCart] = useState([]);

  // Load Live Supabase Products & Farmers on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadLiveBillingData() {
      try {
        const [prods, frms] = await Promise.all([
          productService.getProducts(),
          farmerService.getFarmers()
        ]);
        if (isMounted) {
          if (prods && prods.length > 0) {
            const mappedProds = prods.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category || 'General',
              sellingPrice: Number(p.selling_price) || 0,
              stock: Number(p.current_stock) || 0,
              unit: p.unit || 'Kg',
              gst: Number(p.gst_rate) || 5,
              hsn: p.hsn_code || '3808',
              batch: `BT-${p.id}`
            }));
            setProductsList(mappedProds);

            // Filter out any stale cart items not matching live products
            setCart(prevCart => {
              if (!prevCart || prevCart.length === 0) return [];
              const validCart = prevCart.filter(item => mappedProds.some(lp => String(lp.id) === String(item.id)));
              if (validCart.length < prevCart.length) {
                setErrorMessage('This product is no longer available and was removed from the cart.');
              }
              return validCart;
            });
          }
          if (frms && frms.length > 0) {
            setFarmersList(frms);
            setSelectedFarmerId(frms[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed loading live Supabase products/farmers:', err.message);
      }
    }
    loadLiveBillingData();
    return () => { isMounted = false; };
  }, []);

  // Overall Discount & Payment State
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, UPI, Card, Credit, Split
  const [cashReceived, setCashReceived] = useState(4000);
  const [upiRef, setUpiRef] = useState('UPI-9821804192');
  const [cardRef, setCardRef] = useState('TXN-CARD-4412');
  const [paidAmount, setPaidAmount] = useState(2000);
  const [dueDate, setDueDate] = useState('2026-10-15');

  // Split Payment Amounts
  const [splitCash, setSplitCash] = useState(1000);
  const [splitUpi, setSplitUpi] = useState(1000);
  const [splitCredit, setSplitCredit] = useState(1654);

  // Modals & UI States
  const [showAddFarmerModal, setShowAddFarmerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrintInvoiceView, setShowPrintInvoiceView] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Farmer Modal State
  const [newFarmer, setNewFarmer] = useState({ name: '', mobile: '', village: '', crop: 'Wheat & Sugarcane' });

  // Current Selected Farmer Object
  const currentFarmer = farmersList.find(f => f.id === selectedFarmerId) || farmersList[0];

  // ------------------------------------------------------------------
  // CART ACTIONS & CALCULATIONS
  // ------------------------------------------------------------------
  const handleAddToCart = (product) => {
    setErrorMessage('');
    if (product.stock <= 0) {
      setErrorMessage(`Sorry, ${product.name} is currently Out of Stock!`);
      return;
    }

    const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].qty + 1 > product.stock) {
        setErrorMessage(`Cannot exceed available stock of ${product.stock} ${product.unit} for ${product.name}`);
        return;
      }
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          batch: product.batch || `BT-${product.id}`,
          qty: 1,
          unit: product.unit || 'Bag',
          rate: product.sellingPrice,
          gst: product.gst,
          discount: 0,
          stock: product.stock,
          hsn: product.hsn || '3808'
        }
      ]);
    }
  };

  const updateCartQty = (id, newQty) => {
    setErrorMessage('');
    const targetItem = cart.find(item => String(item.id) === String(id));
    if (!targetItem) return;

    const parsedQty = Math.max(1, Number(newQty));
    if (parsedQty > targetItem.stock) {
      setErrorMessage(`Cannot set quantity higher than available stock (${targetItem.stock}) for ${targetItem.name}`);
      return;
    }

    setCart(cart.map(item => String(item.id) === String(id) ? { ...item, qty: parsedQty } : item));
  };

  const updateCartDiscount = (id, newDiscount) => {
    setCart(cart.map(item => String(item.id) === String(id) ? { ...item, discount: Math.max(0, Number(newDiscount)) } : item));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => String(item.id) !== String(id)));
  };

  const handleResetBill = () => {
    setCart([]);
    setOverallDiscount(0);
    setPaymentMethod('Cash');
    setPaidAmount(0);
    setCashReceived(0);
    setErrorMessage('');
  };

  // ------------------------------------------------------------------
  // SUMMARY CALCULATIONS
  // ------------------------------------------------------------------
  const calculateItemAmount = (item) => {
    const base = (item.qty * item.rate) - item.discount;
    const gstVal = (base * item.gst) / 100;
    return base + gstVal;
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = itemDiscounts + Number(overallDiscount);
  const taxableAmount = Math.max(0, rawSubtotal - totalDiscount);
  
  const totalGst = cart.reduce((sum, item) => {
    const itemNet = (item.qty * item.rate) - item.discount;
    return sum + ((itemNet * item.gst) / 100);
  }, 0);

  const grandTotal = Math.round(taxableAmount + totalGst);

  // Return & Credit amounts
  const returnAmount = paymentMethod === 'Cash' ? Math.max(0, cashReceived - grandTotal) : 0;
  
  const effectivePaid = paymentMethod === 'Cash' 
    ? Math.min(cashReceived, grandTotal) 
    : paymentMethod === 'Credit' 
    ? Number(paidAmount) 
    : paymentMethod === 'Split'
    ? (Number(splitCash) + Number(splitUpi))
    : grandTotal;

  const pendingCreditAmount = Math.max(0, grandTotal - effectivePaid);

  // ------------------------------------------------------------------
  // INVOICE GENERATION & VALIDATIONS
  // ------------------------------------------------------------------
  const handleGenerateInvoice = async () => {
    setErrorMessage('');
    if (submitting) return;

    // Validations
    if (cart.length === 0) {
      setErrorMessage('Cannot generate bill: Cart is empty! Add at least 1 product.');
      return;
    }

    for (let item of cart) {
      if (!item.id || item.qty <= 0) {
        setErrorMessage(`Invalid details in cart for product ${item.name || ''}.`);
        return;
      }
      const liveProd = productsList.find(p => String(p.id) === String(item.id));
      if (!liveProd) {
        setErrorMessage(`Cannot generate bill: Product '${item.name}' (ID ${item.id}) no longer exists in live inventory.`);
        return;
      }
      if (item.qty > item.stock) {
        setErrorMessage(`Insufficient stock for ${item.name}. Available: ${item.stock}`);
        return;
      }
    }

    if (!currentFarmer) {
      setErrorMessage('Please select a valid customer / farmer before generating invoice.');
      return;
    }

    if ((paymentMethod === 'Credit' || paymentMethod === 'Split') && pendingCreditAmount > 0 && !dueDate) {
      setErrorMessage('Due Date is required for credit sales!');
      return;
    }

    if (paymentMethod === 'Split') {
      const sumSplit = Number(splitCash) + Number(splitUpi) + Number(splitCredit);
      if (sumSplit !== grandTotal) {
        setErrorMessage(`Split Payment sum (₹${sumSplit}) must equal Grand Total (₹${grandTotal})!`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // Build RPC payload for create_agromart_bill with exact numeric product IDs
      const payload = {
        farmer_id: currentFarmer.id && !isNaN(Number(currentFarmer.id)) ? Number(currentFarmer.id) : null,
        farmer_name: currentFarmer.name || 'Walk-in Customer',
        farmer_mobile: currentFarmer.mobile || null,
        discount_amount: Number(overallDiscount || 0),
        paid_amount: Number(effectivePaid || 0),
        cash_amount: paymentMethod === 'Cash' ? Number(effectivePaid || 0) : paymentMethod === 'Split' ? Number(splitCash || 0) : 0,
        upi_amount: paymentMethod === 'UPI' ? Number(effectivePaid || 0) : paymentMethod === 'Split' ? Number(splitUpi || 0) : 0,
        payment_method: paymentMethod.toUpperCase(),
        due_date: pendingCreditAmount > 0 ? (dueDate ? new Date(dueDate).toISOString() : null) : null,
        notes: `Billing POS Invoice for ${currentFarmer.name}`,
        items: cart.map(item => ({
          product_id: Number(item.id),
          quantity: Number(item.qty),
          discount_amount: Number(item.discount || 0)
        }))
      };

      const billResult = await billingService.createBill(payload);

      // 1. Reduce local inventory stock
      const updatedProducts = productsList.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.qty);
          return {
            ...p,
            stock: newStock,
            status: newStock > 20 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock'
          };
        }
        return p;
      });
      setProductsList(updatedProducts);

      // 2. Update local farmer credit & purchases
      const updatedFarmers = farmersList.map(f => {
        if (f.id === currentFarmer.id) {
          return {
            ...f,
            pendingCredit: f.pendingCredit + pendingCreditAmount,
            lastPurchase: new Date().toISOString().split('T')[0]
          };
        }
        return f;
      });
      setFarmersList(updatedFarmers);

      const returnedInvoiceNo = billResult?.invoice_number || `AGM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const invoiceObj = {
        invoiceNo: returnedInvoiceNo,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        farmer: currentFarmer,
        items: [...cart],
        rawSubtotal,
        totalDiscount,
        taxableAmount,
        totalGst,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        grandTotal: billResult?.grand_total || grandTotal,
        paidAmount: billResult?.paid_amount !== undefined ? billResult.paid_amount : effectivePaid,
        pendingAmount: billResult?.pending_amount !== undefined ? billResult.pending_amount : pendingCreditAmount,
        paymentMethod,
        dueDate: pendingCreditAmount > 0 ? dueDate : 'N/A'
      };

      setGeneratedInvoice(invoiceObj);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error generating bill in Billing.jsx:', err);
      setErrorMessage(err.message || 'Failed to generate invoice via Supabase.');
    } finally {
      setSubmitting(false);
    }
  };


  // Add New Farmer Inline
  const handleAddNewFarmerSubmit = (e) => {
    e.preventDefault();
    const created = {
      id: `F00${farmersList.length + 1}`,
      name: newFarmer.name,
      mobile: newFarmer.mobile,
      village: newFarmer.village,
      crop: newFarmer.crop,
      totalPurchases: '₹0',
      pendingCredit: 0,
      lastPurchase: 'Just Now'
    };
    setFarmersList([created, ...farmersList]);
    setSelectedFarmerId(created.id);
    setShowAddFarmerModal(false);
    setNewFarmer({ name: '', mobile: '', village: '', crop: 'Wheat & Sugarcane' });
  };

  // Filter products catalog
  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // ------------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------------
  return (
    <div className="space-y-4 pb-6 font-sans select-none">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">Billing & POS</h1>
            <p className="text-xs text-gray-500 font-medium">
              Create GST invoices, manage payments and update stock automatically
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetBill}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Cart</span>
          </button>
          <button
            onClick={handleResetBill}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#15803D] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}><X className="w-4 h-4 text-rose-500" /></button>
        </div>
      )}

      {/* MAIN POS 2-COLUMN LAYOUT (70% BILLING AREA | 30% SUMMARY & PAYMENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: 8/12 (70%) - FARMER SELECTION + PRODUCT CATALOG + BILL TABLE */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. FARMER / CUSTOMER SELECTION CARD */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#15803D]" />
                <h3 className="font-extrabold text-xs text-[#064E3B] font-['Outfit'] uppercase tracking-wider">
                  Customer / Farmer Details
                </h3>
              </div>
              <button
                onClick={() => setShowAddFarmerModal(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Farmer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* FARMER DROPDOWN */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-600">Select Registered Farmer</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full p-2 text-xs font-bold text-[#064E3B] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
                >
                  {farmersList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.village})</option>
                  ))}
                </select>
              </div>

              {/* FARMER SUMMARY STAT BADGES */}
              <div className="sm:col-span-2 grid grid-cols-3 gap-2 text-xs font-medium">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200/80 space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Mobile & Village</span>
                  <span className="font-bold text-[#064E3B] truncate block">{currentFarmer.mobile}</span>
                  <span className="text-[10px] text-gray-500 truncate block">{currentFarmer.village}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Previous Purchases</span>
                  <span className="font-extrabold text-emerald-900 text-sm block">{currentFarmer.totalPurchases}</span>
                  <span className="text-[10px] text-emerald-700 block">Lifetime Orders</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">Pending Credit</span>
                  <span className="font-extrabold text-amber-900 text-sm block">₹{currentFarmer.pendingCredit.toLocaleString()}</span>
                  <span className="text-[10px] text-amber-700 block">Digital Khata</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PRODUCT SEARCH & CATEGORY FILTER */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search product by name, category, brand or barcode..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#22C55E]"
                />
              </div>

              {/* CATEGORY FILTER PILLS */}
              <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                {['All', 'Fertilizers', 'Seeds', 'Pesticides', 'Fungicides', 'Tools'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT SUGGESTION CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddToCart(prod)}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-300 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="font-bold text-[11px] text-[#064E3B] line-clamp-1">{prod.name}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">{prod.category} &bull; GST {prod.gst}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200/60">
                    <span className="font-extrabold text-xs text-[#15803D]">₹{prod.sellingPrice}</span>
                    <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                      prod.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {prod.stock} {prod.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BILL ITEMS EDITABLE TABLE */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-xs text-[#064E3B] font-['Outfit'] uppercase tracking-wider">
                Bill Items ({cart.length})
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">Editable Quantities & Discounts</span>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500 font-medium">Cart is currently empty. Click any product above to add items.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[9px]">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Batch</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">GST</th>
                      <th className="pb-2 text-right">Discount</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item, idx) => {
                      const itemAmount = calculateItemAmount(item);
                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/30">
                          <td className="py-2.5 font-bold text-gray-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-[#064E3B]">
                            <div>{item.name}</div>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-gray-500">{item.batch}</td>
                          
                          {/* QTY INCREMENT / DECREMENT */}
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center border rounded-lg bg-gray-50">
                              <button 
                                onClick={() => updateCartQty(item.id, item.qty - 1)}
                                className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-200 rounded-l"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.stock}
                                value={item.qty}
                                onChange={(e) => updateCartQty(item.id, e.target.value)}
                                className="w-8 text-center text-xs font-bold bg-transparent outline-none"
                              />
                              <button 
                                onClick={() => updateCartQty(item.id, item.qty + 1)}
                                className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-200 rounded-r"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 text-right font-medium">₹{item.rate}</td>
                          <td className="py-2.5 text-right text-gray-500">{item.gst}%</td>
                          
                          {/* DISCOUNT INPUT */}
                          <td className="py-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateCartDiscount(item.id, e.target.value)}
                              className="w-12 text-right text-xs p-1 border rounded bg-gray-50 outline-none"
                            />
                          </td>

                          <td className="py-2.5 text-right font-extrabold text-[#15803D]">
                            ₹{Math.round(itemAmount).toLocaleString()}
                          </td>

                          <td className="py-2.5 text-center">
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: 4/12 (30%) - BILL SUMMARY & PAYMENT DETAILS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 4. BILL SUMMARY CARD */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-[#064E3B] font-['Outfit'] uppercase tracking-wider border-b pb-2">
              Bill Financial Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Gross)</span>
                <span className="font-bold text-gray-800">₹{rawSubtotal.toLocaleString()}</span>
              </div>

              {/* OVERALL DISCOUNT FIELD */}
              <div className="flex justify-between items-center text-gray-600">
                <span>Overall Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-20 p-1 text-right text-xs font-bold border rounded-lg bg-gray-50 outline-none"
                />
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount</span>
                <span className="font-bold text-gray-800">₹{taxableAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>GST (CGST 2.5% + SGST 2.5%)</span>
                <span className="font-bold text-gray-800">₹{Math.round(totalGst).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Round Off</span>
                <span>₹0</span>
              </div>

              {/* GRAND TOTAL HIGHLIGHT */}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-base font-extrabold text-[#064E3B]">
                <span>Grand Total</span>
                <span className="text-xl font-['Outfit'] text-[#15803D]">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 5. PAYMENT SECTION */}
          <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-[#064E3B] font-['Outfit'] uppercase tracking-wider border-b pb-2">
              Payment Details
            </h3>

            {/* PAYMENT METHOD SELECTOR CARDS */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              {[
                { id: 'Cash', label: 'Cash', icon: DollarSign },
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Card', label: 'Card', icon: CreditCard },
                { id: 'Credit', label: 'Credit (Udhar)', icon: Receipt },
                { id: 'Split', label: 'Split', icon: RefreshCw },
              ].map(method => {
                const IconComp = method.icon;
                const isSel = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSel
                        ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="font-bold text-[10px]">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CONDITIONAL PAYMENT DETAILS */}
            <div className="pt-2 text-xs space-y-2">
              {/* CASH */}
              {paymentMethod === 'Cash' && (
                <div className="p-3 rounded-xl bg-gray-50 border space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700">Amount Received (₹)</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="w-24 p-1 text-right font-bold text-xs border rounded bg-white"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t">
                    <span className="text-gray-600">Return Change:</span>
                    <span className="text-emerald-700 text-sm">₹{returnAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* UPI */}
              {paymentMethod === 'UPI' && (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-center">
                  <div className="w-20 h-20 mx-auto bg-white p-2 rounded-xl border flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#064E3B]" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 block">Scan to Pay via PhonePe / GPay / Paytm</span>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="w-full p-1.5 text-xs text-center border rounded bg-white font-mono"
                    placeholder="Transaction Reference"
                  />
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded inline-block">UPI Verified</span>
                </div>
              )}

              {/* CREDIT / UDHAR */}
              {paymentMethod === 'Credit' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-900">Total Bill:</span>
                    <span className="font-extrabold text-amber-900">₹{grandTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-xs text-amber-900">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-24 p-1 text-right font-bold text-xs border rounded bg-white"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-amber-200">
                    <span className="font-bold text-amber-900">Pending Credit:</span>
                    <span className="font-extrabold text-rose-600">₹{pendingCreditAmount}</span>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-amber-900">Credit Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-1.5 text-xs border rounded bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              {/* SPLIT PAYMENT */}
              {paymentMethod === 'Split' && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-900 uppercase block">Split Amounts (Must equal ₹{grandTotal})</span>
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 block">Cash (₹)</span>
                      <input type="number" value={splitCash} onChange={e => setSplitCash(Number(e.target.value))} className="w-full p-1 text-xs border rounded bg-white text-center font-bold" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 block">UPI (₹)</span>
                      <input type="number" value={splitUpi} onChange={e => setSplitUpi(Number(e.target.value))} className="w-full p-1 text-xs border rounded bg-white text-center font-bold" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 block">Credit (₹)</span>
                      <input type="number" value={splitCredit} onChange={e => setSplitCredit(Number(e.target.value))} className="w-full p-1 text-xs border rounded bg-white text-center font-bold" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. BILL ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGenerateInvoice}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#064E3B] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#15803D] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Receipt className="w-4 h-4" />
                <span>{submitting ? 'Generating Invoice...' : 'Generate Invoice'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => alert("Bill placed on Hold!")}
                  className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Hold Bill
                </button>
                <button
                  onClick={() => alert("Draft Bill Saved!")}
                  className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Save Draft
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. SUCCESS MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showSuccessModal && generatedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="text-center space-y-2 border-b pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">
                Bill Generated Successfully!
              </h2>
              <p className="text-xs text-gray-500">Invoice: <strong className="text-gray-800">{generatedInvoice.invoiceNo}</strong></p>
            </div>

            {/* INVOICE BREAKDOWN */}
            <div className="p-3 rounded-xl bg-gray-50 border space-y-1.5 font-medium">
              <div className="flex justify-between"><span>Farmer:</span><span className="font-bold text-[#064E3B]">{generatedInvoice.farmer.name}</span></div>
              <div className="flex justify-between"><span>Total Amount:</span><span className="font-extrabold text-[#15803D]">₹{generatedInvoice.grandTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Payment Mode:</span><span className="font-bold">{generatedInvoice.paymentMethod}</span></div>
              <div className="flex justify-between"><span>Paid Amount:</span><span className="font-bold text-emerald-700">₹{generatedInvoice.paidAmount.toLocaleString()}</span></div>
              {generatedInvoice.pendingAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold border-t pt-1"><span>Pending Credit (Khata):</span><span>₹{generatedInvoice.pendingAmount.toLocaleString()}</span></div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => { setShowSuccessModal(false); setShowPrintInvoiceView(true); }}
                className="py-2.5 rounded-xl bg-[#064E3B] text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => alert(`Invoice PDF generated for ${generatedInvoice.invoiceNo}`)}
                className="py-2.5 rounded-xl bg-emerald-100 text-[#064E3B] font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => alert(`WhatsApp Invoice link sent to ${generatedInvoice.farmer.mobile}`)}
                className="py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => { setShowSuccessModal(false); handleResetBill(); }}
                className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold"
              >
                + New Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. OFFICIAL PRINTABLE GST INVOICE VIEW */}
      {/* ------------------------------------------------------------------ */}
      {showPrintInvoiceView && generatedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-gray-200 shadow-2xl space-y-6 font-sans text-xs my-8">
            
            {/* INVOICE HEADER */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center gap-3.5">
                {shopLogo ? (
                  <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-contain" />
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  <h2 className="text-xl font-extrabold text-[#064E3B] font-['Outfit']">{shopProfile?.shop_name || 'Smart AgroMart'}</h2>
                  <p className="text-[11px] text-gray-600 font-medium">{shopProfile?.business_type || 'Agricultural Shop & Krushi Seva Kendra'}</p>
                  <p className="text-[10px] text-gray-500">{shopProfile?.address || 'Main Market Road, APMC Yard'}, {shopProfile?.city || 'Nashik'} - {shopProfile?.pincode || '422001'}</p>
                  <p className="text-[10px] text-gray-500 font-mono">GSTIN: {shopProfile?.gstin || '27AAAAA0000A1Z5'} | Mob: +91 {shopProfile?.mobile || '9876543210'}</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[#DCFCE7] text-[#064E3B] rounded-full border border-[#15803D]">
                  TAX INVOICE
                </span>
                <p className="text-xs font-bold text-gray-800 mt-2">Invoice: {generatedInvoice.invoiceNo}</p>
                <p className="text-[11px] text-gray-500">Date: {generatedInvoice.date}</p>
              </div>
            </div>

            {/* FARMER / BILL TO DETAILS */}
            <div className="p-3 rounded-xl bg-gray-50 border flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Billed To (Farmer):</span>
                <span className="font-extrabold text-[#064E3B] text-sm block">{generatedInvoice.farmer.name}</span>
                <span className="text-gray-600">{generatedInvoice.farmer.village} &bull; {generatedInvoice.farmer.mobile}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Primary Crop</span>
                <span className="font-bold text-emerald-800">{generatedInvoice.farmer.crop}</span>
              </div>
            </div>

            {/* PRODUCTS HSN TABLE */}
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500 uppercase text-[9px] font-bold">
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2">HSN</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Rate</th>
                  <th className="pb-2 text-right">GST</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {generatedInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-bold text-gray-800">{item.name}</td>
                    <td className="py-2 font-mono text-gray-500">{item.hsn}</td>
                    <td className="py-2 text-center font-bold">{item.qty} {item.unit}</td>
                    <td className="py-2 text-right">₹{item.rate}</td>
                    <td className="py-2 text-right text-gray-500">{item.gst}%</td>
                    <td className="py-2 text-right font-extrabold text-[#064E3B]">₹{(item.qty * item.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* FINANCIAL SUMMARY BREAKDOWN */}
            <div className="border-t pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600"><span>Taxable Value:</span><span>₹{generatedInvoice.taxableAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>CGST (2.5%):</span><span>₹{Math.round(generatedInvoice.cgst).toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST (2.5%):</span><span>₹{Math.round(generatedInvoice.sgst).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-extrabold text-[#064E3B] border-t pt-1"><span>Grand Total:</span><span>₹{generatedInvoice.grandTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-700 font-bold"><span>Paid ({generatedInvoice.paymentMethod}):</span><span>₹{generatedInvoice.paidAmount.toLocaleString()}</span></div>
                {generatedInvoice.pendingAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold"><span>Pending Credit (Due: {generatedInvoice.dueDate}):</span><span>₹{generatedInvoice.pendingAmount.toLocaleString()}</span></div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t pt-4 text-center space-y-1 text-gray-500">
              <p className="font-bold text-[#064E3B] text-xs">Thank you for choosing Smart AgroMart</p>
              <p className="text-[10px] italic">Smart Shop &bull; Smarter Farming &bull; Stronger Farmers</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPrintInvoiceView(false)} className="flex-1 py-2.5 rounded-xl bg-gray-200 font-bold">Close Invoice</button>
              <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold">Print Invoice Now</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADD NEW FARMER INLINE MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showAddFarmerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Register Farmer Inline</h2>
              <button onClick={() => setShowAddFarmerModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleAddNewFarmerSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Farmer Full Name</label>
                <input required type="text" value={newFarmer.name} onChange={e => setNewFarmer({...newFarmer, name: e.target.value})} className="w-full p-2 border rounded-xl" placeholder="e.g. Rahul Jadhav" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mobile Number</label>
                <input required type="text" value={newFarmer.mobile} onChange={e => setNewFarmer({...newFarmer, mobile: e.target.value})} className="w-full p-2 border rounded-xl" placeholder="9876543210" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Village</label>
                  <input required type="text" value={newFarmer.village} onChange={e => setNewFarmer({...newFarmer, village: e.target.value})} className="w-full p-2 border rounded-xl" placeholder="Kopargaon" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Primary Crop</label>
                  <input type="text" value={newFarmer.crop} onChange={e => setNewFarmer({...newFarmer, crop: e.target.value})} className="w-full p-2 border rounded-xl" placeholder="Wheat & Sugarcane" />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowAddFarmerModal(false)} className="flex-1 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-[#064E3B] text-white font-bold">Save & Select Farmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
