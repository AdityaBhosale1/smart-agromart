import api from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialMasterFarmers = [
  { id: 'FMR-2026-0156', code: 'FMR-2026-0156', name: 'Rahul Jadhav', mobile: '9876543210', village: 'Solapur', district: 'Solapur', primary_crop: 'Wheat', credit_limit: 50000, pending_credit: 12400, total_purchases: '₹18,450', status: 'Active' }
];

export const initialFarmerPurchases = [
  { id: 'P-901', farmer_id: 'FMR-2026-0156', date: '2026-09-08', invoice: 'AGM-2026-00048', products: 'DAP Fertilizer 50kg', total: 3654, paid: 2000, credit: 1654, payment_method: 'Cash + Credit', status: 'Partially Paid' }
];

export const initialCreditLedger = [
  { id: 'LEDGER-1', farmer_id: 'FMR-2026-0156', date: '2026-09-08', transaction: 'Credit Sale', reference: 'AGM-2026-00048', debit: 1654, credit: 0, balance: 1850, due_date: '2026-09-20', status: 'Pending' }
];

export const getFarmerCreditStatus = (pendingCredit, dueDate) => {
  if (pendingCredit <= 0) return 'No Credit';
  if (dueDate && dueDate !== 'N/A') {
    const due = new Date(dueDate);
    const today = new Date();
    if (due < today) return 'Overdue';
  }
  return 'Pending';
};

export const mapBackendFarmer = (f) => {
  if (!f) return null;
  const pendingCredit = f.pending_credit || 0;
  const creditLimit = f.credit_limit || 50000;

  return {
    id: f.id,
    code: f.farmer_code || `FMR-2026-${f.id.toString().padStart(4, '0')}`,
    name: f.name,
    mobile: f.mobile,
    alt_mobile: f.alternate_mobile || f.mobile,
    village: f.village || 'N/A',
    taluka: f.taluka || f.district || 'N/A',
    district: f.district || 'Solapur',
    state: f.state || 'Maharashtra',
    pincode: f.pincode || '413001',
    primary_crop: f.primary_crop || 'General',
    other_crops: f.other_crops || 'Wheat',
    land_area: f.land_acreage || f.land_area || 0,
    land_unit: f.land_unit || 'Acre',
    irrigation_type: f.irrigation_type || 'Well',
    season: f.season || 'Kharif',
    preferred_payment: f.preferred_payment || 'Cash',
    credit_limit: creditLimit,
    pending_credit: pendingCredit,
    total_purchases: f.total_purchases ? (typeof f.total_purchases === 'number' ? `₹${f.total_purchases}` : f.total_purchases) : '₹0',
    total_bills: f.total_bills || 0,
    last_purchase: f.last_purchase || (f.created_at ? f.created_at.split('T')[0] : 'N/A'),
    status: f.status || 'Active',
    credit_status: getFarmerCreditStatus(pendingCredit, f.due_date),
    due_date: f.due_date || 'N/A',
    notes: f.notes || ''
  };
};

