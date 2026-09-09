import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, Save, Store, Shield, Database, 
  FileText, Scale, CreditCard, Users, Package, BrainCircuit, 
  Globe, Lock, AlertTriangle, CheckCircle2, RefreshCw, Plus, 
  Trash2, Upload, Download, Eye, EyeOff, Key, UserPlus, Sliders,
  HelpCircle, ChevronRight, X, AlertCircle, Sparkles, Smartphone, Check,
  Info
} from 'lucide-react';

import { 
  defaultShopProfile, 
  defaultBillingConfig, 
  defaultTaxConfig, 
  defaultPaymentConfig, 
  defaultCreditConfig, 
  initialMasterUsers, 
  initialRolePermissionsMatrix, 
  defaultInventoryConfig, 
  defaultAIConfig, 
  initialLoginActivityLogs,
  getStoredSettings,
  saveStoredSettings,
  getAppSettings,
  saveAppSettings,
  getProfilesFromSupabase,
  updateUserRoleInSupabase,
  uploadShopLogoToSupabase
} from '../services/settingsService';
import { useShop } from '../context/ShopContext';

export const defaultSettings = {
  shop: defaultShopProfile || {},
  billing: defaultBillingConfig || {},
  tax: defaultTaxConfig || {},
  payments: defaultPaymentConfig || {},
  credit: defaultCreditConfig || {},
  inventory: defaultInventoryConfig || {},
  ai: defaultAIConfig || {},
  notifications: {},
  localization: { language: 'English', currency: 'INR (₹)', date_format: 'DD/MM/YYYY' },
  security: { two_factor_auth: false, session_timeout_mins: 30, password_expiry_days: 90 },
  system: { app_name: 'Smart AgroMart', version: 'v1.0.0 Enterprise' }
};


