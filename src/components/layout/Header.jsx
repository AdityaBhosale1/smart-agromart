import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllAsRead } from '../../services/notificationService';
import authService from '../../services/authService';

export const Header = ({ onToggleSidebar, activeTabLabel, setActiveTab }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin', role: 'AgroMart', email: 'admin@smartagromart.com' });

  const loadNotifs = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
      const count = (data || []).filter(n => !n.is_read && !n.is_archived).length;
      setUnreadCount(count);
    } catch (e) {
      console.error('Error fetching header notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifs();
    authService.getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
      }
    }).catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllAsRead();
  };

  const handleLogout = () => {
    authService.logout();
    setShowProfileMenu(false);
    window.location.reload();
  };

  const initials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AM';

  return (
    <header className="sticky top-0 z-30 w-full h-16 px-4 sm:px-6 bg-white/85 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between shrink-0 select-none">
      
      {/* LEFT: HAMBURGER TOGGLE + DASHBOARD TITLE & SUBTITLE */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="lg:hidden p-2 rounded-xl text-[#064E3B] hover:bg-emerald-50 border border-gray-200 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col">
          <h2 className="text-sm font-extrabold text-[#064E3B] font-['Outfit'] capitalize leading-tight">
            {activeTabLabel || 'Dashboard'}
          </h2>
          <span className="text-[10px] text-gray-500 font-medium">
            Smart AgroMart Operating System
          </span>
        </div>
      </div>

      {/* CENTER: SEARCH BAR (340px max-width) */}
      <div className="hidden md:flex flex-1 max-w-[340px] mx-4">
        <div className="relative w-full flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, farmers, bills..."
            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium text-[#064E3B] placeholder-gray-400 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#22C55E] rounded-full shadow-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[#22C55E]/30"
          />
        </div>
      </div>

      {/* RIGHT: NOTIFICATION BELL & ADMIN PROFILE */}
      <div className="flex items-center gap-3">
        
        {/* MOBILE SEARCH BUTTON */}
        <button 
          aria-label="Search"
          className="md:hidden w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* NOTIFICATION BELL WITH UNREAD INDICATOR */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative w-9 h-9 rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 text-[#064E3B] flex items-center justify-center transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN POPOVER */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                <span className="font-bold text-xs text-[#064E3B]">Smart Notifications</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-gray-500 hover:text-emerald-700 font-bold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={`p-2 rounded-xl border text-left transition-all ${!n.is_read ? 'bg-emerald-50/70 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${n.priority === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'}`} />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">{n.title}</p>
                        <span className="text-[9px] text-gray-400 mt-0.5 block">{n.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (setActiveTab) setActiveTab('notifications');
                  }}
                  className="text-xs font-extrabold text-[#064E3B] hover:text-[#15803D]"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="w-[1px] h-6 bg-gray-200" />

        {/* ADMIN PROFILE SECTION */}
        <div className="relative">
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-xl hover:bg-gray-100/70 transition-all select-none"
          >
            {/* AVATAR CIRCLE */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#064E3B] to-[#15803D] text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white shrink-0">
              {initials}
            </div>

            {/* ADMIN TEXT & DROPDOWN */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#064E3B] leading-tight font-['Outfit']">{currentUser.name || 'Admin'}</span>
              <span className="text-[10px] font-semibold text-gray-500 leading-tight">{currentUser.role || 'AgroMart'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </div>

          {/* PROFILE DROPDOWN MENU */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="font-bold text-[#064E3B]">{currentUser.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  if (setActiveTab) setActiveTab('settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-medium text-gray-700"
              >
                Shop Settings
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold mt-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;



