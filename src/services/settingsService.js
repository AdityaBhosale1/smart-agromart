// Smart AgroMart Centralized Settings & Administration Service
// Manages shop profile, invoice formats, GST taxes, UPI configuration, user roles, security, and backups
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const defaultShopProfile = {
  shop_name: 'Smart AgroMart',
  owner_name: 'Aditya Bhosale',
  mobile: '9876543210',
  alt_mobile: '9876543211',
  email: 'admin@smartagromart.in',
  address: 'Market Yard, Station Road',
  city: 'Nashik',
  taluka: 'Nashik',
  district: 'Nashik',
  state: 'Maharashtra',
  pincode: '422001',
  country: 'India',
  gstin: '27ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  license_number: 'LIC-AG-8812',
  registration_number: 'REG-MH-2026-9012',
  business_type: 'Agricultural Retail Shop',
  financial_year_start: 'April',
  currency: 'INR ₹',
  timezone: 'Asia/Kolkata',
  logo_url: null
};

export const defaultBillingConfig = {
  invoice_prefix: 'AGM',
  starting_number: 48,
  number_padding: 5,
  show_logo: true,
  show_gstin: true,
  show_customer_mobile: true,
  show_farmer_village: true,
  show_hsn_code: true,
  show_batch_number: true,
  show_expiry_date: false,
  show_payment_status: true,
  show_credit_due_date: true,
  show_signature: true,
  show_thank_you: true,
  invoice_footer: 'Thank you for choosing Smart AgroMart. Smart Shop • Smarter Farming • Stronger Farmers',
  terms_and_conditions: 'Goods once sold are subject to shop return policy. Please verify products before leaving.',
  paper_format: 'A4' // A4, Thermal 80mm, Thermal 58mm
};

export const defaultTaxConfig = {
  gst_enabled: true,
  business_state: 'Maharashtra',
  gstin: '27ABCDE1234F1Z5',
  tax_calculation: 'Exclusive', // Exclusive, Inclusive
  round_off_option: 'Nearest ₹1',
  item_discount_enabled: true,
  invoice_discount_enabled: true,
  max_staff_discount_pct: 5,
  max_admin_discount_pct: 20,
  approval_threshold_pct: 5,
  tax_rates: [
    { rate: 0, label: '0% (Exempt)', status: 'Active' },
    { rate: 5, label: '5% (Fertilizers & Seeds)', status: 'Active' },
    { rate: 12, label: '12% (Micronutrients)', status: 'Active' },
    { rate: 18, label: '18% (Pesticides & Tools)', status: 'Active' },
    { rate: 28, label: '28% (Special Equipment)', status: 'Active' }
  ]
};

export const defaultPaymentConfig = {
  accept_cash: true,
  accept_upi: true,
  accept_card: true,
  accept_bank_transfer: true,
  accept_credit: true,
  accept_cheque: false,
  accept_split: true,
  upi_id: 'smartagromart@upi',
  payee_name: 'Smart AgroMart',
  qr_code_enabled: true
};

export const defaultCreditConfig = {
  allow_credit_sales: true,
  credit_requires_registered_farmer: true,
  default_due_period_days: 15,
  allow_limit_override: 'Admin Only',
  block_above_limit: false,
  warn_above_limit: true,
  overdue_reminder_days: 3
};

export const initialMasterUsers = [
  {
    id: 'USR-101',
    name: 'Aditya Bhosale',
    username: 'admin',
    email: 'admin@smartagromart.in',
    mobile: '9876543210',
    role: 'Admin',
    status: 'Active',
    last_login: 'Today 10:15 AM'
  },
  {
    id: 'USR-102',
    name: 'Rohan Patil',
    username: 'rohan.staff',
    email: 'rohan@smartagromart.in',
    mobile: '9876500012',
    role: 'Shopkeeper / Staff',
    status: 'Active',
    last_login: 'Today 09:30 AM'
  },
  {
    id: 'USR-103',
    name: 'Priya Shinde',
    username: 'priya.accounts',
    email: 'accounts@smartagromart.in',
    mobile: '9822144332',
    role: 'Accountant',
    status: 'Active',
    last_login: 'Yesterday 05:45 PM'
  },
  {
    id: 'USR-104',
    name: 'Suresh Deshmukh',
    username: 'suresh.viewer',
    email: 'viewer@smartagromart.in',
    mobile: '9923455667',
    role: 'Viewer',
    status: 'Active',
    last_login: '3 days ago'
  }
];

