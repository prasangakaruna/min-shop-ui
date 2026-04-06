'use client';

import React, { createContext, useContext } from 'react';
import type { StorefrontBrowseCategoryRow } from '@/lib/storefrontApi';

/** Matches GET /storefront/coupons → volume_promo (see CouponPromoSection). */
export type StorefrontHomeVolumePromo = {
  min_subtotal: string;
  percent: number;
  starts_at?: string | null;
  ends_at?: string | null;
} | null;

export type StorefrontHomePrefetchValue = {
  browseCategoryRows: StorefrontBrowseCategoryRow[];
  volumePromo: StorefrontHomeVolumePromo;
};

const StorefrontHomePrefetchContext = createContext<StorefrontHomePrefetchValue | undefined>(undefined);

export function StorefrontHomePrefetchProvider({
  value,
  children,
}: {
  value: StorefrontHomePrefetchValue | undefined;
  children: React.ReactNode;
}) {
  return <StorefrontHomePrefetchContext.Provider value={value}>{children}</StorefrontHomePrefetchContext.Provider>;
}

export function useStorefrontHomePrefetch(): StorefrontHomePrefetchValue | undefined {
  return useContext(StorefrontHomePrefetchContext);
}
