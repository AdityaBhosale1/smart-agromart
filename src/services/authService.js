import { supabase } from '../lib/supabase';
import { logAuditEvent } from './auditService';

export const authService = {
  /**
   * Login using Supabase Auth
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
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
      console.warn('Profile fetch warning:', e);
    }

    const userPayload = {
      id: user.id,
      name: profile?.name || user.user_metadata?.name || user.email.split('@')[0],
      email: user.email,
      role: profile?.role || 'Staff',
      avatar_url: profile?.avatar_url || null,
    };

    localStorage.setItem('agromart_user', JSON.stringify(userPayload));
    await logAuditEvent('LOGIN', 'USER', user.id, `User [${user.email}] logged in successfully.`);
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
    localStorage.removeItem('agromart_user');
  },

  /**
   * Get active Supabase Auth session
   */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Get current authenticated user and matching profile from 'profiles' table
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const userPayload = {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        role: profile?.role || 'Staff',
        avatar_url: profile?.avatar_url || null,
      };

      localStorage.setItem('agromart_user', JSON.stringify(userPayload));
      return userPayload;
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
