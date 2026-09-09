import api from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialMasterProducts = [
  { id: 'P101', name: 'DAP Fertilizer 50kg', category: 'Fertilizers', brand: 'IFFCO', hsn_code: '3105', gst_rate: 5, purchase_price: 1200, selling_price: 1350, current_stock: 42, minimum_stock: 15, unit: 'Bags', batch_number: 'DAP-B102', expiry_date: '2028-08-15', status: 'In Stock' },
  { id: 'P102', name: 'Urea Fertilizer 45kg', category: 'Fertilizers', brand: 'IFFCO', hsn_code: '3102', gst_rate: 5, purchase_price: 260, selling_price: 300, current_stock: 65, minimum_stock: 20, unit: 'Bags', batch_number: 'UR-B215', expiry_date: '2028-01-10', status: 'In Stock' },
  { id: 'P103', name: 'NPK 19:19:19 1kg', category: 'Fertilizers', brand: 'Mahadhan', hsn_code: '3105', gst_rate: 5, purchase_price: 110, selling_price: 145, current_stock: 28, minimum_stock: 15, unit: 'Bags', batch_number: 'NPK-B88', expiry_date: '2027-11-20', status: 'In Stock' }
];

export const getStockStatus = (stock, minStock, expiryDate) => {
  if (stock === 0) return 'Out of Stock';
  
  if (expiryDate && expiryDate !== 'N/A') {
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring Soon';
  }

  if (stock <= minStock) return 'Low Stock';
  return 'In Stock';
};

export const mapBackendProduct = (p) => {
  if (!p) return null;
  const stock = p.total_stock !== undefined ? p.total_stock : (p.current_stock || 0);
  const minStock = p.min_stock_alert !== undefined ? p.min_stock_alert : (p.minimum_stock || 10);
  
  return {
    id: p.id,
    product_code: p.product_code || `PRD-${p.id}`,
    name: p.name,
    category: p.category_name || (p.category?.name) || 'General',
    category_id: p.category_id,
    brand: p.brand || 'Generic',
    composition: p.composition || '',
    hsn_code: p.hsn_code || '3808',
    gst_rate: p.gst_percent !== undefined ? p.gst_percent : (p.gst_rate || 5),
    purchase_price: p.purchase_price || 0,
    selling_price: p.selling_price || 0,
    current_stock: stock,
    minimum_stock: minStock,
    unit: p.unit || 'Kg',
    status: p.status === 'Inactive' ? 'Inactive' : getStockStatus(stock, minStock, p.expiry_date),
    is_active: p.status !== 'Inactive'
  };
};

export const productService = {
  async getProducts(params = {}) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('products').select('*, category:categories(name)');
        if (params.search) {
          query = query.or(`name.ilike.%${params.search}%,product_code.ilike.%${params.search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapBackendProduct);
      } catch (err) {
        console.warn('Supabase getProducts failed, falling back to API:', err);
      }
    }
    const data = await api.get('/api/products', { params });
    if (Array.isArray(data)) {
      return data.map(mapBackendProduct);
    }
    return [];
  },

  async getProduct(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*, category:categories(name)').eq('id', id).single();
        if (error) throw error;
        return mapBackendProduct(data);
      } catch (err) {
        console.warn('Supabase getProduct failed, falling back to API:', err);
      }
    }
    const data = await api.get(`/api/products/${id}`);
    return mapBackendProduct(data);
  },

  async createProduct(productData) {
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          product_code: `PRD-${Date.now().toString().slice(-4)}`,
          name: productData.name,
          category_id: Number(productData.category_id) || 1,
          brand: productData.brand || 'Generic',
          composition: productData.composition || '',
          hsn_code: productData.hsn_code || '3808',
          unit: productData.unit || 'Kg',
          gst_percent: Number(productData.gst_rate) || 5.0,
          purchase_price: Number(productData.purchase_price) || 0.0,
          selling_price: Number(productData.selling_price) || 0.0,
          min_stock_alert: Number(productData.minimum_stock) || 10,
          total_stock: Number(productData.current_stock) || 0,
          status: 'Active'
        };
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        return mapBackendProduct(data);
      } catch (err) {
        console.warn('Supabase createProduct failed, falling back to API:', err);
      }
    }

    const payload = {
      name: productData.name,
      category_id: Number(productData.category_id) || 1,
      brand: productData.brand || 'Generic',
      composition: productData.composition || '',
      hsn_code: productData.hsn_code || '3808',
      unit: productData.unit || 'Kg',
      gst_percent: Number(productData.gst_rate) || 5.0,
      purchase_price: Number(productData.purchase_price) || 0.0,
      selling_price: Number(productData.selling_price) || 0.0,
      min_stock_alert: Number(productData.minimum_stock) || 10,
      initial_stock: Number(productData.current_stock) || 0,
      status: 'Active'
    };
    const created = await api.post('/api/products', payload);
    return mapBackendProduct(created);
  },

  async updateProduct(id, productData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').update({
          name: productData.name,
          brand: productData.brand,
          composition: productData.composition,
          hsn_code: productData.hsn_code,
          unit: productData.unit,
          gst_percent: productData.gst_rate,
          purchase_price: productData.purchase_price,
          selling_price: productData.selling_price,
          min_stock_alert: productData.minimum_stock,
          status: productData.status
        }).eq('id', id).select().single();
        if (error) throw error;
        return mapBackendProduct(data);
      } catch (err) {
        console.warn('Supabase updateProduct failed, falling back to API:', err);
      }
    }

    const payload = {
      name: productData.name,
      category_id: productData.category_id ? Number(productData.category_id) : undefined,
      brand: productData.brand,
      composition: productData.composition,
      hsn_code: productData.hsn_code,
      unit: productData.unit,
      gst_percent: productData.gst_rate !== undefined ? Number(productData.gst_rate) : undefined,
      purchase_price: productData.purchase_price !== undefined ? Number(productData.purchase_price) : undefined,
      selling_price: productData.selling_price !== undefined ? Number(productData.selling_price) : undefined,
      min_stock_alert: productData.minimum_stock !== undefined ? Number(productData.minimum_stock) : undefined,
      status: productData.status
    };
    const updated = await api.put(`/api/products/${id}`, payload);
    return mapBackendProduct(updated);
  },

  async changeProductStatus(id, newStatus) {
    return this.updateProduct(id, { status: newStatus });
  },

  async getCategories() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getCategories failed, falling back to API:', err);
      }
    }
    return await api.get('/api/products/categories');
  }
};

export default productService;
