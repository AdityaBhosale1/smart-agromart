import React from 'react';
import AgroMartBackgroundWrapper from './components/AgroMartBackgroundWrapper';
import DashboardLayout from './components/layout/DashboardLayout';
import { ShopProvider } from './context/ShopContext';

export function App() {
  return (
    <ShopProvider>
      <AgroMartBackgroundWrapper>
        <DashboardLayout />
      </AgroMartBackgroundWrapper>
    </ShopProvider>
  );
}

export default App;
