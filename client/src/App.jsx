import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, SignIn, SignUp } from '@clerk/clerk-react';
import { setAuthHeaders } from './lib/api.js';
import { SettingsProvider } from './context/SettingsContext.jsx';

import LandingPage from './pages/LandingPage.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyDeals from './pages/MyDeals.jsx';
import DealDetail from './pages/DealDetail.jsx';
import SavedDocuments from './pages/SavedDocuments.jsx';
import Settings from './pages/Settings.jsx';
import Analytics from './pages/Analytics.jsx';
import Referrals from './pages/Referrals.jsx';

import LOITool from './tools/LOITool.jsx';
import PropertyTool from './tools/PropertyTool.jsx';
import CashFlowTool from './tools/CashFlowTool.jsx';
import DebtTool from './tools/DebtTool.jsx';
import LeaseTool from './tools/LeaseTool.jsx';
import DealAnalyzerTool from './tools/DealAnalyzerTool.jsx';

function AuthPage({ children }) {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-charcoal-900 mb-2">CRE Suite</h1>
          <p className="text-charcoal-600 text-sm">Professional commercial real estate tools</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthedApp() {
  const { isSignedIn, isLoaded, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      setAuthHeaders(user.id, user.primaryEmailAddress?.emailAddress, user.fullName);
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="deals" element={<MyDeals />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="documents" element={<SavedDocuments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="tools/loi" element={<LOITool />} />
          <Route path="tools/property" element={<PropertyTool />} />
          <Route path="tools/cashflow" element={<CashFlowTool />} />
          <Route path="tools/debt" element={<DebtTool />} />
          <Route path="tools/lease" element={<LeaseTool />} />
          <Route path="tools/deal" element={<DealAnalyzerTool />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/sign-in/*"
        element={
          isLoaded && isSignedIn
            ? <Navigate to="/dashboard" replace />
            : <AuthPage><SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" /></AuthPage>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          isLoaded && isSignedIn
            ? <Navigate to="/dashboard" replace />
            : <AuthPage><SignUp routing="path" path="/sign-up" afterSignUpUrl="/dashboard" /></AuthPage>
        }
      />
      <Route path="/*" element={<AuthedApp />} />
    </Routes>
  );
}
