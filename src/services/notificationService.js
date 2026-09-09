// Smart AgroMart Centralized Notification & Smart Alert Service
// Unified live alert engine for Inventory, Expiry, Credit, Purchases, Supplier Payments, and Business Events
import { supabase } from '../lib/supabase';

// Local storage backup key for cached notifications when offline/permission restricted
const LOCAL_NOTIFS_KEY = 'agromart_live_notifications_cache';

// Initial fallback notifications array for backwards compatibility
export const initialNotifications = [
  {
    id: 'NOTIF-1001',
    type: 'LOW_STOCK',
    category: 'Inventory',
    priority: 'CRITICAL',
    title: 'Urea Stock Running Low',
    message: 'Current Stock: 8 Bags. Predicted 30-Day Demand: 42 Bags. Recommended Reorder: 40 Bags.',
    entity_type: 'Product',
    entity_id: 'P102',
    entity_name: 'Urea Fertilizer 45kg',
    action_url: 'purchase',
    action_label: 'Create Purchase',
    is_read: false,
    is_resolved: false,
    is_archived: false,
    created_at: '2 hours ago',
    timestamp: '2026-09-08 08:30 AM'
  }
];

// Load cached local notifications if any
function getLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCache(list) {
  try {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Evaluates live Supabase business data and generates required alerts safely with zero duplication.
 */
export async function refreshAgromartAlerts() {
  try {
    const generatedAlerts = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Fetch live data from Supabase master tables
    const { data: products } = await supabase.from('products').select('*');
    const { data: batches } = await supabase.from('product_batches').select('*');
    const { data: farmers } = await supabase.from('farmers').select('*');
    const { data: bills } = await supabase.from('bills').select('*');
    const { data: suppliers } = await supabase.from('suppliers').select('*');

    // -------------------------------------------------------------------------
    // A. LOW STOCK & OUT OF STOCK ALERTS
    // -------------------------------------------------------------------------
    if (products && products.length > 0) {
      // Group valid non-expired batch quantities per product
      const productStockMap = {};
      (batches || []).forEach(b => {
        const isNonExpired = !b.expiry_date || b.expiry_date >= todayStr;
        const qty = Number(b.current_quantity) || 0;
        if (isNonExpired && qty > 0) {
          productStockMap[b.product_id] = (productStockMap[b.product_id] || 0) + qty;
        }
      });

      products.forEach(p => {
        const availableStock = productStockMap[p.id] || 0;
        const minAlert = Number(p.min_stock_alert) || 10;
        const unitStr = p.unit || 'Bags';

        if (availableStock === 0) {
          generatedAlerts.push({
            id: `NOTIF-OOS-${p.id}`,
            dedup_key: `OUT_OF_STOCK_PROD_${p.id}`,
            type: 'OUT_OF_STOCK',
            category: 'Inventory',
            priority: 'CRITICAL',
            severity: 'critical',
            title: `Out of Stock: ${p.name}`,
            message: `${p.name} has reached 0 ${unitStr} stock during active operations.`,
            entity_type: 'Product',
            entity_id: String(p.id),
            entity_name: p.name,
            reference_type: 'Product',
            reference_id: String(p.id),
            action_url: 'purchase',
            action_label: 'Reorder Product',
            is_read: false,
            is_resolved: false,
            is_archived: false,
            created_at: 'Just now',
            timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          });
        } else if (availableStock <= minAlert) {
          generatedAlerts.push({
            id: `NOTIF-LOW-${p.id}`,
            dedup_key: `LOW_STOCK_PROD_${p.id}`,
            type: 'LOW_STOCK',
            category: 'Inventory',
            priority: 'HIGH',
            severity: 'warning',
            title: `Low Stock Alert: ${p.name}`,
            message: `${p.name} has only ${availableStock} ${unitStr} remaining (Below threshold of ${minAlert} ${unitStr}).`,
            entity_type: 'Product',
            entity_id: String(p.id),
            entity_name: p.name,
            reference_type: 'Product',
            reference_id: String(p.id),
            action_url: 'purchase',
            action_label: 'Create Purchase',
            is_read: false,
            is_resolved: false,
            is_archived: false,
            created_at: 'Just now',
            timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // B. EXPIRY ALERTS
    // -------------------------------------------------------------------------
    if (batches && batches.length > 0) {
      batches.forEach(b => {
        const qty = Number(b.current_quantity) || 0;
        if (qty > 0 && b.expiry_date) {
          const prodName = b.products?.name || b.batch_number || 'Product';
          const pCost = Number(b.purchase_price) || 0;
          const valueAtRisk = qty * pCost;
          const diffMs = new Date(b.expiry_date) - today;
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (daysLeft < 0) {
            generatedAlerts.push({
              id: `NOTIF-EXP-${b.id}-EXPIRED`,
              dedup_key: `EXPIRY_BATCH_${b.id}_EXPIRED`,
              type: 'EXPIRY_WARNING',
              category: 'Expiry',
              priority: 'CRITICAL',
              severity: 'critical',
              title: `Batch Expired: ${prodName}`,
              message: `Batch ${b.batch_number} (${qty} units) expired on ${b.expiry_date}. Value at risk: ₹${valueAtRisk.toLocaleString('en-IN')}.`,
              entity_type: 'Batch',
              entity_id: String(b.id),
              entity_name: `${prodName} (${b.batch_number})`,
              reference_type: 'Batch',
              reference_id: String(b.id),
              action_url: 'inventory',
              action_label: 'Inspect Batch',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Just now',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (daysLeft <= 7) {
            generatedAlerts.push({
              id: `NOTIF-EXP-${b.id}-7D`,
              dedup_key: `EXPIRY_BATCH_${b.id}_7D`,
              type: 'EXPIRY_WARNING',
              category: 'Expiry',
              priority: 'HIGH',
              severity: 'warning',
              title: `Critical Expiry Warning: ${prodName}`,
              message: `Batch ${b.batch_number} (${qty} units) expires in ${daysLeft} day(s) on ${b.expiry_date}. Value at risk: ₹${valueAtRisk.toLocaleString('en-IN')}.`,
              entity_type: 'Batch',
              entity_id: String(b.id),
              entity_name: `${prodName} (${b.batch_number})`,
              reference_type: 'Batch',
              reference_id: String(b.id),
              action_url: 'inventory',
              action_label: 'View Stock',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Just now',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (daysLeft <= 15) {
            generatedAlerts.push({
              id: `NOTIF-EXP-${b.id}-15D`,
              dedup_key: `EXPIRY_BATCH_${b.id}_15D`,
              type: 'EXPIRY_WARNING',
              category: 'Expiry',
              priority: 'MEDIUM',
              severity: 'info',
              title: `Expiry Warning: ${prodName}`,
              message: `Batch ${b.batch_number} (${qty} units) expires in ${daysLeft} days on ${b.expiry_date}. Value at risk: ₹${valueAtRisk.toLocaleString('en-IN')}.`,
              entity_type: 'Batch',
              entity_id: String(b.id),
              entity_name: `${prodName} (${b.batch_number})`,
              reference_type: 'Batch',
              reference_id: String(b.id),
              action_url: 'inventory',
              action_label: 'View Stock',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Today',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (daysLeft <= 30) {
            generatedAlerts.push({
              id: `NOTIF-EXP-${b.id}-30D`,
              dedup_key: `EXPIRY_BATCH_${b.id}_30D`,
              type: 'EXPIRY_WARNING',
              category: 'Expiry',
              priority: 'LOW',
              severity: 'info',
              title: `Expiry Advisory: ${prodName}`,
              message: `Batch ${b.batch_number} (${qty} units) expires in ${daysLeft} days on ${b.expiry_date}. Value at risk: ₹${valueAtRisk.toLocaleString('en-IN')}.`,
              entity_type: 'Batch',
              entity_id: String(b.id),
              entity_name: `${prodName} (${b.batch_number})`,
              reference_type: 'Batch',
              reference_id: String(b.id),
              action_url: 'inventory',
              action_label: 'View Stock',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Today',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // C. FARMER CREDIT DUE & OVERDUE ALERTS
    // -------------------------------------------------------------------------
    if (bills && bills.length > 0) {
      bills.forEach(bill => {
        const pending = Number(bill.pending_amount) || 0;
        if (pending > 0 && bill.due_date) {
          const dueDateObj = new Date(bill.due_date);
          const diffMs = today - dueDateObj;
          const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const dueStr = bill.due_date.split('T')[0];

          if (daysOverdue > 0) {
            const prio = daysOverdue > 15 ? 'CRITICAL' : 'HIGH';
            generatedAlerts.push({
              id: `NOTIF-OVERDUE-${bill.id}`,
              dedup_key: `CREDIT_OVERDUE_${bill.id}`,
              type: 'CREDIT_OVERDUE',
              category: 'Credit',
              priority: prio,
              severity: prio === 'CRITICAL' ? 'critical' : 'warning',
              title: `Farmer Payment Overdue: ${bill.farmer_name}`,
              message: `${bill.farmer_name} pending credit ₹${pending.toLocaleString('en-IN')} on invoice ${bill.invoice_number} was due on ${dueStr} (${daysOverdue} days overdue).`,
              entity_type: 'Bill',
              entity_id: String(bill.id),
              entity_name: bill.farmer_name,
              reference_type: 'Bill',
              reference_id: String(bill.id),
              action_url: 'credit',
              action_label: 'Collect Payment',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Just now',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (daysOverdue >= -3) {
            generatedAlerts.push({
              id: `NOTIF-DUESOON-${bill.id}`,
              dedup_key: `CREDIT_DUESOON_${bill.id}`,
              type: 'CREDIT_DUE_SOON',
              category: 'Credit',
              priority: 'MEDIUM',
              severity: 'info',
              title: `Farmer Payment Due Soon: ${bill.farmer_name}`,
              message: `${bill.farmer_name} pending credit ₹${pending.toLocaleString('en-IN')} on invoice ${bill.invoice_number} is due on ${dueStr}.`,
              entity_type: 'Bill',
              entity_id: String(bill.id),
              entity_name: bill.farmer_name,
              reference_type: 'Bill',
              reference_id: String(bill.id),
              action_url: 'credit',
              action_label: 'View Credit',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Today',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // D. CREDIT LIMIT ALERTS
    // -------------------------------------------------------------------------
    if (farmers && farmers.length > 0) {
      farmers.forEach(f => {
        const pending = Number(f.pending_credit) || 0;
        const limit = Number(f.credit_limit) || 0;

        if (limit > 0 && pending > 0) {
          if (pending >= limit) {
            generatedAlerts.push({
              id: `NOTIF-LIMIT-EXCEEDED-${f.id}`,
              dedup_key: `CREDIT_LIMIT_EXCEEDED_${f.id}`,
              type: 'CREDIT_LIMIT',
              category: 'Credit',
              priority: 'CRITICAL',
              severity: 'critical',
              title: `Credit Limit Exceeded: ${f.name}`,
              message: `${f.name} pending credit (₹${pending.toLocaleString('en-IN')}) has reached or exceeded credit limit (₹${limit.toLocaleString('en-IN')}).`,
              entity_type: 'Farmer',
              entity_id: String(f.id),
              entity_name: f.name,
              reference_type: 'Farmer',
              reference_id: String(f.id),
              action_url: 'credit',
              action_label: 'Review Account',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Just now',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (pending >= 0.8 * limit) {
            const pct = Math.round((pending / limit) * 100);
            generatedAlerts.push({
              id: `NOTIF-LIMIT-WARN-${f.id}`,
              dedup_key: `CREDIT_LIMIT_WARN_${f.id}`,
              type: 'CREDIT_LIMIT',
              category: 'Credit',
              priority: 'HIGH',
              severity: 'warning',
              title: `Credit Limit Warning: ${f.name}`,
              message: `${f.name} pending credit (₹${pending.toLocaleString('en-IN')}) has reached ${pct}% of credit limit (₹${limit.toLocaleString('en-IN')}).`,
              entity_type: 'Farmer',
              entity_id: String(f.id),
              entity_name: f.name,
              reference_type: 'Farmer',
              reference_id: String(f.id),
              action_url: 'credit',
              action_label: 'View Credit',
              is_read: false,
              is_resolved: false,
              is_archived: false,
              created_at: 'Today',
              timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // E. SUPPLIER PAYABLE ALERTS
    // -------------------------------------------------------------------------
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(s => {
        const payable = Number(s.pending_payable !== undefined ? s.pending_payable : s.pending_payment) || 0;
        if (payable > 0) {
          generatedAlerts.push({
            id: `NOTIF-SUP-${s.id}`,
            dedup_key: `SUPPLIER_PAYABLE_${s.id}`,
            type: 'SUPPLIER_PAYABLE',
            category: 'Payments',
            priority: 'MEDIUM',
            severity: 'info',
            title: `Supplier Payment Due: ${s.name}`,
            message: `Pending payment of ₹${payable.toLocaleString('en-IN')} is payable to ${s.name}.`,
            entity_type: 'Supplier',
            entity_id: String(s.id),
            entity_name: s.name,
            reference_type: 'Supplier',
            reference_id: String(s.id),
            action_url: 'purchase',
            action_label: 'Record Payment',
            is_read: false,
            is_resolved: false,
            is_archived: false,
            created_at: 'Today',
            timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // DEDUPLICATION & MERGE ENGINE
    // -------------------------------------------------------------------------
    const existingCache = getLocalCache();
    const existingMap = {};
    existingCache.forEach(n => {
      if (n.dedup_key || n.id) {
        existingMap[n.dedup_key || n.id] = n;
      }
    });

    // Merge new alerts without duplicating read/resolved state
    generatedAlerts.forEach(alert => {
      const key = alert.dedup_key || alert.id;
      if (!existingMap[key]) {
        existingMap[key] = alert;
      } else {
        // Keep user read/resolved status if already acknowledged
        existingMap[key] = {
          ...alert,
          is_read: existingMap[key].is_read,
          is_resolved: existingMap[key].is_resolved,
          is_archived: existingMap[key].is_archived
        };
      }
    });

    const finalAlertList = Object.values(existingMap);
    saveLocalCache(finalAlertList);

    // Sync to Supabase `notifications` table if database connection permits
    try {
      const { data: dbNotifs } = await supabase.from('notifications').select('*');
      if (dbNotifs) {
        const dbKeys = new Set(dbNotifs.map(n => n.title));
        const notifsToInsert = generatedAlerts
          .filter(a => !dbKeys.has(a.title))
          .map(a => ({
            title: a.title,
            message: a.message,
            category: a.category,
            severity: a.severity || 'info',
            is_read: a.is_read
          }));

        if (notifsToInsert.length > 0) {
          await supabase.from('notifications').insert(notifsToInsert);
        }
      }
    } catch (dbErr) {
      // Graceful fallback to client-side deduplication cache
    }

    return finalAlertList;
  } catch (err) {
    console.error('Error in refreshAgromartAlerts:', err);
    return getLocalCache();
  }
}

/**
 * Fetches all live notifications with optional filters.
 */
export async function getNotifications(filters = {}) {
  try {
    let list = await refreshAgromartAlerts();

    // Also attempt reading directly from Supabase notifications table
    const { data: dbRows, error: dbErr } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dbErr && dbRows && dbRows.length > 0) {
      const dbFormatted = dbRows.map(n => ({
        id: `NOTIF-DB-${n.id}`,
        type: n.category === 'STOCK' ? 'LOW_STOCK' : (n.category === 'EXPIRY' ? 'EXPIRY_WARNING' : 'SYSTEM'),
        category: n.category === 'STOCK' ? 'Inventory' : (n.category === 'EXPIRY' ? 'Expiry' : (n.category === 'CREDIT' ? 'Credit' : 'System')),
        priority: n.severity === 'critical' ? 'CRITICAL' : (n.severity === 'warning' ? 'HIGH' : 'MEDIUM'),
        severity: n.severity || 'info',
        title: n.title,
        message: n.message,
        reference_type: 'System',
        reference_id: String(n.id),
        is_read: !!n.is_read,
        is_resolved: false,
        is_archived: false,
        created_at: n.created_at ? new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        timestamp: n.created_at || new Date().toISOString()
      }));

      // Combine DB rows with dynamically evaluated alerts (unique by title)
      const titleSet = new Set(list.map(l => l.title));
      dbFormatted.forEach(dbN => {
        if (!titleSet.has(dbN.title)) {
          list.unshift(dbN);
        }
      });
    }

    // Apply Filters
    const { category, priority, status } = filters;
    if (category && category !== 'All') {
      list = list.filter(n => n.category?.toLowerCase() === category.toLowerCase());
    }
    if (priority && priority !== 'All') {
      list = list.filter(n => n.priority?.toUpperCase() === priority.toUpperCase());
    }
    if (status) {
      if (status === 'Unread') list = list.filter(n => !n.is_read);
      if (status === 'Read') list = list.filter(n => n.is_read);
      if (status === 'Resolved') list = list.filter(n => n.is_resolved);
    }

    return list;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return getLocalCache();
  }
}

/**
 * Returns count of unread notifications.
 */
export async function getUnreadCount() {
  try {
    const list = await getNotifications();
    return list.filter(n => !n.is_read && !n.is_archived).length;
  } catch (e) {
    return 0;
  }
}

/**
 * Marks a specific notification as read in Supabase & local cache.
 */
export async function markAsRead(id) {
  try {
    const cache = getLocalCache();
    const updated = cache.map(n => (n.id === id || String(n.id) === String(id)) ? { ...n, is_read: true } : n);
    saveLocalCache(updated);

    if (String(id).startsWith('NOTIF-DB-')) {
      const realDbId = id.replace('NOTIF-DB-', '');
      await supabase.from('notifications').update({ is_read: true }).eq('id', realDbId);
    }
    return true;
  } catch (err) {
    console.error('Error in markAsRead:', err);
    return false;
  }
}

/**
 * Marks all notifications as read.
 */
export async function markAllAsRead() {
  try {
    const cache = getLocalCache();
    const updated = cache.map(n => ({ ...n, is_read: true }));
    saveLocalCache(updated);

    await supabase.from('notifications').update({ is_read: true }).neq('id', 0);
    return true;
  } catch (err) {
    console.error('Error in markAllAsRead:', err);
    return false;
  }
}

/**
 * Deletes a notification by ID.
 */
export async function deleteNotification(id) {
  try {
    const cache = getLocalCache();
    const updated = cache.filter(n => n.id !== id && String(n.id) !== String(id));
    saveLocalCache(updated);

    if (String(id).startsWith('NOTIF-DB-')) {
      const realDbId = id.replace('NOTIF-DB-', '');
      await supabase.from('notifications').delete().eq('id', realDbId);
    }
    return true;
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    return false;
  }
}

export const defaultNotificationSettings = {
  inventory_alerts: true,
  expiry_alerts: true,
  credit_alerts: true,
  supplier_alerts: true,
  ai_insights_alerts: true,
  bill_notifications: false,
  purchase_notifications: true,
  channel_inapp: true,
  channel_whatsapp: true,
  channel_email: false,
  expiry_threshold_days: 30,
  credit_due_reminder_days: 3
};

