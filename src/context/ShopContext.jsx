import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAppSettings, defaultShopProfile } from '../services/settingsService';

const ShopContext = createContext({
  shopProfile: defaultShopProfile,
  shopLogo: null,
  updateShopProfile: () => {},
  refreshShopProfile: () => {}
});

export const ShopProvider = ({ children }) => {
  const [shopProfile, setShopProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('agromart_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultShopProfile, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse cached profile:', e);
    }
    return defaultShopProfile;
  });

  const loadShopProfile = async () => {
    try {
      const prof = await getAppSettings('profile', defaultShopProfile);
      if (prof) {
        setShopProfile(prev => ({ ...defaultShopProfile, ...prev, ...prof }));
      }
    } catch (e) {
      console.warn('Failed to load live shop profile from Supabase:', e);
    }
  };

  useEffect(() => {
    loadShopProfile();
  }, []);

  const updateShopProfile = (newProf) => {
    setShopProfile(prev => {
      const updated = { ...prev, ...newProf };
      try {
        localStorage.setItem('agromart_profile', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save cached profile:', e);
      }
      return updated;
    });
  };

  const value = {
    shopProfile,
    shopLogo: shopProfile?.logo_url || null,
    updateShopProfile,
    refreshShopProfile: loadShopProfile
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);

export default ShopContext;
