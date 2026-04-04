'use client';

import React, { useEffect, useState } from 'react';
import Hero from '@/components/Hero';
import CouponPromoSection from '@/components/CouponPromoSection';
import { storefrontRequest } from '@/lib/storefrontApi';

type StorefrontCouponRow = { code: string; summary: string; min_subtotal?: string };

type StorefrontCouponsResponse = {
  data?: StorefrontCouponRow[];
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
 * Single `/storefront/coupons` fetch for the default hero + promo strip; volume card renders in the hero (right).
 */
export default function HomeHeroAndCouponPromo({ storeSlug, heroSettings }: Props) {
  const [coupons, setCoupons] = useState<StorefrontCouponRow[]>([]);
  const [volumePromo, setVolumePromo] = useState<StorefrontCouponsResponse['volume_promo']>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!storeSlug) {
      setCoupons([]);
      setVolumePromo(null);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    storefrontRequest<StorefrontCouponsResponse>('/storefront/coupons', { store: storeSlug })
      .then((res) => {
        if (cancelled) return;
        setCoupons(Array.isArray(res.data) ? res.data : []);
        setVolumePromo(res.volume_promo ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setCoupons([]);
          setVolumePromo(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  return (
    <>
      <Hero
        settings={heroSettings ?? undefined}
        storeSlug={storeSlug}
        volumePromo={volumePromo}
        volumePromoLoaded={loaded}
      />
      <CouponPromoSection
        storeSlug={storeSlug}
        prefetched={{ coupons, volume_promo: volumePromo, loaded }}
        volumePromoRenderedInHero
      />
    </>
  );
}
