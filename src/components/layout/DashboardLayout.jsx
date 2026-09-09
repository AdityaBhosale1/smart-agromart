import React, { useState, useEffect } from 'react';
import { Sidebar, navItems, roleAllowedTabs } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from '../../pages/Dashboard';
import { Billing } from '../../pages/Billing';
import { Inventory } from '../../pages/Inventory';
import { Products } from '../../pages/Products';
import { Farmers } from '../../pages/Farmers';
import { Purchases } from '../../pages/Purchases';
import { CreditManagement } from '../../pages/CreditManagement';
import { AIInsights } from '../../pages/AIInsights';
import { Reports } from '../../pages/Reports';
import { Notifications } from '../../pages/Notifications';
import { Settings } from '../../pages/Settings';
import { LoginScreen } from '../auth/LoginScreen';
import authService from '../../services/authService';

export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial Supabase user session
    authService.getCurrentUser().then(user => {
      setCurrentUser(user);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth state changes (login / logout)
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64 text-emerald-800 font-bold text-sm">
        Loading Smart AgroMart session...
      </div>
    );
  }

  // Show login screen if no user authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const userRole = currentUser?.role || 'Admin';
  const allowedTabs = roleAllowedTabs[userRole] || roleAllowedTabs['Admin'];
  const activeItem = navItems.find(item => item.id === activeTab);

  const renderActivePage = () => {
    if (!allowedTabs.includes(activeTab)) {
      return (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <span className="text-xl font-bold">🚫</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 font-['Outfit']">Access Restricted</h2>
            <p className="text-xs text-gray-500 mt-1">
              Your role (<strong>{userRole}</strong>) does not have permission to access the <strong>{activeTab}</strong> page.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#15803D] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'billing': return <Billing />;
      case 'inventory': return <Inventory />;
      case 'products': return <Products />;
      case 'farmers': return <Farmers />;
      case 'purchases': return <Purchases />;
      case 'credit': return <CreditManagement />;
      case 'ai-insights': return <AIInsights />;
      case 'reports': return <Reports />;
      case 'notifications': return <Notifications />;
      case 'settings': return <Settings currentUserRole={userRole} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="w-full flex items-center justify-center select-none relative z-30">
      
      {/* MAIN CENTERED FLOATING DASHBOARD APPLICATION CONTAINER */}
      <div className="w-full max-w-[1720px] lg:w-[90vw] h-[90vh] lg:h-[86vh] rounded-[22px] bg-white/85 backdrop-blur-md border border-white/90 shadow-2xl overflow-hidden flex flex-row relative">
        
        {/* MOBILE SIDEBAR BACKDROP OVERLAY */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* LEFT SIDEBAR (Dark Green #064E3B) */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          userRole={userRole}
        />

        {/* MAIN RIGHT CONTAINER (HEADER + SCROLLABLE PAGE BODY) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/40">
          
          {/* SINGLE INNER DASHBOARD HEADER */}
          <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            activeTabLabel={activeItem?.label}
            setActiveTab={setActiveTab}
          />

          {/* DYNAMIC VERTICALLY SCROLLABLE CONTENT BODY */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar">
            {renderActivePage()}
          </main>

        </div>

      </div>

    </div>
  );
};

export default DashboardLayout;
