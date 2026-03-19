'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  storefrontRequest,
  type StorefrontStore,
  type StorefrontProduct,
  type StorefrontStoresResponse,
  type StorefrontProductsResponse,
} from '@/lib/storefrontApi';

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

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      storefrontRequest<StorefrontStoresResponse>('/storefront/stores', { per_page: 50 }),
      storefrontRequest<StorefrontProductsResponse>('/storefront/products', {
        per_page: 100,
        ...(storeSlug ? { store: storeSlug } : {}),
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
  }, [storeSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const value: StorefrontData = {
    storeSlug: storeSlug ?? null,
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
