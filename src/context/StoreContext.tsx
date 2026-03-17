'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut, getSession } from 'next-auth/react';
import { apiRequest, type StoreSummary, type StoreListResponse } from '@/lib/api';

interface StoreContextValue {
  stores: StoreSummary[];
  currentStore: StoreSummary | null;
  setCurrentStore: (store: StoreSummary | null) => void;
  loading: boolean;
  error: string | null;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORE_KEY = 'mint_admin_store_id';

export function StoreProvider({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string | null | undefined;
}) {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [currentStore, setCurrentStoreState] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStores = useCallback(async (retryToken?: string | null) => {
    const effectiveToken = retryToken !== undefined ? retryToken : token;
    if (!effectiveToken) {
      setStores([]);
      setCurrentStoreState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<StoreListResponse>('/me/stores', { token: effectiveToken, query: { per_page: 50 } });
      const list = Array.isArray(data) ? data : (data as StoreListResponse).data ?? [];
      setStores(list);
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
      const selected = list.find((s) => String(s.id) === savedId) ?? list[0] ?? null;
      setCurrentStoreState(selected);
      if (selected && typeof window !== 'undefined') {
        localStorage.setItem(STORE_KEY, String(selected.id));
      }
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 401 && retryToken === undefined) {
        const fresh = await getSession();
        const freshToken = (fresh as { access_token?: string } | null)?.access_token ?? null;
        if (freshToken) {
          await refreshStores(freshToken);
          return;
        }
      }
      if (status === 401) {
        setStores([]);
        setCurrentStoreState(null);
        setError('Session expired. Signing you out…');
        void signOut({ callbackUrl: '/' });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load stores');
      setStores([]);
      setCurrentStoreState(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  const setCurrentStore = useCallback((store: StoreSummary | null) => {
    setCurrentStoreState(store);
    if (typeof window !== 'undefined') {
      if (store) localStorage.setItem(STORE_KEY, String(store.id));
      else localStorage.removeItem(STORE_KEY);
    }
  }, []);

  const value: StoreContextValue = {
    stores,
    currentStore,
    setCurrentStore,
    loading,
    error,
    refreshStores,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
