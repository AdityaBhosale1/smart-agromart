import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, CheckCircle2, Info, ArrowRight, 
  Search, Filter, RefreshCw, Check, ShieldAlert, Clock, Package, 
  CreditCard, Sparkles, DollarSign, Settings, Sliders, ChevronRight, 
  X, ExternalLink, Zap, Mail, Smartphone, Eye, EyeOff, RotateCcw, Trash2,
  FileText, Users, ShoppingBag
} from 'lucide-react';

import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  refreshAgromartAlerts,
  defaultNotificationSettings 
} from '../services/notificationService';

export const Notifications = () => {
  // Notifications & Loading State
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active View Feed Tab: 'all' | 'unread' | 'resolved' | 'archived'
  const [activeTab, setActiveTab] = useState('all');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');

  // Selection & Modals State
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null); // Side Drawer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Live Notifications
  const loadLiveNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error('Error fetching live notifications:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveNotifications();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAgromartAlerts();
    await loadLiveNotifications();
  };

  // =========================================================================
  // CALCULATED KPI METRICS
  // =========================================================================
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read && !n.is_archived).length;
  }, [notifications]);

  const criticalCount = useMemo(() => {
    return notifications.filter(n => n.priority === 'CRITICAL' && !n.is_resolved).length;
  }, [notifications]);

  const lowStockAlertsCount = useMemo(() => {
    return notifications.filter(n => n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK').length;
  }, [notifications]);

  const expiryAlertsCount = useMemo(() => {
    return notifications.filter(n => n.category === 'Expiry').length;
  }, [notifications]);

  const overduePaymentsCount = useMemo(() => {
    return notifications.filter(n => n.type === 'CREDIT_OVERDUE').length;
  }, [notifications]);

  const aiRecommendationsCount = useMemo(() => {
    return notifications.filter(n => n.category === 'AI').length;
  }, [notifications]);

  // =========================================================================
  // FILTERED NOTIFICATIONS
  // =========================================================================
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Feed Tab Filter
      if (activeTab === 'unread' && (n.is_read || n.is_archived)) return false;
      if (activeTab === 'resolved' && (!n.is_resolved || n.is_archived)) return false;
      if (activeTab === 'archived' && !n.is_archived) return false;
      if (activeTab === 'all' && n.is_archived) return false;

      // Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.entity_name && n.entity_name.toLowerCase().includes(q));

      // Dropdown Filters
      const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter;
      const matchesPriority = priorityFilter === 'All' || n.priority === priorityFilter;

      let matchesStatus = true;
      if (statusFilter === 'Unread') matchesStatus = !n.is_read;
      if (statusFilter === 'Read') matchesStatus = n.is_read;
      if (statusFilter === 'Resolved') matchesStatus = n.is_resolved;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [notifications, activeTab, searchQuery, categoryFilter, priorityFilter, statusFilter]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleMarkAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    await markAsRead(id);
  };

  const handleMarkAsUnread = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: false } : n));
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    await markAllAsRead();
  };

  const handleDelete = async (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    await deleteNotification(id);
  };

  const handleResolve = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_resolved: true, is_read: true } : n));
  };

  const handleArchive = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_archived: true } : n));
  };

  // Bulk Handlers
  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleBulkMarkRead = () => {
    setNotifications(notifications.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n));
    setSelectedIds([]);
  };

  const handleBulkResolve = () => {
    setNotifications(notifications.map(n => selectedIds.includes(n.id) ? { ...n, is_resolved: true, is_read: true } : n));
    setSelectedIds([]);
  };

  const handleBulkArchive = () => {
    setNotifications(notifications.map(n => selectedIds.includes(n.id) ? { ...n, is_archived: true } : n));
    setSelectedIds([]);
  };

  return (
    <div className="space-y-5 pb-8 font-sans">

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 border border-gray-200 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shadow-md shadow-[#064E3B]/20 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#064E3B] font-['Outfit'] tracking-tight">Notifications & Smart Alerts</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                Unread: {unreadCount}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                Critical: {criticalCount}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Stay updated on stock, expiry, payments, credit, purchases and AI recommendations
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <button
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Settings className="w-4 h-4 text-emerald-300" />
            <span>Notification Settings</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ALERT SUMMARY CARDS (6 COMPACT CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Unread Notifications (Blue) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">Unread Alerts</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-blue-950 font-['Outfit']">{unreadCount}</h3>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Requires attention</span>
          </div>
        </div>

        {/* Card 2: Critical Alerts (Red) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider">Critical Alerts</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-rose-950 font-['Outfit']">{criticalCount}</h3>
            <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">Immediate action</span>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts (Orange) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-orange-900 uppercase tracking-wider">Low Stock</span>
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-orange-950 font-['Outfit']">{lowStockAlertsCount}</h3>
            <span className="text-[10px] text-orange-700 font-semibold mt-0.5 block">Below threshold</span>
          </div>
        </div>

        {/* Card 4: Expiry Alerts (Yellow) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">Expiry Warning</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-amber-950 font-['Outfit']">{expiryAlertsCount}</h3>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">&lt; 30 days batches</span>
          </div>
        </div>

        {/* Card 5: Overdue Payments (Purple/Red) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">Overdue Dues</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-purple-950 font-['Outfit']">{overduePaymentsCount}</h3>
            <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">Past due limit</span>
          </div>
        </div>

        {/* Card 6: AI Recommendations (Green) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">AI Insights</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg font-extrabold text-[#064E3B] font-['Outfit']">{aiRecommendationsCount}</h3>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Smart advisories</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER BAR AND SEARCH */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Field */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
            >
              <option value="All">Type: All Types</option>
              <option value="Inventory">Inventory</option>
              <option value="Expiry">Expiry</option>
              <option value="Credit">Credit</option>
              <option value="Payments">Payments</option>
              <option value="Purchases">Purchases</option>
              <option value="AI">AI Insights</option>
              <option value="System">System</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
            >
              <option value="All">Priority: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

        </div>

        {/* Filter Reset Row & Feed Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 font-bold">
            {[
              { id: 'all', label: 'All Feed' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'resolved', label: 'Resolved' },
              { id: 'archived', label: 'Archived' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === t.id ? 'bg-[#064E3B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setPriorityFilter('All');
              setStatusFilter('All');
              setDateFilter('All Time');
            }}
            className="text-xs text-[#15803D] hover:underline font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BULK SELECTION BAR (IF SELECTED) */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#064E3B] text-white flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{selectedIds.length} Notification(s) Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkRead}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              Mark Read
            </button>
            <button
              onClick={handleBulkResolve}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Resolve
            </button>
            <button
              onClick={handleBulkArchive}
              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              Archive
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NOTIFICATION FEED LIST */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/90 border border-gray-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">All caught up!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
              No active notifications matching your filters. Smart AgroMart is running smoothly.
            </p>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                !n.is_read
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-white/90 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(n.id)}
                  onChange={() => handleToggleSelect(n.id)}
                  className="mt-1 rounded border-gray-300 text-[#064E3B] focus:ring-[#15803D]"
                />

                {/* Type Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  n.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                  n.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                  n.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {n.category === 'Inventory' && <Package className="w-5 h-5" />}
                  {n.category === 'Expiry' && <Clock className="w-5 h-5" />}
                  {n.category === 'Credit' && <CreditCard className="w-5 h-5" />}
                  {n.category === 'Payments' && <DollarSign className="w-5 h-5" />}
                  {n.category === 'Purchases' && <ShoppingBag className="w-5 h-5" />}
                  {n.category === 'AI' && <Sparkles className="w-5 h-5" />}
                  {n.category === 'System' && <Info className="w-5 h-5" />}
                </div>

                {/* Content Details */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 
                      onClick={() => setSelectedNotification(n)}
                      className="font-extrabold text-sm text-gray-900 font-['Outfit'] cursor-pointer hover:text-[#064E3B] hover:underline"
                    >
                      {n.title}
                    </h4>

                    {/* Priority Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      n.priority === 'CRITICAL' ? 'bg-rose-600 text-white' :
                      n.priority === 'HIGH' ? 'bg-amber-500 text-white' :
                      n.priority === 'MEDIUM' ? 'bg-blue-600 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      {n.priority}
                    </span>

                    {/* Status Badges */}
                    {n.is_resolved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        Resolved
                      </span>
                    )}

                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" title="Unread" />
                    )}
                  </div>

                  <p className="text-gray-700 text-xs leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <span>{n.created_at}</span>
                    <span>•</span>
                    <span>Category: {n.category}</span>
                    {n.entity_name && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-gray-600">{n.entity_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-200">
                {n.action_label && (
                  <button
                    onClick={() => {
                      alert(`Navigating to ${n.action_url} for ${n.title}...`);
                      handleMarkAsRead(n.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span>{n.action_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {!n.is_resolved && (
                  <button
                    onClick={() => handleResolve(n.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 font-bold text-xs transition-colors"
                  >
                    Resolve
                  </button>
                )}

                <button
                  onClick={() => setSelectedNotification(n)}
                  className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="View Notification Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NOTIFICATION SETTINGS MODAL */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">Notification Preferences</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 font-medium text-gray-800">
              <div className="flex items-center justify-between">
                <span>Inventory Low Stock Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.inventory_alerts}
                  onChange={e => setSettings({ ...settings, inventory_alerts: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Expiry Warnings (&lt; 30 Days)</span>
                <input
                  type="checkbox"
                  checked={settings.expiry_alerts}
                  onChange={e => setSettings({ ...settings, expiry_alerts: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Farmer Credit & Overdue Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.credit_alerts}
                  onChange={e => setSettings({ ...settings, credit_alerts: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Supplier Payable Reminders</span>
                <input
                  type="checkbox"
                  checked={settings.supplier_alerts}
                  onChange={e => setSettings({ ...settings, supplier_alerts: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>AI Insights & Demand Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.ai_insights_alerts}
                  onChange={e => setSettings({ ...settings, ai_insights_alerts: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>POS Bill Generation Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.bill_notifications}
                  onChange={e => setSettings({ ...settings, bill_notifications: e.target.checked })}
                  className="rounded text-[#064E3B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  alert('Notification settings updated successfully!');
                }}
                className="px-5 py-2 rounded-xl bg-[#064E3B] text-white font-bold"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 1: NOTIFICATION DETAILS DRAWER */}
      {/* ========================================================================= */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-gray-200 space-y-4 overflow-y-auto custom-scrollbar text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B] font-['Outfit']">{selectedNotification.title}</h3>
                <span className="text-gray-400 text-[10px]">{selectedNotification.timestamp}</span>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-gray-800">
              <div className="flex justify-between font-bold">
                <span>Priority:</span>
                <span className="text-rose-700">{selectedNotification.priority}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>{selectedNotification.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>{selectedNotification.is_resolved ? 'Resolved' : 'Active'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-gray-900">Message & Alert Details</h4>
              <p className="text-gray-700 leading-relaxed p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 font-medium">
                {selectedNotification.message}
              </p>
            </div>

            {selectedNotification.action_label && (
              <button
                onClick={() => {
                  alert(`Navigating to ${selectedNotification.action_url}...`);
                  setSelectedNotification(null);
                }}
                className="w-full py-3 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>{selectedNotification.action_label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notifications;
