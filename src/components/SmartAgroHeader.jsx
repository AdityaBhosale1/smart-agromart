import React from 'react';
import { Search, Bell, ChevronDown, Sprout, ShoppingCart } from 'lucide-react';

/**
 * SmartAgroHeader Component
 * 
 * Clean, premium top header for Smart AgroMart SaaS platform.
 * Features:
 * - Left: Smart AgroMart Branding + AI-Powered Agricultural Shop subtitle
 * - Center: Translucent search bar ("Search products, farmers, bills...")
 * - Right: Notifications bell + Admin AgroMart profile with dropdown
 * - Semi-transparent white frosted glass backdrop (backdrop-blur-md)
 */
export const SmartAgroHeader = () => {
  return (
    <header className="w-full h-[72px] px-4 sm:px-6 lg:px-8 bg-white/75 backdrop-blur-md border-b border-white/80 shadow-sm flex items-center justify-between z-40 relative select-none">
      
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDE: LOGO & BRANDING */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        {/* LOGO ICON BADGE (Leaf + Shopping Cart concept) */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#064E3B] via-[#15803D] to-[#22C55E] flex items-center justify-center text-white shadow-sm shrink-0">
          <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DCFCE7] border border-[#15803D] flex items-center justify-center text-[#064E3B]">
            <Sprout className="w-3 h-3 stroke-[2.5]" />
          </div>
        </div>

        {/* BRAND TITLE & SUBTITLE */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#064E3B] font-['Outfit'] leading-tight">
              Smart AgroMart
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#64748B] tracking-wide">
            AI-Powered Agricultural Shop
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CENTER: SEARCH BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, farmers, bills..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium text-[#064E3B] placeholder-[#64748B] bg-white/70 hover:bg-white/90 focus:bg-white border border-[#DCFCE7] focus:border-[#22C55E] rounded-full shadow-xs backdrop-blur-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[#22C55E]/30"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT SIDE: NOTIFICATIONS & ADMIN PROFILE */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* MOBILE SEARCH ICON BUTTON */}
        <button 
          aria-label="Search"
          className="md:hidden w-9 h-9 rounded-full bg-white/80 border border-gray-200 text-[#64748B] flex items-center justify-center hover:bg-white transition-all"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* NOTIFICATION BELL ICON */}
        <button 
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-white/90 text-[#064E3B] flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95"
        >
          <Bell className="w-5 h-5 text-[#064E3B]" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
        </button>

        {/* DIVIDER */}
        <div className="w-[1px] h-6 bg-gray-200/80" />

        {/* ADMIN PROFILE AVATAR & DROPDOWN */}
        <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-white/60 transition-all">
          {/* AVATAR CIRCLE */}
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#064E3B] to-[#15803D] text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white shrink-0">
            AM
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
          </div>

          {/* ADMIN TEXT & SUBTITLE */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#064E3B] leading-tight font-['Outfit']">
              Admin
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] leading-tight">
              AgroMart
            </span>
          </div>

          {/* DROPDOWN ARROW */}
          <ChevronDown className="w-4 h-4 text-[#64748B] ml-0.5" />
        </div>

      </div>
    </header>
  );
};

export default SmartAgroHeader;
