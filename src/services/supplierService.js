import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialMasterSuppliers = [
  {
    id: '1',
    supplier_code: 'SUP-2026-0001',
    name: 'ABC Agro Distributors',
    contact_person: 'Vijay Shinde',
    mobile: '9876500011',
    alternate_mobile: '9876500012',
    email: 'vijay@abcagro.com',
    address: '14, Market Yard, Station Road',
    city: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    pincode: '422001',
    gstin: '27ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    bank_name: 'State Bank of India',
    account_number: '30981234567',
    ifsc: 'SBIN0001234',
    total_purchases: 245000,
    total_paid: 227040,
    current_payable: 17960,
    last_purchase_date: '2026-09-08',
    status: 'Active',
    notes: 'Primary supplier for fertilizers & soil conditioners.'
  },
  {
    id: '2',
    supplier_code: 'SUP-2026-0002',
    name: 'Krushi Seva Traders',
    contact_person: 'Ramesh Patil',
    mobile: '9822144332',
    alternate_mobile: '9822144333',
    email: 'sales@krushiseva.com',
    address: '88, APMC Yard, Gultekadi',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411037',
    gstin: '27KSTPV9812K1Z9',
    pan: 'KSTPV9812K',
    bank_name: 'HDFC Bank',
    account_number: '501002341122',
    ifsc: 'HDFC0000123',
    total_purchases: 185000,
    total_paid: 171250,
    current_payable: 13750,
    last_purchase_date: '2026-09-07',
    status: 'Active',
    notes: 'Specialist in micronutrients & soluble fertilizers.'
  },
  {
    id: '3',
    supplier_code: 'SUP-2026-0003',
    name: 'Mahyco Seeds Distributor',
    contact_person: 'Amit Deshmukh',
    mobile: '9923455667',
    alternate_mobile: '9923455668',
    email: 'deshmukh@mahycoseeds.org',
    address: 'Plot 45, MIDC Phase 2',
    city: 'Jalna',
    district: 'Jalna',
    state: 'Maharashtra',
    pincode: '431203',
    gstin: '27MSD99011X1Z2',
    pan: 'MSD99011X',
    bank_name: 'ICICI Bank',
    account_number: '001105009876',
    ifsc: 'ICIC0000011',
    total_purchases: 312000,
    total_paid: 275260,
    current_payable: 36740,
    last_purchase_date: '2026-09-05',
    status: 'Active',
    notes: 'Authorized breeder seeds & hybrid crop supplier.'
  },
  {
    id: '4',
    supplier_code: 'SUP-2026-0004',
    name: 'IFFCO Dealer',
    contact_person: 'Suresh Kulkarni',
    mobile: '9422311223',
    alternate_mobile: '9422311224',
    email: 'kulkarni@iffco.in',
    address: 'Cooperative Complex, Main Road',
    city: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    gstin: '27IFFCO1002M1Z4',
    pan: 'IFFCO1002M',
    bank_name: 'Bank of Baroda',
    account_number: '098110023456',
    ifsc: 'BARB0NAGPUR',
    total_purchases: 540000,
    total_paid: 540000,
    current_payable: 0,
    last_purchase_date: '2026-08-28',
    status: 'Active',
    notes: 'Direct cooperative depot for DAP & Urea.'
  },
  {
    id: '5',
    supplier_code: 'SUP-2026-0005',
    name: 'Agro Chemicals Pvt Ltd',
    contact_person: 'Rajesh Sharma',
    mobile: '9766544331',
    alternate_mobile: '9766544332',
    email: 'rajesh@agrochemicals.co.in',
    address: 'Building B, Industrial Estate',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pincode: '400072',
    gstin: '27AGROCHEM99Z1',
    pan: 'AGROC9999Z',
    bank_name: 'Axis Bank',
    account_number: '9180200112233',
    ifsc: 'UTIB0000088',
    total_purchases: 120000,
    total_paid: 120000,
    current_payable: 0,
    last_purchase_date: '2026-08-15',
    status: 'Active',
    notes: 'Pesticides, herbicides & crop protection chemicals.'
  }
];

export const initialSupplierPayments = [
  {
    id: 'SPAY-2026-0081',
    date: '2026-09-08 11:30 AM',
    supplier_id: '1',
    supplier_name: 'ABC Agro Distributors',
    purchase_id: 'PUR-2026-0056',
    amount: 52400,
    payment_method: 'Bank Transfer',
    reference: 'UTR90812374981',
    notes: 'Full payment for invoice INV-AG-2048'
  },
  {
    id: 'SPAY-2026-0078',
    date: '2026-09-07 02:15 PM',
    supplier_id: '2',
    supplier_name: 'Krushi Seva Traders',
    purchase_id: 'PUR-2026-0055',
    amount: 15000,
    payment_method: 'UPI',
    reference: 'UPI/9812739128',
    notes: 'Advance part payment for KST-8912'
  }
];

