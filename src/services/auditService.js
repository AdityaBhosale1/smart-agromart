import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Log an audit event in Supabase audit_logs
 * @param {string} action - Action name (e.g. LOGIN, BILL_CREATED, SETTINGS_CHANGED, ROLE_CHANGED)
 * @param {string} entityType - Entity type (e.g. BILL, PRODUCT, FARMER, SETTINGS, PROFILE)
 * @param {string} entityId - Entity ID or key
 * @param {string} description - Detailed human-readable log description
 * @param {object} metadata - Additional context JSON
 */
export async function logAuditEvent(action, entityType = null, entityId = null, description = '', metadata = {}) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Try secure RPC log_audit_event first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: String(entityId || ''),
      p_description: description,
      p_metadata: metadata
    });

    if (!rpcErr) return rpcData;

    // 2. Direct insert fallback if RPC not present in DB
    const { data, error } = await supabase.from('audit_logs').insert([{
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      description,
      metadata,
      created_at: new Date().toISOString()
    }]);

    if (error) {
      console.warn('Audit log insert note:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Audit logging exception:', err.message);
    return null;
  }
}

/**
 * Fetch audit logs for Admin / Auditor view
 */
export async function getAuditLogs(limit = 100) {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Unable to fetch audit logs:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error fetching audit logs:', err.message);
    return [];
  }
}
