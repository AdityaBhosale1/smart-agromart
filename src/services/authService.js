import { supabase } from '../lib/supabase';
import { logAuditEvent } from './auditService';

export const authService = {
  /**
   * Login using strictly Supabase Auth (signInWithPassword).
   * No demo credentials or offline fallback bypass.
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      throw new Error(error?.message || 'Invalid login credentials. Please check your email and password.');
    }

    const user = data.user;
    let profile = null;

    try {
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = profData;
    } catch (e) {
      console.warn('Profile fetch warning during login:', e);
    }

    const userPayload = {
      id: user.id,
      name: profile?.name || user.user_metadata?.name || user.email.split('@')[0],
      email: user.email,
      role: profile?.role || 'Admin',
      avatar_url: profile?.avatar_url || null,
    };

    try {
      await logAuditEvent('LOGIN', 'USER', userPayload.id, `User [${userPayload.email}] logged in successfully.`);
    } catch (e) {}

    return userPayload;
  },

  /**
   * Logout from Supabase Auth
   */
  async logout() {
    try {
      await logAuditEvent('LOGOUT', 'USER', null, 'User logged out.');
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
  },

  /**
   * Get active Supabase Auth session
   */
  async getSession() {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get current authenticated user and matching profile from 'profiles' table.
   * Returns null if no valid Supabase session exists.
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        role: profile?.role || 'Admin',
        avatar_url: profile?.avatar_url || null,
      };
    } catch (error) {
      console.warn('Error fetching current user from Supabase:', error);
      return null;
    }
  },

  /**
   * Subscribe to Supabase auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default authService;
