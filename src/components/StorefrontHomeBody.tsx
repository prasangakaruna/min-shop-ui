'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BrowseCategories from '@/components/BrowseCategories';
import CategoryProducts from '@/components/CategoryProducts';
import FeaturedListings from '@/components/FeaturedListings';
import SpecialOffers from '@/components/SpecialOffers';
import TopSellers from '@/components/TopSellers';
import NewArrivals from '@/components/NewArrivals';
import WhyChooseUs from '@/components/WhyChooseUs';
import UserLevels from '@/components/UserLevels';
import Testimonials from '@/components/Testimonials';
import MarketplaceInsights from '@/components/MarketplaceInsights';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import { storefrontRequest } from '@/lib/storefrontApi';
import {
  type HomeSection,
  type StorefrontHomeTheme,
  mergeStorefrontHomeTheme,
  themeToCssVars,
  isMintMarketplaceSectionOrder,
} from '@/lib/storefrontHomeTheme';

type BrandingResponse = {
  data?: {
    storefront_home?: StorefrontHomeTheme | null;
  };
};

function renderSection(
  section: HomeSection,
  storeSlug: string | null,
  index: number,
  sectionSpacing: number
) {
  const gapStyle = index > 0 ? { marginTop: sectionSpacing } : undefined;
  const wrap = (node: React.ReactNode) => (
    <div key={section.id} style={gapStyle}>
      {node}
    </div>
  );

  const settings = section.settings ?? {};

  switch (section.type) {
    case 'default_hero':
      return wrap(<Hero />);
    case 'announcement_bar':
      return wrap(<AnnouncementBar text={typeof settings.text === 'string' ? settings.text : null} />);
    case 'video_hero':
      return wrap(<Hero variant="video" />);
    case 'browse_categories':
      return wrap(
        <>
          {index > 0 ? <div className="border-t border-gray-100" /> : null}
          <BrowseCategories />
        </>
      );
    case 'category_products':
      return wrap(<CategoryProducts />);
    case 'special_offers':
      return wrap(<SpecialOffers storeSlug={storeSlug} />);
    case 'featured_collection':
      return wrap(<FeaturedListings />);
    case 'top_sellers':
      return wrap(<TopSellers />);
    case 'new_arrivals':
      return wrap(<NewArrivals />);
    case 'multi_column':
      return wrap(<WhyChooseUs />);
    case 'image_with_text':
      return wrap(<SpecialOffers storeSlug={storeSlug} />);
    case 'user_levels':
      return wrap(<UserLevels />);
    case 'testimonials':
      return wrap(<Testimonials />);
    case 'marketplace_insights':
      return wrap(<MarketplaceInsights />);
    case 'instagram_feed':
      return wrap(<Newsletter />);
    case 'newsletter':
      return wrap(<Newsletter />);
    default:
      return null;
  }
}

function DefaultMarketplaceHome({ storeSlug }: { storeSlug: string | null }) {
  return (
    <>
      <Hero />
      <div className="border-t border-gray-100" />
      <BrowseCategories />
      <CategoryProducts />
      <SpecialOffers storeSlug={storeSlug} />
      <FeaturedListings />
      <TopSellers />
      <NewArrivals />
      <WhyChooseUs />
      <UserLevels />
      <Testimonials />
      <MarketplaceInsights />
      <Newsletter />
    </>
  );
}

function storeSlugFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return null;
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const effectiveParts = parts[0] === 'www' && parts.length >= 3 ? parts.slice(1) : parts;
  return effectiveParts[0] ?? null;
}

export default function StorefrontHomeBody({ storeSlug }: { storeSlug: string | null }) {
  const [effectiveSlug, setEffectiveSlug] = useState<string | null>(storeSlug);
  /** Same stack as the main marketplace (mint-shop.pro) until a custom theme is saved in admin. */
  const [layoutKind, setLayoutKind] = useState<'loading' | 'classic' | 'custom'>('loading');
  const [customTheme, setCustomTheme] = useState<StorefrontHomeTheme | null>(null);

  useEffect(() => {
    if (storeSlug) {
      setEffectiveSlug(storeSlug);
      return;
    }
    setEffectiveSlug(storeSlugFromHostname());
  }, [storeSlug]);

  useEffect(() => {
    if (!effectiveSlug) {
      setLayoutKind('loading');
      return;
    }
    let cancelled = false;
    setLayoutKind('loading');
    storefrontRequest<BrandingResponse>('/storefront/store-branding', { store_slug: effectiveSlug })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.storefront_home;
        if (raw == null) {
          setCustomTheme(null);
          setLayoutKind('classic');
        } else {
          setCustomTheme(mergeStorefrontHomeTheme(raw));
          setLayoutKind('custom');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCustomTheme(null);
          setLayoutKind('classic');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug]);

  const outerStyle = useMemo(() => {
    if (layoutKind !== 'custom' || !customTheme) return undefined;
    return themeToCssVars(customTheme.theme);
  }, [layoutKind, customTheme]);

  if (!effectiveSlug) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <DefaultMarketplaceHome storeSlug={null} />
        <Footer />
      </main>
    );
  }

  if (layoutKind === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">Loading storefront…</div>
        <Footer />
      </main>
    );
  }

  if (layoutKind === 'classic') {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <DefaultMarketplaceHome storeSlug={effectiveSlug} />
        <Footer />
      </main>
    );
  }

  if (!customTheme) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <DefaultMarketplaceHome storeSlug={effectiveSlug} />
        <Footer />
      </main>
    );
  }

  /**
   * Default Mint Marketplace theme = same DOM as the global home (`/`): one shared component tree,
   * not the section renderer (which adds extra wrappers/spacing and theme shell).
   */
  if (isMintMarketplaceSectionOrder(customTheme.sections)) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <DefaultMarketplaceHome storeSlug={effectiveSlug} />
        <Footer />
      </main>
    );
  }

  const spacing = customTheme.theme.sectionSpacing;
  const innerClass = customTheme.theme.wideLayout ? '' : 'max-w-6xl mx-auto';

  return (
    <main className="min-h-screen" style={outerStyle}>
      <Header />
      <div className={innerClass}>
        {customTheme.sections
          .filter((s) => s.enabled !== false)
          .map((section, i) => renderSection(section, effectiveSlug, i, spacing))}
      </div>
      <Footer />
    </main>
  );
}