export const Settings = () => {
  const { updateShopProfile } = useShop();
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Form States (Initialized with LocalStorage or Defaults)
  const [shopProfile, setShopProfile] = useState(() => ({ ...defaultShopProfile, ...(getStoredSettings('profile', defaultShopProfile) || {}) }));
  const [billingConfig, setBillingConfig] = useState(() => ({ ...defaultBillingConfig, ...(getStoredSettings('billing', defaultBillingConfig) || {}) }));
  const [taxConfig, setTaxConfig] = useState(() => ({ ...defaultTaxConfig, ...(getStoredSettings('tax', defaultTaxConfig) || {}) }));
  const [paymentConfig, setPaymentConfig] = useState(() => ({ ...defaultPaymentConfig, ...(getStoredSettings('payment', defaultPaymentConfig) || {}) }));
  const [creditConfig, setCreditConfig] = useState(() => ({ ...defaultCreditConfig, ...(getStoredSettings('credit', defaultCreditConfig) || {}) }));
  const [inventoryConfig, setInventoryConfig] = useState(() => ({ ...defaultInventoryConfig, ...(getStoredSettings('inventory', defaultInventoryConfig) || {}) }));
  const [aiConfig, setAiConfig] = useState(() => ({ ...defaultAIConfig, ...(getStoredSettings('ai', defaultAIConfig) || {}) }));
  const [users, setUsers] = useState(() => initialMasterUsers || []);
  const [roles, setRoles] = useState(() => ['Admin', 'Shopkeeper / Staff', 'Accountant', 'Viewer']);
  const [permissionsMatrix, setPermissionsMatrix] = useState(() => initialRolePermissionsMatrix || []);

  // Modals & UI States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetDemoOpen, setIsResetDemoOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const fileInputRef = useRef(null);

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setLogoError(null);
    try {
      const logoUrl = await uploadShopLogoToSupabase(file);
      const updatedProfile = { ...shopProfile, logo_url: logoUrl };
      setShopProfile(updatedProfile);
      updateShopProfile(updatedProfile);
      setIsDirty(true);
      await saveAppSettings('profile', updatedProfile);
    } catch (err) {
      setLogoError(err.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoError(null);
    const updatedProfile = { ...shopProfile, logo_url: null };
    setShopProfile(updatedProfile);
    updateShopProfile(updatedProfile);
    setIsDirty(true);
    await saveAppSettings('profile', updatedProfile);
  };

  // Sync settings with Supabase app_settings & profiles tables on load
  useEffect(() => {
    async function loadSupabaseSettings() {
      setLoading(true);
      setFetchError(null);
      try {
        const [prof, bill, tax, pay, cred, inv, ai, fetchedProfiles] = await Promise.all([
          getAppSettings('profile', defaultShopProfile),
          getAppSettings('billing', defaultBillingConfig),
          getAppSettings('tax', defaultTaxConfig),
          getAppSettings('payment', defaultPaymentConfig),
          getAppSettings('credit', defaultCreditConfig),
          getAppSettings('inventory', defaultInventoryConfig),
          getAppSettings('ai', defaultAIConfig),
          getProfilesFromSupabase()
        ]);

        if (prof) setShopProfile(prev => ({ ...defaultShopProfile, ...prev, ...prof }));
        if (bill) setBillingConfig(prev => ({ ...defaultBillingConfig, ...prev, ...bill }));
        if (tax) setTaxConfig(prev => ({ ...defaultTaxConfig, ...prev, ...tax }));
        if (pay) setPaymentConfig(prev => ({ ...defaultPaymentConfig, ...prev, ...pay }));
        if (cred) setCreditConfig(prev => ({ ...defaultCreditConfig, ...prev, ...cred }));
        if (inv) setInventoryConfig(prev => ({ ...defaultInventoryConfig, ...prev, ...inv }));
        if (ai) setAiConfig(prev => ({ ...defaultAIConfig, ...prev, ...ai }));
        if (fetchedProfiles && fetchedProfiles.length > 0) setUsers(fetchedProfiles);
      } catch (err) {
        console.warn('Failed loading settings from Supabase:', err.message);
        setFetchError('Unable to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSupabaseSettings();
  }, []);


  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirm_password: '',
    role: 'Shopkeeper / Staff',
    status: 'Active'
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Save Settings Handler
  const handleSaveChanges = async () => {
    updateShopProfile(shopProfile);
    await Promise.all([
      saveAppSettings('profile', shopProfile),
      saveAppSettings('billing', billingConfig),
      saveAppSettings('tax', taxConfig),
      saveAppSettings('payment', paymentConfig),
      saveAppSettings('credit', creditConfig),
      saveAppSettings('inventory', inventoryConfig),
      saveAppSettings('ai', aiConfig)
    ]);

    setIsDirty(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Add User Handler
  const handleSaveNewUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.username || !newUserForm.password) {
      alert('Please fill in all required user fields.');
      return;
    }
    if (newUserForm.password !== newUserForm.confirm_password) {
      alert('New password and confirm password do not match.');
      return;
    }

    const newUser = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newUserForm.name,
      username: newUserForm.username,
      email: newUserForm.email || 'user@smartagromart.in',
      mobile: newUserForm.mobile || '9876543210',
      role: newUserForm.role,
      status: newUserForm.status,
      last_login: 'Just created'
    };

    setUsers([...users, newUser]);
    setIsAddUserOpen(false);
    setNewUserForm({
      name: '', email: '', mobile: '', username: '', password: '', confirm_password: '', role: 'Shopkeeper / Staff', status: 'Active'
    });
    alert(`User ${newUser.name} created successfully with role ${newUser.role}.`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 text-[#064E3B] animate-spin mx-auto" />
        <p className="text-xs font-bold text-gray-600">Loading Smart AgroMart System Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 font-sans">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">Settings & Administration</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-emerald-300">
                ERP Configuration
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Manage shop profile, billing preferences, users, taxes, notifications and system configuration
            </p>
          </div>
        </div>

        {/* HEADER SAVE ACTIONS */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => {
              setShopProfile(defaultShopProfile);
              setBillingConfig(defaultBillingConfig);
              setTaxConfig(defaultTaxConfig);
              setPaymentConfig(defaultPaymentConfig);
              setCreditConfig(defaultCreditConfig);
              setIsDirty(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
          >
            Discard Changes
          </button>

          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Save className="w-4 h-4 text-emerald-300" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* FETCH ERROR BANNER */}
      {fetchError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{fetchError} - Loaded sensible default configurations.</span>
          </div>
          <button onClick={() => setFetchError(null)}><X className="w-4 h-4 text-amber-700" /></button>
        </div>
      )}

      {/* SAVE TOAST NOTIFICATION */}
      {saveToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>Settings saved successfully! All shop configurations updated across application modules.</span>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MAIN LAYOUT: LEFT SETTINGS NAV + RIGHT CONTENT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* LEFT SETTINGS NAVIGATION (Desktop Sidebar / Mobile Horizontal) */}
        <div className="lg:col-span-1 space-y-1">
          <div className="p-2 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-1 text-xs font-bold text-gray-700">
            {[
              { id: 'profile', label: 'Shop Profile', icon: Store },
              { id: 'billing', label: 'Billing & Invoice', icon: FileText },
              { id: 'tax', label: 'GST & Tax Settings', icon: Scale },
              { id: 'payment', label: 'Payments & UPI', icon: CreditCard },
              { id: 'credit', label: 'Credit Rules', icon: Database },
              { id: 'users', label: 'Users & Roles', icon: Users },
              { id: 'inventory', label: 'Inventory Rules', icon: Package },
              { id: 'ai', label: 'AI Preferences', icon: BrainCircuit },
              { id: 'localization', label: 'Localization', icon: Globe },
              { id: 'backup', label: 'Backup & Data', icon: Download },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'system', label: 'System Info', icon: Info }
            ].map(tab => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#064E3B] text-white shadow-xs'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT SETTINGS CONTENT PANEL */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* ------------------------------------------------------------------------- */}
          {/* TAB 1: SHOP PROFILE */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'profile' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Shop Profile & Information</h3>

              {/* LOGO UPLOAD BOX */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoSelect} 
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-2xl bg-[#064E3B] text-white font-extrabold text-xl flex items-center justify-center border-2 border-emerald-400 shrink-0 overflow-hidden relative">
                  {shopProfile.logo_url ? (
                    <img 
                      src={shopProfile.logo_url} 
                      alt="Shop Logo" 
                      className="w-full h-full object-contain p-1 bg-white" 
                    />
                  ) : (
                    <span>AGM</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="font-extrabold text-gray-900 block text-xs">Upload Official Shop Logo</span>
                  <p className="text-[11px] text-gray-500">Logo will be printed on GST Tax Invoices, Receipts, and Reports (PNG, JPG, SVG - Max 2MB)</p>
                  {logoError && (
                    <p className="text-[11px] text-red-600 font-medium">{logoError}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-[#064E3B] text-white font-bold text-[11px] hover:bg-[#064E3B]/90 disabled:opacity-50 transition-colors"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    {shopProfile.logo_url && (
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 font-bold text-[11px] hover:bg-gray-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SHOP FORM FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Shop Name*</label>
                  <input
                    type="text"
                    value={shopProfile.shop_name}
                    onChange={e => { setShopProfile({ ...shopProfile, shop_name: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Owner Name</label>
                  <input
                    type="text"
                    value={shopProfile.owner_name}
                    onChange={e => { setShopProfile({ ...shopProfile, owner_name: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Mobile Number*</label>
                  <input
                    type="text"
                    value={shopProfile.mobile}
                    onChange={e => { setShopProfile({ ...shopProfile, mobile: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Alternate Helpline</label>
                  <input
                    type="text"
                    value={shopProfile.alt_mobile}
                    onChange={e => { setShopProfile({ ...shopProfile, alt_mobile: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={shopProfile.email}
                    onChange={e => { setShopProfile({ ...shopProfile, email: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">GSTIN Number</label>
                  <input
                    type="text"
                    value={shopProfile.gstin}
                    onChange={e => { setShopProfile({ ...shopProfile, gstin: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Address*</label>
                  <input
                    type="text"
                    value={shopProfile.address}
                    onChange={e => { setShopProfile({ ...shopProfile, address: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">City / District</label>
                  <input
                    type="text"
                    value={shopProfile.city}
                    onChange={e => { setShopProfile({ ...shopProfile, city: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">State</label>
                  <input
                    type="text"
                    value={shopProfile.state}
                    onChange={e => { setShopProfile({ ...shopProfile, state: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Fertilizer / Pesticide License No</label>
                  <input
                    type="text"
                    value={shopProfile.license_number}
                    onChange={e => { setShopProfile({ ...shopProfile, license_number: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Business Type</label>
                  <select
                    value={shopProfile.business_type}
                    onChange={e => { setShopProfile({ ...shopProfile, business_type: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                  >
                    <option value="Agricultural Retail Shop">Agricultural Retail Shop</option>
                    <option value="Wholesale">Wholesale Dealer</option>
                    <option value="Retail + Wholesale">Retail + Wholesale</option>
                    <option value="Distributor">Distributor Depot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 2: BILLING & INVOICE SETTINGS */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'billing' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Invoice Configuration</h3>

              {/* INVOICE PREFIX & NUMBER FORMAT */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-950">
                <div className="flex justify-between items-center font-bold">
                  <span>Sample Generated Invoice Number:</span>
                  <span className="font-mono text-sm font-extrabold text-[#064E3B]">
                    {billingConfig.invoice_prefix}-2026-00048
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Invoice Prefix</label>
                  <input
                    type="text"
                    value={billingConfig.invoice_prefix}
                    onChange={e => { setBillingConfig({ ...billingConfig, invoice_prefix: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Starting Number</label>
                  <input
                    type="number"
                    value={billingConfig.starting_number}
                    onChange={e => { setBillingConfig({ ...billingConfig, starting_number: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Default Paper Format</label>
                  <select
                    value={billingConfig.paper_format}
                    onChange={e => { setBillingConfig({ ...billingConfig, paper_format: e.target.value }); setIsDirty(true); }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                  >
                    <option value="A4">A4 Full Sheet Invoice</option>
                    <option value="Thermal 80mm">Thermal Receipt 80mm</option>
                    <option value="Thermal 58mm">Thermal Receipt 58mm</option>
                  </select>
                </div>
              </div>

              {/* INVOICE CONTENT TOGGLES */}
              <div className="space-y-2.5 border-t pt-3 font-medium text-gray-800">
                <h4 className="font-extrabold text-gray-900">Invoice Print Fields</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'show_logo', label: 'Show Shop Logo' },
                    { key: 'show_gstin', label: 'Show GSTIN' },
                    { key: 'show_customer_mobile', label: 'Show Customer Mobile' },
                    { key: 'show_farmer_village', label: 'Show Farmer Village' },
                    { key: 'show_hsn_code', label: 'Show HSN Code' },
                    { key: 'show_batch_number', label: 'Show Batch Number' },
                    { key: 'show_payment_status', label: 'Show Payment Status' },
                    { key: 'show_credit_due_date', label: 'Show Credit Due Date' },
                    { key: 'show_signature', label: 'Show Authorized Signature' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billingConfig[item.key]}
                        onChange={e => { setBillingConfig({ ...billingConfig, [item.key]: e.target.checked }); setIsDirty(true); }}
                        className="rounded text-[#064E3B]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Invoice Footer Message</label>
                <input
                  type="text"
                  value={billingConfig.invoice_footer}
                  onChange={e => { setBillingConfig({ ...billingConfig, invoice_footer: e.target.value }); setIsDirty(true); }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 3: GST & TAX SETTINGS */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'tax' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">GST & Tax Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxConfig?.gst_enabled ?? true}
                    onChange={e => setTaxConfig({ ...taxConfig, gst_enabled: e.target.checked })}
                    className="rounded text-[#064E3B]"
                  />
                  <span className="font-bold text-gray-800">Enable GST Invoice Calculation</span>
                </label>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Business State</label>
                  <input
                    type="text"
                    value={taxConfig?.business_state || 'Maharashtra'}
                    onChange={e => setTaxConfig({ ...taxConfig, business_state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300"
                  />
                </div>
              </div>
              <div className="border-t pt-3">
                <h4 className="font-bold text-gray-900 mb-2">Configured Tax Rates</h4>
                <div className="space-y-1.5">
                  {(taxConfig?.tax_rates || []).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border text-xs font-medium">
                      <span>{t.label}</span>
                      <span className="font-bold text-[#064E3B]">{t.rate}% GST</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 4: PAYMENTS & UPI */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'payment' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Accepted Payment Modes & UPI Setup</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'accept_cash', label: 'Cash Payment' },
                  { key: 'accept_upi', label: 'UPI / GPay / PhonePe' },
                  { key: 'accept_card', label: 'Credit / Debit Card' },
                  { key: 'accept_bank_transfer', label: 'Bank Transfer (NEFT)' },
                  { key: 'accept_credit', label: 'Credit / Udhar Sales' },
                  { key: 'accept_split', label: 'Split Payment Mode' }
                ].map(p => (
                  <label key={p.key} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig?.[p.key] ?? true}
                      onChange={e => { setPaymentConfig({ ...paymentConfig, [p.key]: e.target.checked }); setIsDirty(true); }}
                      className="rounded text-[#064E3B]"
                    />
                    <span className="font-bold">{p.label}</span>
                  </label>
                ))}
              </div>

              {/* UPI CONFIGURATION BOX */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h4 className="font-extrabold text-[#064E3B] text-sm font-['Outfit']">UPI QR Code Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">UPI VPA Address</label>
                    <input
                      type="text"
                      value={paymentConfig?.upi_id || ''}
                      onChange={e => { setPaymentConfig({ ...paymentConfig, upi_id: e.target.value }); setIsDirty(true); }}
                      className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Payee Name</label>
                    <input
                      type="text"
                      value={paymentConfig?.payee_name || ''}
                      onChange={e => { setPaymentConfig({ ...paymentConfig, payee_name: e.target.value }); setIsDirty(true); }}
                      className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 5: CREDIT RULES */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'credit' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Farmer Khata & Credit Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creditConfig?.allow_credit_sales ?? true}
                    onChange={e => setCreditConfig({ ...creditConfig, allow_credit_sales: e.target.checked })}
                    className="rounded text-[#064E3B]"
                  />
                  <span className="font-bold text-gray-800">Allow Credit Sales</span>
                </label>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Default Credit Due Days</label>
                  <input
                    type="number"
                    value={creditConfig?.default_due_period_days || 15}
                    onChange={e => setCreditConfig({ ...creditConfig, default_due_period_days: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 6: USERS & ROLES */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Users & Access Control</h3>
                  <p className="text-xs text-gray-500">Manage staff login accounts and role permissions</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#064E3B] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add User</span>
                </button>
              </div>

              {/* USERS TABLE */}
              <div className="rounded-2xl bg-white/90 border border-gray-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Email / Mobile</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Last Login</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {(users || []).map(u => (
                      <tr key={u.id}>
                        <td className="p-3 font-bold text-gray-900">{u.name}</td>
                        <td className="p-3 text-gray-600 font-mono">{u.email}</td>
                        <td className="p-3 font-bold text-[#064E3B]">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              const success = await updateUserRoleInSupabase(u.id, newRole);
                              if (success) {
                                setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
                                alert(`Updated role for ${u.name} to ${newRole}`);
                              }
                            }}
                            className="p-1 rounded-lg border border-gray-300 font-bold text-xs bg-white text-[#064E3B]"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Shopkeeper / Staff">Shopkeeper / Staff</option>
                            <option value="Staff">Staff</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="p-3 text-gray-500">{u.last_login}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => alert(`Editing permissions for ${u.name}...`)} className="text-xs text-blue-600 hover:underline font-bold">
                            Edit Permissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 7: INVENTORY RULES */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'inventory' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Inventory Stock Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'batch_tracking_enabled', label: 'Batch Level Stock Tracking' },
                  { key: 'fefo_billing_enabled', label: 'FEFO Expiry First Billing' },
                  { key: 'prevent_expired_sale', label: 'Prevent Expired Stock Billing' },
                  { key: 'allow_negative_stock', label: 'Allow Negative Stock Sales' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={inventoryConfig?.[item.key] ?? true}
                      onChange={e => setInventoryConfig({ ...inventoryConfig, [item.key]: e.target.checked })}
                      className="rounded text-[#064E3B]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 8: AI PREFERENCES */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'ai' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">AI Insights & Forecasting Engine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'sales_forecast_enabled', label: 'Sales Demand Forecasting' },
                  { key: 'smart_reorder_enabled', label: 'Smart Auto Reorder Suggestions' },
                  { key: 'seasonal_insights_enabled', label: 'Seasonal Crop Insights' },
                  { key: 'farmer_recommendations_enabled', label: 'Farmer Crop Recommendations' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={aiConfig?.[item.key] ?? true}
                      onChange={e => setAiConfig({ ...aiConfig, [item.key]: e.target.checked })}
                      className="rounded text-[#064E3B]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 9: LOCALIZATION */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'localization' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Localization & Regional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Default Currency</label>
                  <input type="text" readOnly value="Indian Rupee (₹ INR)" className="w-full p-2.5 rounded-xl border bg-gray-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Timezone</label>
                  <input type="text" readOnly value="Asia/Kolkata (IST +5:30)" className="w-full p-2.5 rounded-xl border bg-gray-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Date Format</label>
                  <input type="text" readOnly value="DD/MM/YYYY" className="w-full p-2.5 rounded-xl border bg-gray-50 font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 10: BACKUP & DATA */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'backup' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Database Backup & Export</h3>
              <div className="flex gap-3">
                <button onClick={() => alert('Database backup exported to JSON file!')} className="px-4 py-2 rounded-xl bg-[#064E3B] text-white font-bold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download Complete Backup</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 11: SECURITY */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Security & Access Log</h3>
              <div className="p-4 rounded-xl bg-gray-50 border space-y-2">
                <h4 className="font-bold text-gray-900">Recent Admin Logins</h4>
                <div className="space-y-1 font-mono text-[11px] text-gray-600">
                  {initialLoginActivityLogs.map((log, idx) => (
                    <div key={idx} className="flex justify-between border-b pb-1">
                      <span>{log.user} ({log.ip})</span>
                      <span>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ------------------------------------------------------------------------- */}
          {/* TAB 12: SYSTEM INFO & DANGER ZONE */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs space-y-3 text-xs">
                <h3 className="font-extrabold text-base text-[#064E3B] font-['Outfit'] border-b pb-2">Smart AgroMart Application System Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-medium text-gray-700">
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Application</span><span className="font-bold">Smart AgroMart</span></div>
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Version</span><span className="font-bold">v1.0.0 Enterprise</span></div>
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Frontend Engine</span><span className="font-bold">React 18 + Vite 5</span></div>
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Styling</span><span className="font-bold">Tailwind CSS</span></div>
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Data Mode</span><span className="font-bold text-emerald-700">Synchronized ERP Service</span></div>
                  <div><span className="text-gray-400 block text-[10px] uppercase font-bold">AI Engine</span><span className="font-bold text-purple-700">Rule-Based Forecasting</span></div>
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs space-y-3 text-xs">
                <h3 className="font-extrabold text-base text-rose-800 font-['Outfit'] border-b border-rose-200 pb-2">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-900 block">Reset Demo Data</span>
                    <span className="text-rose-700 text-[11px]">Restores default initial products, stock batches, and farmer accounts</span>
                  </div>
                  <button
                    onClick={() => setIsResetDemoOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Reset Demo Data
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD USER MODAL */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveNewUser} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">+ Register New Staff / User</h3>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Full Name*</label>
              <input
                required
                type="text"
                placeholder="e.g. Ramesh Deshmukh"
                value={newUserForm.name}
                onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Username*</label>
                <input
                  required
                  type="text"
                  placeholder="ramesh.staff"
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Role*</label>
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Shopkeeper / Staff">Shopkeeper / Staff</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Password*</label>
                <input
                  required
                  type="password"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Confirm Password*</label>
                <input
                  required
                  type="password"
                  value={newUserForm.confirm_password}
                  onChange={e => setNewUserForm({ ...newUserForm, confirm_password: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET DEMO DATA CONFIRMATION */}
      {/* ========================================================================= */}
      {isResetDemoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-rose-900 font-['Outfit']">Reset All Demo Records?</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                This will restore original Smart AgroMart demo records for Products, Batches, Farmers, and Settings.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2 text-xs font-bold">
              <button
                onClick={() => setIsResetDemoOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  setIsResetDemoOpen(false);
                  alert('Demo data reset successfully! Page will reload.');
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
