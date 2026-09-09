import api from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const getBills = async (params = {}) => {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('bills').select('*, items:bill_items(*)').order('id', { ascending: false });
      if (params.farmer_id) {
        query = query.eq('farmer_id', params.farmer_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getBills failed, falling back to API:', err);
    }
  }

  try {
    return await api.get('/api/bills', { params });
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
};

export const getBill = async (billId) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*, items:bill_items(*)')
        .eq('id', billId)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getBill failed, falling back to API:', err);
    }
  }

  try {
    return await api.get(`/api/bills/${billId}`);
  } catch (error) {
    console.error(`Error fetching bill #${billId}:`, error);
    throw error;
  }
};

export const getBillByInvoice = async (invoiceNumber) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*, items:bill_items(*)')
        .eq('invoice_number', invoiceNumber)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getBillByInvoice failed, falling back to API:', err);
    }
  }

  try {
    return await api.get(`/api/bills/invoice/${invoiceNumber}`);
  } catch (error) {
    console.error(`Error fetching invoice #${invoiceNumber}:`, error);
    throw error;
  }
};

export const createBill = async (payload) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('create_agromart_bill', {
      p_farmer_id: payload.farmer_id || null,
      p_farmer_name: payload.farmer_name || 'Walk-in Customer',
      p_farmer_mobile: payload.farmer_mobile || null,
      p_discount_amount: payload.discount_amount || 0,
      p_paid_amount: payload.paid_amount || 0,
      p_cash_amount: payload.cash_amount || 0,
      p_upi_amount: payload.upi_amount || 0,
      p_payment_method: payload.payment_method || 'CASH',
      p_due_date: payload.due_date || null,
      p_notes: payload.notes || '',
      p_items: payload.items
    });
    if (error) throw error;

    if (data && data.id) {
      return await getBill(data.id);
    }
    return data;
  }

  try {
    return await api.post('/api/bills', payload);
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
};

export default {
  getBills,
  getBill,
  getBillByInvoice,
  createBill,
};
