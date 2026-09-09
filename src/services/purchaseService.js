import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialMasterPurchases = [
  {
    id: 'PUR-2026-0056',
    purchase_number: 'PUR-2026-0056',
    purchase_date: '2026-09-08',
    supplier_id: '1',
    supplier_name: 'ABC Agro Distributors',
    supplier_invoice_number: 'INV-AG-2048',
    supplier_invoice_date: '2026-09-08',
    payment_due_date: '2026-09-22',
    reference_number: 'REF-8812',
    products_summary: 'DAP Fertilizer 50kg, Urea Fertilizer 45kg',
    items_count: 2,
    items: [
      {
        id: 'PITEM-101',
        product_id: '1',
        product_name: 'DAP Fertilizer 50kg',
        batch_number: 'DAP-B210',
        manufacturing_date: '2026-02-10',
        expiry_date: '2027-03-20',
        quantity: 20,
        unit: 'Bags',
        purchase_rate: 1210,
        gst_rate: 5,
        discount: 0,
        taxable_amount: 24200,
        cgst_amount: 605,
        sgst_amount: 605,
        total_amount: 25410
      },
      {
        id: 'PITEM-102',
        product_id: '2',
        product_name: 'Urea Fertilizer 45kg',
        batch_number: 'UR-B305',
        manufacturing_date: '2026-02-20',
        expiry_date: '2026-12-20',
        quantity: 30,
        unit: 'Bags',
        purchase_rate: 700,
        gst_rate: 5,
        discount: 0,
        taxable_amount: 21000,
        cgst_amount: 525,
        sgst_amount: 525,
        total_amount: 22050
      }
    ],
    subtotal: 45200,
    item_discount: 0,
    taxable_amount: 45200,
    cgst: 1130,
    sgst: 1130,
    other_charges: 500,
    round_off: 0,
    grand_total: 47460,
    paid_amount: 47460,
    pending_amount: 0,
    payment_method: 'Bank Transfer',
    payment_status: 'Paid',
    status: 'Completed',
    notes: 'Standard stock inward for monsoon season.'
  },
  {
    id: 'PUR-2026-0055',
    purchase_number: 'PUR-2026-0055',
    purchase_date: '2026-09-07',
    supplier_id: '2',
    supplier_name: 'Krushi Seva Traders',
    supplier_invoice_number: 'KST-8912',
    supplier_invoice_date: '2026-09-06',
    payment_due_date: '2026-09-20',
    reference_number: 'PO-9912',
    products_summary: 'NPK 19:19:19 1kg',
    items_count: 1,
    items: [
      {
        id: 'PITEM-103',
        product_id: '3',
        product_name: 'NPK 19:19:19 1kg',
        batch_number: 'NPK-B99',
        manufacturing_date: '2026-02-01',
        expiry_date: '2027-11-20',
        quantity: 25,
        unit: 'Bags',
        purchase_rate: 1100,
        gst_rate: 5,
        discount: 0,
        taxable_amount: 27500,
        cgst_amount: 687.5,
        sgst_amount: 687.5,
        total_amount: 28875
      }
    ],
    subtotal: 27500,
    item_discount: 0,
    taxable_amount: 27500,
    cgst: 687.5,
    sgst: 687.5,
    other_charges: 0,
    round_off: -25,
    grand_total: 28750,
    paid_amount: 15000,
    pending_amount: 13750,
    payment_method: 'UPI',
    payment_status: 'Partially Paid',
    status: 'Completed',
    notes: 'Partial payment paid via GPay, rest on delivery confirmation.'
  },
  {
    id: 'PUR-2026-0054',
    purchase_number: 'PUR-2026-0054',
    purchase_date: '2026-09-05',
    supplier_id: '3',
    supplier_name: 'Mahyco Seeds Distributor',
    supplier_invoice_number: 'MSD-4551',
    supplier_invoice_date: '2026-09-05',
    payment_due_date: '2026-09-25',
    reference_number: 'ORD-3341',
    products_summary: 'Soybean Seeds JS-335 30kg',
    items_count: 1,
    items: [
      {
        id: 'PITEM-104',
        product_id: '5',
        product_name: 'Soybean Seeds JS-335 30kg',
        batch_number: 'SOY-B30',
        manufacturing_date: '2026-03-01',
        expiry_date: '2027-04-12',
        quantity: 20,
        unit: 'Bags',
        purchase_rate: 1714.29,
        gst_rate: 5,
        discount: 0,
        taxable_amount: 34285.71,
        cgst_amount: 857.14,
        sgst_amount: 857.14,
        total_amount: 36000
      }
    ],
    subtotal: 34285.71,
    item_discount: 0,
    taxable_amount: 34285.71,
    cgst: 857.14,
    sgst: 857.14,
    other_charges: 0,
    round_off: 0,
    grand_total: 36000,
    paid_amount: 0,
    pending_amount: 36000,
    payment_method: 'Credit / Pay Later',
    payment_status: 'Pending',
    status: 'Completed',
    notes: '20 days credit facility granted by Mahyco distributor.'
  }
];

