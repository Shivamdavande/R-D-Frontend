import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPendingExpenses } from '../services/offlineStorage';
import { syncAllPendingExpenses } from '../services/syncManager';

interface NetworkContextType {
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  pendingSyncCount: number;
  refreshPendingCount: () => Promise<void>;
  triggerSyncNow: () => Promise<{ successCount: number; failCount: number }>;
}

const NetworkContext = createContext<NetworkContextType>({} as NetworkContextType);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    refreshPendingCount();
    // Periodic check for pending count
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshPendingCount = async () => {
    const queue = await getPendingExpenses();
    setPendingSyncCount(queue.length);
  };

  const triggerSyncNow = async () => {
    const result = await syncAllPendingExpenses();
    await refreshPendingCount();
    return result;
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        setIsOnline,
        pendingSyncCount,
        refreshPendingCount,
        triggerSyncNow
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
