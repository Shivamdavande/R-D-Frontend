import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Site } from '../types';
import { useAuth } from './AuthContext';
import { cacheUserSites, getCachedSites } from '../services/offlineStorage';

interface SiteContextType {
  sites: Site[];
  activeSite: Site | null;
  setActiveSite: (site: Site | null) => void;
  isLoading: boolean;
  refreshSites: () => Promise<void>;
  createSite: (data: Partial<Site>) => Promise<Site>;
  closeSite: (siteId: string) => Promise<any>;
  reopenSite: (siteId: string) => Promise<void>;
}

const SiteContext = createContext<SiteContextType>({} as SiteContextType);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [activeSite, setActiveSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      refreshSites();
    } else {
      setSites([]);
      setActiveSite(null);
    }
  }, [user]);

  const refreshSites = async () => {
    // 1. Instant Cache-First: Load cached sites immediately for instant 0ms UI rendering
    try {
      const cached = await getCachedSites();
      if (cached && cached.length > 0) {
        setSites(cached);
        if (!activeSite) setActiveSite(cached[0]);
      }
    } catch (e) {
      // Ignore local read errors
    }

    // 2. Sync latest data from backend in the background
    try {
      const res = await api.get('/sites');
      if (res.data?.success) {
        setSites(res.data.sites);
        await cacheUserSites(res.data.sites);

        // Keep or set default active site
        if (res.data.sites.length > 0) {
          if (!activeSite) {
            setActiveSite(res.data.sites[0]);
          } else {
            const updatedActive = res.data.sites.find((s: Site) => s._id === activeSite._id);
            if (updatedActive) {
              setActiveSite(updatedActive);
            } else {
              setActiveSite(res.data.sites[0]);
            }
          }
        }
      }
    } catch (err) {
      // Offline fallback already loaded
    } finally {
      setIsLoading(false);
    }
  };

  const createSite = async (data: Partial<Site>): Promise<Site> => {
    const res = await api.post('/sites', data);
    if (res.data?.success) {
      await refreshSites();
      return res.data.site;
    }
    throw new Error('Failed to create site');
  };

  const closeSite = async (siteId: string) => {
    const res = await api.post(`/sites/${siteId}/close`);
    if (res.data?.success) {
      await refreshSites();
    }
    return res.data;
  };

  const reopenSite = async (siteId: string) => {
    const res = await api.post(`/sites/${siteId}/reopen`);
    if (res.data?.success) {
      await refreshSites();
    }
  };

  return (
    <SiteContext.Provider
      value={{
        sites,
        activeSite,
        setActiveSite,
        isLoading,
        refreshSites,
        createSite,
        closeSite,
        reopenSite
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSites = () => useContext(SiteContext);