export const farmerService = {
  async getFarmers(params = {}) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('farmers').select('*');
        if (params.search) {
          query = query.or(`name.ilike.%${params.search}%,mobile.ilike.%${params.search}%,farmer_code.ilike.%${params.search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapBackendFarmer);
      } catch (err) {
        console.error('Supabase getFarmers error:', err);
        throw err;
      }
    }

    const data = await api.get('/api/farmers', { params });
    if (Array.isArray(data)) {
      return data.map(mapBackendFarmer);
    }
    return [];
  },

  async getFarmer(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('farmers').select('*').eq('id', id).single();
        if (error) throw error;
        return mapBackendFarmer(data);
      } catch (err) {
        console.error('Supabase getFarmer error:', err);
        throw err;
      }
    }

    const data = await api.get(`/api/farmers/${id}`);
    return mapBackendFarmer(data);
  },

  async createFarmer(farmerData) {
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          farmer_code: `FMR-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
          name: farmerData.name,
          mobile: farmerData.mobile,
          village: farmerData.village,
          district: farmerData.district || farmerData.taluka || 'Solapur',
          land_acreage: Number(farmerData.land_area) || 0.0,
          primary_crop: farmerData.primary_crop,
          credit_limit: Number(farmerData.credit_limit) || 50000.0,
          pending_credit: Number(farmerData.pending_credit) || 0.0,
          status: farmerData.status || 'Active'
        };
        const { data, error } = await supabase.from('farmers').insert([payload]).select().single();
        if (error) throw error;
        return mapBackendFarmer(data);
      } catch (err) {
        if (err?.code === '23505' || err?.message?.includes('mobile')) {
          const errPayload = { response: { status: 409, data: { detail: 'A farmer with this mobile number already exists.' } } };
          throw errPayload;
        }
        console.error('Supabase createFarmer error:', err);
        throw err;
      }
    }

    const payload = {
      name: farmerData.name,
      mobile: farmerData.mobile,
      village: farmerData.village,
      district: farmerData.district || farmerData.taluka || 'Solapur',
      land_acreage: Number(farmerData.land_area) || 0.0,
      primary_crop: farmerData.primary_crop,
      credit_limit: Number(farmerData.credit_limit) || 50000.0,
      pending_credit: Number(farmerData.pending_credit) || 0.0,
      status: farmerData.status || 'Active'
    };
    const created = await api.post('/api/farmers', payload);
    return mapBackendFarmer(created);
  },

  async updateFarmer(id, farmerData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('farmers').update({
          name: farmerData.name,
          mobile: farmerData.mobile,
          village: farmerData.village,
          district: farmerData.district || farmerData.taluka,
          land_acreage: farmerData.land_area !== undefined ? Number(farmerData.land_area) : undefined,
          primary_crop: farmerData.primary_crop,
          credit_limit: farmerData.credit_limit !== undefined ? Number(farmerData.credit_limit) : undefined,
          status: farmerData.status
        }).eq('id', id).select().single();
        if (error) throw error;
        return mapBackendFarmer(data);
      } catch (err) {
        console.error('Supabase updateFarmer error:', err);
        throw err;
      }
    }

    const payload = {
      name: farmerData.name,
      mobile: farmerData.mobile,
      village: farmerData.village,
      district: farmerData.district || farmerData.taluka,
      land_acreage: farmerData.land_area !== undefined ? Number(farmerData.land_area) : undefined,
      primary_crop: farmerData.primary_crop,
      credit_limit: farmerData.credit_limit !== undefined ? Number(farmerData.credit_limit) : undefined,
      status: farmerData.status
    };
    const updated = await api.put(`/api/farmers/${id}`, payload);
    return mapBackendFarmer(updated);
  },

  async getPurchaseHistory(farmerId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('bills').select('*, items:bill_items(*)').eq('farmer_id', farmerId);
        if (error) throw error;
        return (data || []).map(b => ({
          id: b.id,
          farmer_id: b.farmer_id,
          date: b.created_at ? b.created_at.split('T')[0] : 'N/A',
          invoice: b.invoice_number,
          products: b.items ? b.items.map(i => i.product_name).join(', ') : 'Items',
          total: b.grand_total,
          paid: b.paid_amount,
          credit: b.pending_amount,
          payment_method: b.payment_method,
          status: b.payment_status
        }));
      } catch (err) {
        console.warn('Supabase getPurchaseHistory failed, falling back to API:', err);
      }
    }

    try {
      const data = await api.get('/api/billing/bills', { params: { farmer_id: farmerId } });
      if (Array.isArray(data)) {
        return data.map(b => ({
          id: b.id,
          farmer_id: b.farmer_id,
          date: b.created_at ? b.created_at.split('T')[0] : 'N/A',
          invoice: b.invoice_number,
          products: b.items ? b.items.map(i => i.product_name).join(', ') : 'Items',
          total: b.grand_total,
          paid: b.paid_amount,
          credit: b.pending_amount,
          payment_method: b.payment_method,
          status: b.payment_status
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async getCreditLedger(farmerId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('credit_transactions').select('*').eq('farmer_id', farmerId);
        if (error) throw error;
        return (data || []).map(t => ({
          id: t.id,
          farmer_id: t.farmer_id,
          date: t.created_at ? t.created_at.split('T')[0] : 'N/A',
          transaction: t.transaction_type === 'DEBIT' ? 'Credit Sale' : 'Payment Received',
          reference: t.notes || (t.bill_id ? `Bill #${t.bill_id}` : 'Repayment'),
          debit: t.transaction_type === 'DEBIT' ? t.amount : 0,
          credit: t.transaction_type === 'CREDIT' ? t.amount : 0,
          balance: t.balance_after,
          due_date: 'N/A',
          status: t.transaction_type === 'DEBIT' ? 'Pending' : 'Received'
        }));
      } catch (err) {
        console.warn('Supabase getCreditLedger failed, falling back to API:', err);
      }
    }

    try {
      const data = await api.get('/api/credit/ledger', { params: { farmer_id: farmerId } });
      if (Array.isArray(data)) {
        return data.map(t => ({
          id: t.id,
          farmer_id: t.farmer_id,
          date: t.created_at ? t.created_at.split('T')[0] : 'N/A',
          transaction: t.transaction_type === 'DEBIT' ? 'Credit Sale' : 'Payment Received',
          reference: t.notes || (t.bill_id ? `Bill #${t.bill_id}` : 'Repayment'),
          debit: t.transaction_type === 'DEBIT' ? t.amount : 0,
          credit: t.transaction_type === 'CREDIT' ? t.amount : 0,
          balance: t.balance_after,
          due_date: 'N/A',
          status: t.transaction_type === 'DEBIT' ? 'Pending' : 'Received'
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async recordPayment(farmerId, paymentData) {
    const payload = {
      farmer_id: Number(farmerId),
      amount: Number(paymentData.amount),
      payment_type: 'FARMER_CREDIT_REPAYMENT',
      payment_method: paymentData.payment_method || 'Cash',
      notes: paymentData.notes || 'Credit repayment'
    };
    return await api.post('/api/payments/repayment', payload);
  }
};

export default farmerService;
