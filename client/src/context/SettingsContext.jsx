import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { settingsApi } from '../lib/api.js';

const SettingsContext = createContext(null);

const DEFAULTS = {
  companyName: '',
  agentName: '',
  licenseNumber: '',
  officeAddress: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
  website: '',
  logoPath: null,
  primaryColor: '#C8472A',
  tagline: '',
  specialty: [],
  yearsExperience: null,
  bio: '',
  referralVisible: false,
};

export function SettingsProvider({ children }) {
  const { isSignedIn } = useUser();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings(prev => ({ ...DEFAULTS, ...data.settings }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, loadSettings]);

  const updateSettings = async (newSettings) => {
    const data = await settingsApi.update(newSettings);
    setSettings(prev => ({ ...prev, ...data.settings }));
    return data.settings;
  };

  const uploadLogo = async (file) => {
    const data = await settingsApi.uploadLogo(file);
    setSettings(prev => ({ ...prev, logoPath: data.logoPath }));
    return data.logoPath;
  };

  // Full URL for logo, usable in <img> tags and PDFs
  const logoUrl = settings.logoPath
    ? `${window.location.protocol}//${window.location.hostname}:3001${settings.logoPath}`
    : null;

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      uploadLogo,
      logoUrl,
      refetch: loadSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
