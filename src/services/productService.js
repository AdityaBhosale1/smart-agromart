import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const initialMasterProducts = [
  { id: 101, product_id: 101, name: 'DAP Fertilizer 50kg', category: 'Fertilizers', brand: 'IFFCO', hsn_code: '3105', gst_rate: 5, gst_percent: 5, purchase_price: 1200, selling_price: 1350, current_stock: 42, minimum_stock: 15, unit: 'Bags', batch_number: 'DAP-B102', expiry_date: '2028-08-15', status: 'In Stock' },
  { id: 102, product_id: 102, name: 'Urea Fertilizer 45kg', category: 'Fertilizers', brand: 'IFFCO', hsn_code: '3102', gst_rate: 5, gst_percent: 5, purchase_price: 260, selling_price: 300, current_stock: 65, minimum_stock: 20, unit: 'Bags', batch_number: 'UR-B215', expiry_date: '2028-01-10', status: 'In Stock' },
  { id: 103, product_id: 103, name: 'NPK 19:19:19 1kg', category: 'Fertilizers', brand: 'Mahadhan', hsn_code: '3105', gst_rate: 5, gst_percent: 5, purchase_price: 110, selling_price: 145, current_stock: 28, minimum_stock: 15, unit: 'Bags', batch_number: 'NPK-B88', expiry_date: '2027-11-20', status: 'In Stock' }
];

export const getStockStatus = (stock, minStock, expiryDate) => {
  const stockNum = Number(stock || 0);
  const minNum = Number(minStock || 10);
  if (stockNum === 0) return 'Out of Stock';
  
  if (expiryDate && expiryDate !== 'N/A') {
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring Soon';
  }

  if (stockNum <= minNum) return 'Low Stock';
  return 'In Stock';
};

export const mapBackendProduct = (p) => {
  if (!p) return null;
  const numId = Number(p.id);
  const stock = Number(p.total_stock !== undefined ? p.total_stock : (p.current_stock ?? p.stock ?? 0));
  const minStock = Number(p.min_stock_alert !== undefined ? p.min_stock_alert : (p.minimum_stock ?? 10));
  const sellingPrice = Number(p.selling_price ?? p.sellingPrice ?? 0);
  const purchasePrice = Number(p.purchase_price ?? p.purchasePrice ?? 0);
  const gstRate = Number(p.gst_percent !== undefined ? p.gst_percent : (p.gst_rate ?? p.gst ?? 5));

  return {
    id: numId,
    product_id: numId,
    product_code: p.product_code || `PRD-${numId}`,
    name: p.name || 'Unnamed Product',
    category: p.category_name || (p.category?.name) || 'General',
    category_id: p.category_id || 1,
    brand: p.brand || 'Generic',
    composition: p.composition || '',
    hsn_code: p.hsn_code || '3808',
    gst_rate: gstRate,
    gst: gstRate,
    purchase_price: purchasePrice,
    purchasePrice: purchasePrice,
    selling_price: sellingPrice,
    sellingPrice: sellingPrice,
    current_stock: stock,
    stock: stock,
    minimum_stock: minStock,
    unit: p.unit || 'Kg',
    status: p.status === 'Inactive' ? 'Inactive' : getStockStatus(stock, minStock, p.expiry_date),
    is_active: p.status !== 'Inactive'
  };
};

const categoryMap = {
  'Fertilizers': 1,
  'Seeds': 2,
  'Pesticides': 3,
  'Fungicides': 4,
  'Tools': 5,
  'Equipment': 5
};