export const initialPurchaseReturns = [
  {
    id: 'PRET-2026-0004',
    date: '2026-09-04',
    purchase_number: 'PUR-2026-0050',
    supplier_name: 'Agro Chemicals Pvt Ltd',
    product_name: 'Glyphosate 41% SL 1L',
    batch_number: 'GLY-B091',
    quantity_returned: 5,
    unit: 'Units',
    reason: 'Damaged Stock',
    refund_amount: 2250,
    status: 'Approved'
  }
];

export const mapBackendPurchase = (p) => {
  if (!p) return null;
  const items = (p.purchase_items || []).map((item, idx) => ({
    id: String(item.id || idx),
    product_id: String(item.product_id),
    product_name: item.products?.name || item.product_name || `Product #${item.product_id}`,
    batch_number: item.batches?.batch_number || item.batch_number || 'N/A',
    manufacturing_date: item.batches?.mfg_date || item.manufacturing_date || 'N/A',
    expiry_date: item.batches?.expiry_date || item.expiry_date || 'N/A',
    quantity: Number(item.quantity || 0),
    unit: item.unit || 'Units',
    purchase_rate: Number(item.purchase_price || item.purchase_rate || 0),
    gst_rate: Number(item.gst_percent || item.gst_rate || 5),
    discount: Number(item.discount || 0),
    taxable_amount: Number(item.taxable_amount || 0),
    cgst_amount: Number(item.cgst_amount || (item.gst_amount ? item.gst_amount / 2 : 0)),
    sgst_amount: Number(item.sgst_amount || (item.gst_amount ? item.gst_amount / 2 : 0)),
    total_amount: Number(item.total_amount || 0)
  }));

  const productsSummaryStr = items.length > 0 
    ? items.map(i => i.product_name).join(', ')
    : (p.products_summary || 'Stock Inward');

  return {
    id: String(p.id),
    purchase_number: p.purchase_number || `PUR-${p.id}`,
    purchase_date: p.created_at ? p.created_at.split('T')[0] : (p.purchase_date || 'N/A'),
    supplier_id: String(p.supplier_id || ''),
    supplier_name: p.suppliers?.name || p.supplier_name || 'Unknown Supplier',
    supplier_invoice_number: p.supplier_invoice_number || `INV-${p.purchase_number || p.id}`,
    supplier_invoice_date: p.supplier_invoice_date || (p.created_at ? p.created_at.split('T')[0] : 'N/A'),
    payment_due_date: p.payment_due_date || 'N/A',
    reference_number: p.reference_number || 'N/A',
    products_summary: productsSummaryStr,
    items_count: items.length || p.items_count || 1,
    items: items,
    subtotal: Number(p.subtotal || 0),
    item_discount: Number(p.item_discount || 0),
    taxable_amount: Number(p.subtotal || 0),
    cgst: Number(p.cgst || (p.gst_amount ? p.gst_amount / 2 : 0)),
    sgst: Number(p.sgst || (p.gst_amount ? p.gst_amount / 2 : 0)),
    other_charges: Number(p.other_charges || 0),
    round_off: Number(p.round_off || 0),
    grand_total: Number(p.grand_total || 0),
    paid_amount: Number(p.paid_amount || 0),
    pending_amount: Number(p.pending_amount || 0),
    payment_method: p.payment_method || 'Cash',
    payment_status: p.payment_status || (p.pending_amount > 0 ? (p.paid_amount > 0 ? 'Partially Paid' : 'Pending') : 'Paid'),
    status: p.status || 'Completed',
    notes: p.notes || ''
  };
};

