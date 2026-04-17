'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut, getSession } from 'next-auth/react';
import { apiRequest, getSystemStores, type StoreSummary, type StoreListResponse } from '@/lib/api';
import { storeSlugFromHostname } from '@/lib/storeSlug';

interface StoreContextValue {
  stores: StoreSummary[];
  currentStore: StoreSummary | null;
  setCurrentStore: (store: StoreSummary | null) => void;
  loading: boolean;
  error: string | null;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const MERCHANT_STORE_KEY = 'mint_admin_store_id';
const SYSTEM_CONTENT_STORE_KEY = 'mint_system_content_store_id';

export type StoreProviderSource = 'merchant' | 'system';

export function StoreProvider({
  children,
  token,
  storeSource = 'merchant',
}: {
  children: React.ReactNode;
  token: string | null | undefined;
  /** `system` = super-admin store list from GET /system/stores (platform Content console). */
  storeSource?: StoreProviderSource;
}) {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [currentStore, setCurrentStoreState] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = storeSource === 'system' ? SYSTEM_CONTENT_STORE_KEY : MERCHANT_STORE_KEY;

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
      let list: StoreSummary[];

      if (storeSource === 'system') {
        const data = await getSystemStores({
          token: effectiveToken,
          page: 1,
          per_page: 100,
          sort: 'name',
        });
        list = data.data.map((row) => ({
          id: row.id,
          owner_id: row.owner_id,
          name: row.name,
          slug: row.slug,
          domain: row.domain,
          email: row.email,
          plan: row.plan,
          is_active: row.is_active,
        }));
      } else {
        const data = await apiRequest<StoreListResponse>('/me/stores', {
          token: effectiveToken,
          query: { per_page: 50 },
        });
        list = Array.isArray(data) ? data : (data as StoreListResponse).data ?? [];
      }

      setStores(list);
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      const hostSlug = storeSource === 'merchant' && typeof window !== 'undefined' ? storeSlugFromHostname() : null;
      const fromSubdomain = hostSlug ? list.find((s) => s.slug === hostSlug) : null;
      const selected =
        fromSubdomain ?? list.find((s) => String(s.id) === savedId) ?? list[0] ?? null;
      setCurrentStoreState(selected);
      if (selected && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(selected.id));
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
  }, [token, storeSource, storageKey]);

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  const setCurrentStore = useCallback(
    (store: StoreSummary | null) => {
      setCurrentStoreState(store);
      if (typeof window !== 'undefined') {
        if (store) localStorage.setItem(storageKey, String(store.id));
        else localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

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
