import React from 'react';
import AgroMartBackgroundWrapper from './components/AgroMartBackgroundWrapper';
import DashboardLayout from './components/layout/DashboardLayout';

export function App() {
  return (
    <AgroMartBackgroundWrapper>
      <DashboardLayout />
    </AgroMartBackgroundWrapper>
  );
}

export default App;
