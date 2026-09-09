import api from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialProductBatches = [
  { id: 'BATCH-101A', product_id: 'P101', product_name: 'DAP Fertilizer 50kg', batch_number: 'DAP-B102', current_quantity: 12, purchase_price: 1200, expiry_date: '2027-01-15', status: 'Safe' }
];

export const initialStockMovements = [
  { id: 'MOV-1001', date_time: '2026-09-08 10:15 AM', product_name: 'DAP Fertilizer 50kg', batch_number: 'DAP-B102', movement_type: 'Sale', reference: 'AGM-2026-00048', quantity_in: '-', quantity_out: 2, balance: 42, user: 'Admin' }
];

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate || expiryDate === 'N/A') return 'Safe';
  const exp = new Date(expiryDate);
  const today = new Date();
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  return 'Safe';
};

export const getFEFOBatch = (productId, batches) => {
  const validBatches = batches.filter(b => b.product_id === productId && b.current_quantity > 0 && getExpiryStatus(b.expiry_date) !== 'Expired');
  if (validBatches.length === 0) return null;

  return validBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))[0];
};

export const calculateReorderQuantity = (predictedDemand, currentStock, minStock) => {
  const safetyStock = minStock || 10;
  const reorder = predictedDemand + safetyStock - currentStock;
  return Math.max(0, reorder);
};

export const inventoryService = {
  async getBatches(productId = null) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('product_batches').select('*, product:products(name)');
        if (productId) {
          query = query.eq('product_id', productId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(b => ({
          id: b.id,
          product_id: b.product_id,
          product_name: b.product?.name || 'Product',
          batch_number: b.batch_number,
          supplier: 'Supplier',
          quantity_received: b.initial_quantity,
          current_quantity: b.current_quantity,
          purchase_price: b.purchase_price,
          selling_price: b.selling_price,
          manufacturing_date: b.mfg_date ? b.mfg_date.split('T')[0] : 'N/A',
          expiry_date: b.expiry_date ? b.expiry_date.split('T')[0] : 'N/A',
          status: getExpiryStatus(b.expiry_date)
        }));
      } catch (err) {
        console.error('Supabase getBatches error:', err);
        throw err;
      }
    }

    const params = {};
    if (productId) params.product_id = productId;
    const data = await api.get('/api/inventory/batches', { params });
    if (Array.isArray(data)) {
      return data.map(b => ({
        id: b.id,
        product_id: b.product_id,
        product_name: b.product_name || 'Product',
        batch_number: b.batch_number,
        supplier: 'Supplier',
        quantity_received: b.initial_quantity,
        current_quantity: b.current_quantity,
        purchase_price: b.purchase_price,
        selling_price: b.selling_price,
        manufacturing_date: b.mfg_date ? b.mfg_date.split('T')[0] : 'N/A',
        expiry_date: b.expiry_date ? b.expiry_date.split('T')[0] : 'N/A',
        status: getExpiryStatus(b.expiry_date)
      }));
    }
    return [];
  },

  async getMovements(productId = null) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('stock_movements').select('*, product:products(name), batch:product_batches(batch_number)');
        if (productId) {
          query = query.eq('product_id', productId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(m => ({
          id: `MOV-${m.id}`,
          date_time: m.created_at ? m.created_at.replace('T', ' ').substring(0, 16) : 'N/A',
          product_name: m.product?.name || 'Product',
          batch_number: m.batch?.batch_number || 'General',
          movement_type: m.movement_type === 'INWARD' ? 'Purchase' : (m.movement_type === 'SALE' || m.movement_type === 'OUTWARD' ? 'Sale' : 'Adjustment'),
          reference: m.reference_id || 'N/A',
          quantity_in: m.movement_type === 'INWARD' || m.movement_type.includes('ADD') ? m.quantity : '-',
          quantity_out: m.movement_type === 'SALE' || m.movement_type === 'OUTWARD' || m.movement_type.includes('REDUCE') ? m.quantity : '-',
          notes: m.notes || '',
          user: 'Admin'
        }));
      } catch (err) {
        console.error('Supabase getMovements error:', err);
        throw err;
      }
    }

    const params = {};
    if (productId) params.product_id = productId;
    const data = await api.get('/api/inventory/movements', { params });
    if (Array.isArray(data)) {
      return data.map(m => ({
        id: `MOV-${m.id}`,
        date_time: m.created_at ? m.created_at.replace('T', ' ').substring(0, 16) : 'N/A',
        product_name: m.product_name || 'Product',
        batch_number: m.batch_id ? `BCH-${m.batch_id}` : 'General',
        movement_type: m.movement_type === 'INWARD' ? 'Purchase' : (m.movement_type === 'SALE' || m.movement_type === 'OUTWARD' ? 'Sale' : 'Adjustment'),
        reference: m.reference_id || 'N/A',
        quantity_in: m.movement_type === 'INWARD' || m.movement_type.includes('ADD') ? m.quantity : '-',
        quantity_out: m.movement_type === 'SALE' || m.movement_type === 'OUTWARD' || m.movement_type.includes('REDUCE') ? m.quantity : '-',
        notes: m.notes || '',
        user: 'Admin'
      }));
    }
    return [];
  },

  async createBatch(batchData) {
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          product_id: Number(batchData.productId),
          batch_number: batchData.batchNo || `BCH-${Date.now().toString().slice(-4)}`,
          mfg_date: batchData.manufDate || null,
          expiry_date: batchData.expiryDate,
          initial_quantity: Number(batchData.quantity) || 0,
          current_quantity: Number(batchData.quantity) || 0,
          purchase_price: Number(batchData.purchasePrice) || 0.0,
          selling_price: Number(batchData.sellingPrice || (batchData.purchasePrice * 1.2)) || 0.0,
          supplier_id: Number(batchData.supplierId) || 1
        };
        const { data, error } = await supabase.from('product_batches').insert([payload]).select().single();
        if (error) throw error;

        try {
          await supabase.from('stock_movements').insert([{
            product_id: Number(batchData.productId),
            batch_id: data.id,
            movement_type: 'INWARD',
            quantity: Number(batchData.quantity),
            reference_type: 'PURCHASE',
            reference_id: batchData.invoiceNo || 'PUR-001',
            notes: 'Stock batch added'
          }]);
        } catch (mErr) {
          console.warn('Stock movement record skipped:', mErr.message);
        }

        return data;
      } catch (err) {
        throw err;
      }
    }

    return await this.addStock(batchData.supplierId, batchData.productId, batchData.batchNo, batchData.expiryDate, batchData.quantity, batchData.purchasePrice);
  },

  async adjustStock(productId, batchId, adjustmentType, quantity, reason) {
    const payload = {
      product_id: Number(productId),
      batch_id: batchId ? Number(batchId) : undefined,
      adjustment_type: adjustmentType.toUpperCase(),
      quantity: Number(quantity),
      reason: reason || 'Manual adjustment'
    };
    return await api.post('/api/inventory/adjust', payload);
  },

  async addStock(supplierId, productId, batchNumber, expiryDate, quantity, unitPrice) {
    const payload = {
      supplier_id: Number(supplierId) || 1,
      payment_method: 'Bank Transfer',
      items: [
        {
          product_id: Number(productId),
          batch_number: batchNumber || `BCH-${Date.now()}`,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          gst_percent: 5.0
        }
      ]
    };
    return await api.post('/api/purchases', payload);
  }
};

export default inventoryService;