export const initialRolePermissionsMatrix = [
  { module: 'Dashboard', view: true, create: false, edit: false, delete: false, export: true },
  { module: 'Billing / POS', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'Products Master', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'Inventory', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'Farmers', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'Purchases', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'Credit Management', view: true, create: true, edit: true, delete: false, export: true },
  { module: 'AI Insights', view: true, create: false, edit: false, delete: false, export: true },
  { module: 'Reports & Analytics', view: true, create: false, edit: false, delete: false, export: true },
  { module: 'Notifications', view: true, create: false, edit: false, delete: false, export: true },
  { module: 'Settings & Admin', view: true, create: true, edit: true, delete: true, export: true }
];

export const defaultInventoryConfig = {
  use_product_min_stock: true,
  expiry_warning_days: 30,
  batch_tracking_enabled: true,
  fefo_billing_enabled: true,
  prevent_expired_sale: true,
  allow_negative_stock: false,
  adjustment_requires_admin: true,
  cost_update_on_purchase: 'Latest Purchase Price'
};

export const defaultAIConfig = {
  sales_forecast_enabled: true,
  demand_forecast_enabled: true,
  smart_reorder_enabled: true,
  seasonal_insights_enabled: true,
  farmer_recommendations_enabled: true,
  forecast_horizon_days: 30,
  safety_stock_pct: 15,
  insight_mode: 'Demo Rule-Based'
};

export const initialLoginActivityLogs = [
  { user: 'Aditya Bhosale (Admin)', time: '08 Sep 2026 10:15 AM', device: 'Chrome / Windows 11', status: 'Successful', ip: '192.168.1.45' },
  { user: 'Rohan Patil (Staff)', time: '08 Sep 2026 09:30 AM', device: 'Chrome / Windows 10', status: 'Successful', ip: '192.168.1.50' },
  { user: 'Priya Shinde (Accountant)', time: '07 Sep 2026 05:45 PM', device: 'Firefox / macOS', status: 'Successful', ip: '192.168.1.62' }
];

import { logAuditEvent } from './auditService';

// Helper to load settings from LocalStorage or Fallback
export const getStoredSettings = (key, fallback) => {
  try {
    const item = localStorage.getItem(`agromart_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const saveStoredSettings = (key, value) => {
  try {
    localStorage.setItem(`agromart_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const getAppSettings = async (key, fallback) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).single();
      if (!error && data?.value) {
        return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      }
    } catch (e) {
      console.warn(`Supabase getAppSettings for ${key} failed:`, e.message);
    }
  }
  return getStoredSettings(key, fallback);
};

export const saveAppSettings = async (key, value) => {
  saveStoredSettings(key, value);
  if (isSupabaseConfigured()) {
    try {
      // 1. Try update_agromart_settings RPC first
      const { error: rpcErr } = await supabase.rpc('update_agromart_settings', {
        p_key: key,
        p_value: typeof value === 'string' ? JSON.parse(value) : value
      });

      if (rpcErr) {
        // 2. Direct upsert fallback
        await supabase.from('app_settings').upsert({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updated_at: new Date().toISOString()
        });
      }

      await logAuditEvent('SETTINGS_CHANGED', 'SETTINGS', key, `Updated app_settings key [${key}]`);
    } catch (e) {
      console.warn(`Supabase saveAppSettings for ${key} failed:`, e.message);
    }
  }
};

export const getProfilesFromSupabase = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        return data.map(p => ({
          id: p.id,
          name: p.name || 'User',
          username: p.email ? p.email.split('@')[0] : 'user',
          email: p.email || '',
          mobile: p.mobile || 'N/A',
          role: p.role || 'Staff',
          status: 'Active',
          last_login: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Recently'
        }));
      }
    } catch (e) {
      console.warn('Supabase getProfiles failed:', e.message);
    }
  }
  return initialMasterUsers || [];
};

export const updateUserRoleInSupabase = async (userId, newRole) => {
  if (!isSupabaseConfigured()) return false;
  try {
    // 1. Try update_user_role RPC first
    const { error: rpcErr } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_role: newRole
    });

    if (rpcErr) {
      // 2. Direct profiles table update fallback
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (updateErr) throw updateErr;
    }

    await logAuditEvent('ROLE_CHANGED', 'PROFILE', userId, `Updated user [${userId}] role to [${newRole}]`);
    return true;
  } catch (err) {
    console.error('Failed updating user role in Supabase:', err.message);
    return false;
  }
};

