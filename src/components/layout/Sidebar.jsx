import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Boxes, 
  Package, 
  Users, 
  Truck, 
  CreditCard, 
  BrainCircuit, 
  BarChart3, 
  Bell, 
  Settings, 
  Sprout, 
  ShoppingCart,
  ChevronRight
} from 'lucide-react';

import { useShop } from '../../context/ShopContext';

export const roleAllowedTabs = {
  Admin: ['dashboard', 'billing', 'inventory', 'products', 'farmers', 'purchases', 'credit', 'ai-insights', 'reports', 'notifications', 'settings'],
  'Shopkeeper / Staff': ['dashboard', 'billing', 'inventory', 'products', 'farmers', 'notifications'],
  Staff: ['dashboard', 'billing', 'inventory', 'products', 'farmers', 'notifications'],
  Accountant: ['dashboard', 'billing', 'purchases', 'credit', 'reports', 'notifications'],
  Viewer: ['dashboard', 'notifications']
};

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'farmers', label: 'Farmers', icon: Users },
  { id: 'purchases', label: 'Purchases', icon: Truck },
  { id: 'credit', label: 'Credit Management', icon: CreditCard },
  { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, badge: 'AI' },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, userRole = 'Admin' }) => {
  const { shopLogo } = useShop();
  const [logoFailed, setLogoFailed] = React.useState(false);
  const allowed = roleAllowedTabs[userRole] || roleAllowedTabs['Admin'];
  const filteredNavItems = navItems.filter(item => allowed.includes(item.id));

  return (
    <aside 
      className={`fixed lg:relative z-50 h-full w-[275px] bg-[#064E3B] text-white flex flex-col justify-between transition-all duration-300 shadow-xl border-r border-[#064E3B]/40 shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* TOP BRANDING LOGO */}
      <div className="p-4 sm:p-5 border-b border-emerald-900/60 shrink-0">
        <div className="flex items-center gap-3">
          {shopLogo && !logoFailed ? (
            <div className="w-11 h-11 rounded-xl bg-white border border-emerald-400/40 p-1 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
              <img 
                src={shopLogo} 
                alt="Shop Logo" 
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain" 
              />
            </div>
          ) : (
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#15803D] via-[#22C55E] to-[#DCFCE7] flex items-center justify-center text-[#064E3B] shadow-md shrink-0">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#064E3B] border border-[#22C55E] flex items-center justify-center text-[#22C55E]">
                <Sprout className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg tracking-tight leading-none font-['Outfit'] text-white">
              Smart <span className="text-[#22C55E]">AgroMart</span>
            </h1>
            <span className="text-[11px] font-semibold text-emerald-300/80 mt-1 tracking-wider uppercase">
              AI Agro SaaS
            </span>
          </div>
        </div>
      </div>

      {/* SCROLLABLE MENU ITEMS LIST */}
      <div className="flex-1 py-4 px-3.5 overflow-y-auto space-y-1.5 custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-[14px] font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#15803D] text-white shadow-md border border-emerald-500/30'
                  : 'text-emerald-100/80 hover:bg-[#15803D]/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-emerald-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md bg-[#22C55E] text-[#064E3B] shrink-0">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* BOTTOM SIDEBAR BRANDING (NEVER CLIPPED) */}
      <div className="p-3.5 border-t border-emerald-900/60 bg-[#043d2e]/80 shrink-0">
        <div className="flex items-center gap-2.5 text-xs text-emerald-200/90 font-medium">
          <div className="w-7 h-7 rounded-lg bg-emerald-800/80 text-[#22C55E] flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-bold text-white text-[11px]">Smart Today</span>
            <span className="text-[10px] text-emerald-400/90">A Better Tomorrow</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
