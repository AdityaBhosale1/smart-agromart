import React, { useState } from 'react';
import { Sprout, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import authService from '../../services/authService';
import { useShop } from '../../context/ShopContext';

export const LoginScreen = ({ onLoginSuccess }) => {
  const { shopLogo, shopProfile } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error('Supabase Login error:', err);
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-white/90 shadow-2xl p-6 sm:p-8 animate-fadeIn text-left">
        
        {/* LOGO & BRANDING HEADER */}
        <div className="flex flex-col items-center text-center mb-6">
          {shopLogo ? (
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-emerald-400 p-1 flex items-center justify-center shadow-lg mb-3 overflow-hidden">
              <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#064E3B] to-[#15803D] flex items-center justify-center text-white shadow-lg mb-3">
              <Sprout className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-black text-[#064E3B] font-['Outfit'] tracking-tight">
            {shopProfile?.shop_name || 'Smart AgroMart'}
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            AI-Powered Agricultural Shop Management System
          </p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Supabase Security Active
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-[#064E3B] mb-1.5 font-['Outfit']">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartagromart.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-[#064E3B] placeholder-gray-400 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#22C55E] rounded-xl shadow-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[#22C55E]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#064E3B] mb-1.5 font-['Outfit']">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-[#064E3B] placeholder-gray-400 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#22C55E] rounded-xl shadow-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[#22C55E]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#15803D] hover:from-[#043d2e] hover:to-[#116932] text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login to AgroMart</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <span className="text-[10px] text-gray-400 font-medium">
            Protected by Supabase Auth & PostgreSQL Row-Level Security
          </span>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