export const mapBackendSupplier = (s) => {
  if (!s) return null;
  const payable = Number(s.pending_payable !== undefined && s.pending_payable !== null ? s.pending_payable : (s.pending_payment || 0));
  return {
    id: String(s.id),
    supplier_code: s.supplier_code || `SUP-2026-${String(s.id).padStart(4, '0')}`,
    name: s.name,
    contact_person: s.contact_person || 'N/A',
    mobile: s.mobile,
    alternate_mobile: s.alternate_mobile || '',
    email: s.email || '',
    address: s.address || '',
    city: s.city || 'Nashik',
    district: s.district || 'Nashik',
    state: s.state || 'Maharashtra',
    pincode: s.pincode || '',
    gstin: s.gstin || 'UNREGISTERED',
    pan: s.pan || '',
    bank_name: s.bank_name || '',
    account_number: s.account_number || '',
    ifsc: s.ifsc || '',
    total_purchases: Number(s.total_purchases || 0),
    total_paid: Number(s.total_paid || 0),
    current_payable: payable,
    last_purchase_date: s.last_purchase_date || (s.created_at ? s.created_at.split('T')[0] : 'N/A'),
    status: s.status || 'Active',
    notes: s.notes || ''
  };
};

export const supplierService = {
  async getSuppliers() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) throw error;
        if (data && data.length > 0) {
          return data.map(mapBackendSupplier);
        }
      } catch (err) {
        console.warn('Supabase getSuppliers error, returning initial fallback:', err);
      }
    }
    return initialMasterSuppliers;
  },

  async getSupplierById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
        if (error) throw error;
        return mapBackendSupplier(data);
      } catch (err) {
        console.warn('Supabase getSupplierById error:', err);
      }
    }
    return initialMasterSuppliers.find(s => String(s.id) === String(id)) || null;
  },

  async addSupplier(supplierData) {
    if (isSupabaseConfigured()) {
      const payload = {
        name: supplierData.name,
        contact_person: supplierData.contact_person || '',
        mobile: supplierData.mobile,
        alternate_mobile: supplierData.alternate_mobile || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        city: supplierData.city || 'Nashik',
        district: supplierData.district || 'Nashik',
        state: supplierData.state || 'Maharashtra',
        pincode: supplierData.pincode || '',
        gstin: supplierData.gstin || 'UNREGISTERED',
        pan: supplierData.pan || '',
        bank_name: supplierData.bank_name || '',
        account_number: supplierData.account_number || '',
        ifsc: supplierData.ifsc || '',
        total_purchases: 0,
        total_paid: 0,
        pending_payable: 0,
        pending_payment: 0,
        status: supplierData.status || 'Active',
        notes: supplierData.notes || ''
      };

      const { data, error } = await supabase.from('suppliers').insert([payload]).select().single();
      if (error) throw error;
      return mapBackendSupplier(data);
    }

    const newCode = `SUP-2026-${Date.now().toString().slice(-4)}`;
    const newSup = {
      id: String(Date.now()),
      supplier_code: newCode,
      ...supplierData,
      total_purchases: 0,
      total_paid: 0,
      current_payable: 0,
      last_purchase_date: 'N/A',
      status: 'Active'
    };
    return newSup;
  },

  async updateSupplier(id, supplierData) {
    if (isSupabaseConfigured()) {
      const payload = {
        name: supplierData.name,
        contact_person: supplierData.contact_person,
        mobile: supplierData.mobile,
        alternate_mobile: supplierData.alternate_mobile,
        email: supplierData.email,
        address: supplierData.address,
        city: supplierData.city,
        district: supplierData.district,
        state: supplierData.state,
        pincode: supplierData.pincode,
        gstin: supplierData.gstin,
        pan: supplierData.pan,
        bank_name: supplierData.bank_name,
        account_number: supplierData.account_number,
        ifsc: supplierData.ifsc,
        notes: supplierData.notes,
        status: supplierData.status
      };

      const { data, error } = await supabase.from('suppliers').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return mapBackendSupplier(data);
    }
    return { id, ...supplierData };
  },

  async recordSupplierPayment(paymentData) {
    if (isSupabaseConfigured()) {
      const rpcPayload = {
        p_supplier_id: Number(paymentData.supplier_id),
        p_amount: Number(paymentData.amount),
        p_payment_method: paymentData.payment_method || 'Bank Transfer',
        p_notes: paymentData.notes || 'Supplier payable settlement'
      };

      const { data, error } = await supabase.rpc('record_supplier_payment', rpcPayload);
      if (error) throw error;
      return data;
    }

    return {
      supplier_id: paymentData.supplier_id,
      amount_paid: paymentData.amount,
      remaining_payable: 0
    };
  }
};

export default supplierService;

