'use client';

import { useState, useEffect } from 'react';

interface SiteConfig {
  site_name: string;
  about_us: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_address: string;
  company_cui: string;
  company_reg_number: string;
  company_full_name: string;
}

const defaultConfig: SiteConfig = {
  site_name: 'Din ograda mea direct pe masa ta',
  about_us: '',
  contact_email: '',
  contact_phone: '',
  contact_whatsapp: '',
  contact_address: '',
  company_cui: '',
  company_reg_number: '',
  company_full_name: ''
};

let cachedConfig: SiteConfig | null = null;
let configPromise: Promise<SiteConfig> | null = null;
const listeners: Set<(config: SiteConfig) => void> = new Set();

async function fetchSiteConfig(forceRefresh = false): Promise<SiteConfig> {
  try {
    // Add timestamp to prevent caching
    const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
    const response = await fetch(`/api/public/site-config${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch site config');
    }
    const data = await response.json();
    
    console.log('📦 Fetched site config:', data);
    
    // Transform array of configs to object
    const config: SiteConfig = { ...defaultConfig };
    
    // Check if data is an array or object
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.key in config) {
          config[item.key as keyof SiteConfig] = item.value || defaultConfig[item.key as keyof SiteConfig];
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // If data is already an object, use it directly
      Object.keys(defaultConfig).forEach(key => {
        if (key in data) {
          config[key as keyof SiteConfig] = data[key] || defaultConfig[key as keyof SiteConfig];
        }
      });
    }
    
    console.log('✅ Transformed config:', config);
    
    cachedConfig = config;
    configPromise = null;
    
    // Notify all listeners
    listeners.forEach(listener => {
      console.log('🔔 Notifying listener');
      listener(config);
    });
    
    return config;
  } catch (error) {
    console.error('❌ Error fetching site config:', error);
    configPromise = null;
    return cachedConfig || defaultConfig;
  }
}

// Function to refresh config (called after updates)
export function refreshSiteConfig() {
  console.log('🔄 Refreshing site config...');
  cachedConfig = null;
  configPromise = null;
  return fetchSiteConfig(true);
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    console.log('🎣 useSiteConfig mounted');
    
    // Add listener for updates
    listeners.add(setConfig);

    // Fetch config if not cached
    if (!cachedConfig) {
      if (!configPromise) {
        configPromise = fetchSiteConfig();
      }
      configPromise.then(newConfig => {
        setConfig(newConfig);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Poll for updates every 5 seconds (fallback if events don't work)
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for config updates...');
      fetchSiteConfig(true).then(newConfig => {
        // Only update if config actually changed
        if (JSON.stringify(newConfig) !== JSON.stringify(cachedConfig)) {
          console.log('📝 Config changed, updating...');
          setConfig(newConfig);
        }
      });
    }, 5000);

    // Cleanup
    return () => {
      console.log('🎣 useSiteConfig unmounted');
      listeners.delete(setConfig);
      clearInterval(pollInterval);
    };
  }, []);

  // Listen for custom events (when config is updated in admin)
  useEffect(() => {
    const handleConfigUpdate = () => {
      console.log('🔔 Received siteConfigUpdated event');
      refreshSiteConfig().then(newConfig => {
        setConfig(newConfig);
      });
    };

    window.addEventListener('siteConfigUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('siteConfigUpdated', handleConfigUpdate);
    };
  }, []);

  return { config, loading };
}
