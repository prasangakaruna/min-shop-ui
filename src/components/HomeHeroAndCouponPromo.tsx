'use client';

import React, { useEffect, useState } from 'react';
import Hero from '@/components/Hero';
import { storefrontRequest } from '@/lib/storefrontApi';
import { useStorefrontHomePrefetch } from '@/context/StorefrontHomePrefetchContext';

type StorefrontCouponsResponse = {
  data?: unknown;
  volume_promo?: {
    min_subtotal: string;
    percent: number;
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

type Props = {
  storeSlug: string | null;
  /** Theme → Marketplace hero section settings (admin). */
  heroSettings?: Record<string, unknown> | null;
};

/**
 * Fetches `/storefront/coupons` for volume promo only; the large “Smart checkout” strip is not rendered on the home page.
 */
export default function HomeHeroAndCouponPromo({ storeSlug, heroSettings }: Props) {
  const homePrefetch = useStorefrontHomePrefetch();
  const [volumePromo, setVolumePromo] = useState<StorefrontCouponsResponse['volume_promo']>(() =>
    storeSlug && homePrefetch ? homePrefetch.volumePromo ?? null : null
  );
  const [loaded, setLoaded] = useState(() => Boolean(!storeSlug || homePrefetch));

  useEffect(() => {
    if (storeSlug && homePrefetch) {
      setVolumePromo(homePrefetch.volumePromo ?? null);
      setLoaded(true);
      return;
    }
    if (!storeSlug) {
      setVolumePromo(null);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    storefrontRequest<StorefrontCouponsResponse>('/storefront/coupons', { store: storeSlug })
      .then((res) => {
        if (cancelled) return;
        setVolumePromo(res.volume_promo ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setVolumePromo(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug, homePrefetch]);

  return (
    <Hero
      settings={heroSettings ?? undefined}
      storeSlug={storeSlug}
      volumePromo={volumePromo}
      volumePromoLoaded={loaded}
    />
  );
}
