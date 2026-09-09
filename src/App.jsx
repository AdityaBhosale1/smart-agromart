import React from 'react';
import AgroMartBackgroundWrapper from './components/AgroMartBackgroundWrapper';
import DashboardLayout from './components/layout/DashboardLayout';
import { ShopProvider } from './context/ShopContext';
import ErrorBoundary from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <ShopProvider>
        <AgroMartBackgroundWrapper>
          <DashboardLayout />
        </AgroMartBackgroundWrapper>
      </ShopProvider>
    </ErrorBoundary>
  );
}

export default App;
