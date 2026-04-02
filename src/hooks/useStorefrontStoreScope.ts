'use client';

import { useState, useLayoutEffect } from 'react';
import { storeSlugFromHostname } from '@/lib/storeSlug';

/**
 * Resolves which store to scope storefront API calls to.
 * `?store=` in the URL wins. On tenant hosts (e.g. istanbulfoodpazar.mint-shop.pro), middleware may
 * rewrite with `store` server-side while the visible URL hides it — `useSearchParams()` then misses it,
 * so we fall back to the subdomain slug from the hostname.
 *
 * Uses useLayoutEffect so the slug is available before paint and before child useEffect data fetches run.
 */
export function useStorefrontStoreScope(storeFromSearchParams: string): string {
  const [hostSlug, setHostSlug] = useState('');
  useLayoutEffect(() => {
    setHostSlug(storeSlugFromHostname() ?? '');
  }, []);
  const fromUrl = storeFromSearchParams.trim();
  return fromUrl || hostSlug;
}
