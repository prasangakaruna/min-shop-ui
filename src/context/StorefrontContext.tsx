'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  storefrontRequest,
  type StorefrontStore,
  type StorefrontProduct,
  type StorefrontStoresResponse,
  type StorefrontProductsResponse,
} from '@/lib/storefrontApi';
import { storeSlugFromHostname } from '@/lib/storeSlug';

type StorefrontData = {
  storeSlug: string | null;
  stores: StorefrontStore[];
  products: StorefrontProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const StorefrontContext = createContext<StorefrontData | null>(null);

export function StorefrontProvider({ children, storeSlug }: { children: React.ReactNode; storeSlug?: string | null }) {
  const [stores, setStores] = useState<StorefrontStore[]>([]);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostSlug, setHostSlug] = useState<string | null>(null);

  useEffect(() => {
    if (storeSlug) {
      setHostSlug(null);
      return;
    }
    setHostSlug(storeSlugFromHostname());
  }, [storeSlug]);

  const effectiveStoreSlug = storeSlug ?? hostSlug;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      storefrontRequest<StorefrontStoresResponse>('/storefront/stores', { per_page: 50 }),
      storefrontRequest<StorefrontProductsResponse>('/storefront/products', {
        per_page: 100,
        ...(effectiveStoreSlug ? { store: effectiveStoreSlug } : {}),
      }),
    ])
      .then(([storesRes, productsRes]) => {
        setStores(storesRes.data ?? []);
        setProducts(productsRes.data ?? []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load marketplace');
      })
      .finally(() => setLoading(false));
  }, [effectiveStoreSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const value: StorefrontData = {
    storeSlug: effectiveStoreSlug ?? null,
    stores,
    products,
    loading,
    error,
    refresh: load,
  };

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  return useContext(StorefrontContext);
}