export const productService = {
  async getProducts(params = {}) {
    if (!isSupabaseConfigured()) return initialMasterProducts.map(mapBackendProduct);

    let query = supabase.from('products').select('*, category:categories(name)');
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,product_code.ilike.%${params.search}%`);
    }
    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapBackendProduct);
  },

  async getProduct(id) {
    if (!isSupabaseConfigured()) return mapBackendProduct(initialMasterProducts[0]);

    const { data, error } = await supabase.from('products').select('*, category:categories(name)').eq('id', id).single();
    if (error) throw error;
    return mapBackendProduct(data);
  },

  async createProduct(productData) {
    if (!isSupabaseConfigured()) {
      const mockId = Date.now();
      return mapBackendProduct({ ...productData, id: mockId });
    }

    const catId = Number(productData.category_id || categoryMap[productData.category] || 1);
    const purchasePrice = Number(productData.purchase_price || 0);
    const sellingPrice = Number(productData.selling_price || 0);
    const gstRate = Number(productData.gst_rate || 5);
    const currentStock = Number(productData.current_stock || 0);
    const minStock = Number(productData.minimum_stock || 10);

    const payload = {
      product_code: `PRD-${Date.now().toString().slice(-4)}`,
      name: productData.name,
      category_id: catId,
      brand: productData.brand || 'Generic',
      composition: productData.composition || '',
      hsn_code: productData.hsn_code || '3808',
      unit: productData.unit || 'Kg',
      gst_percent: gstRate,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      min_stock_alert: minStock,
      total_stock: currentStock,
      status: 'Active'
    };

    const { data: newProd, error: prodErr } = await supabase.from('products').insert([payload]).select().single();
    if (prodErr) throw prodErr;

    // Create opening batch & stock movement if opening stock provided
    if (currentStock > 0 && newProd?.id) {
      try {
        const batchNumber = productData.batch_number || `BCH-${newProd.id}-${Date.now().toString().slice(-4)}`;
        const mfgDate = productData.manufacturing_date || new Date().toISOString().split('T')[0];
        const expiryDate = productData.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: batchData, error: batchErr } = await supabase.from('product_batches').insert([{
          product_id: newProd.id,
          batch_number: batchNumber,
          mfg_date: mfgDate,
          expiry_date: expiryDate,
          initial_quantity: currentStock,
          current_quantity: currentStock,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          supplier_id: 1
        }]).select().single();

        if (!batchErr && batchData) {
          await supabase.from('stock_movements').insert([{
            product_id: newProd.id,
            batch_id: batchData.id,
            movement_type: 'INWARD',
            quantity: currentStock,
            reference_type: 'OPENING_STOCK',
            reference_id: `INIT-${newProd.id}`,
            notes: 'Opening stock created with new product'
          }]);
        }
      } catch (batchErr) {
        console.warn('Opening batch creation notice:', batchErr.message);
      }
    }

    return mapBackendProduct(newProd);
  },

  async updateProduct(id, productData) {
    if (!isSupabaseConfigured()) {
      return mapBackendProduct({ ...productData, id });
    }

    const catId = productData.category_id ? Number(productData.category_id) : (categoryMap[productData.category] || undefined);

    const updatePayload = {
      name: productData.name,
      brand: productData.brand,
      composition: productData.composition,
      hsn_code: productData.hsn_code,
      unit: productData.unit,
      status: productData.status
    };

    if (catId !== undefined) updatePayload.category_id = catId;
    if (productData.gst_rate !== undefined) updatePayload.gst_percent = Number(productData.gst_rate);
    if (productData.purchase_price !== undefined) updatePayload.purchase_price = Number(productData.purchase_price);
    if (productData.selling_price !== undefined) updatePayload.selling_price = Number(productData.selling_price);
    if (productData.minimum_stock !== undefined) updatePayload.min_stock_alert = Number(productData.minimum_stock);

    const { data, error } = await supabase.from('products').update(updatePayload).eq('id', id).select().single();
    if (error) throw error;
    return mapBackendProduct(data);
  },

  async changeProductStatus(id, newStatus) {
    return this.updateProduct(id, { status: newStatus });
  },

  async getCategories() {
    if (!isSupabaseConfigured()) return [
      { id: 1, name: 'Fertilizers' },
      { id: 2, name: 'Seeds' },
      { id: 3, name: 'Pesticides' },
      { id: 4, name: 'Fungicides' },
      { id: 5, name: 'Tools' }
    ];

    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data || [];
  }
};

export default productService;