export const purchaseService = {
  async getPurchases() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('*, suppliers(name), purchase_items(*, products(name), batches(batch_number, mfg_date, expiry_date))')
          .order('id', { ascending: false });

        if (error) {
          // If relationship fails, fallback to simple select
          const { data: simpleData, error: simpleErr } = await supabase
            .from('purchases')
            .select('*')
            .order('id', { ascending: false });

          if (!simpleErr && simpleData && simpleData.length > 0) {
            return simpleData.map(mapBackendPurchase);
          }
        } else if (data && data.length > 0) {
          return data.map(mapBackendPurchase);
        }
      } catch (err) {
        console.warn('Supabase getPurchases error, falling back to initial mock data:', err);
      }
    }
    return initialMasterPurchases;
  },

  async getPurchaseById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('*, suppliers(name), purchase_items(*, products(name), batches(batch_number, mfg_date, expiry_date))')
          .eq('id', id)
          .single();

        if (!error && data) {
          return mapBackendPurchase(data);
        }
      } catch (err) {
        console.warn('Supabase getPurchaseById error:', err);
      }
    }
    return initialMasterPurchases.find(p => String(p.id) === String(id)) || null;
  },

  async createPurchase(purchaseData) {
    if (isSupabaseConfigured()) {
      const itemsPayload = purchaseData.items.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        purchase_price: Number(item.purchase_rate || item.purchase_price || 0),
        gst_percent: Number(item.gst_rate || item.gst_percent || 5),
        discount: Number(item.discount || 0),
        batch_number: item.batch_number || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
        manufacturing_date: item.manufacturing_date || null,
        expiry_date: item.expiry_date || null
      }));

      const rpcPayload = {
        p_supplier_id: purchaseData.supplier_id ? Number(purchaseData.supplier_id) : null,
        p_supplier_name: purchaseData.supplier_name || 'Supplier',
        p_supplier_mobile: purchaseData.supplier_mobile || '',
        p_discount_amount: Number(purchaseData.item_discount || 0),
        p_paid_amount: Number(purchaseData.paid_amount || 0),
        p_cash_amount: purchaseData.payment_method === 'Cash' ? Number(purchaseData.paid_amount || 0) : 0,
        p_upi_amount: purchaseData.payment_method === 'UPI' ? Number(purchaseData.paid_amount || 0) : 0,
        p_bank_amount: (purchaseData.payment_method === 'Bank Transfer' || purchaseData.payment_method === 'Card') ? Number(purchaseData.paid_amount || 0) : 0,
        p_payment_method: purchaseData.payment_method || 'Cash',
        p_notes: purchaseData.notes || 'Purchase Stock Inward',
        p_items: itemsPayload
      };

      const { data, error } = await supabase.rpc('create_agromart_purchase', rpcPayload);
      if (error) throw error;
      return data;
    }

    const newPurId = `PUR-2026-00${Date.now().toString().slice(-4)}`;
    return {
      id: newPurId,
      purchase_number: newPurId,
      grand_total: purchaseData.grand_total,
      paid_amount: purchaseData.paid_amount,
      pending_amount: Math.max(0, purchaseData.grand_total - purchaseData.paid_amount),
      payment_status: purchaseData.paid_amount >= purchaseData.grand_total ? 'Paid' : (purchaseData.paid_amount > 0 ? 'Partially Paid' : 'Pending')
    };
  }
};

export default purchaseService;

