'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useStorefront } from '@/context/StorefrontContext';
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
import HomeHeroAndCouponPromo from '@/components/HomeHeroAndCouponPromo';
import MembersDealsRail from '@/components/MembersDealsRail';
import PosterPromoSection from '@/components/PosterPromoSection';
import StorefrontAppEmbedScripts from '@/components/StorefrontAppEmbedScripts';
import {
  storefrontRequest,
  type StorefrontBrowseCategoriesResponse,
  type StorefrontHeaderMenuItem,
} from '@/lib/storefrontApi';
import {
  StorefrontHomePrefetchProvider,
  type StorefrontHomePrefetchValue,
} from '@/context/StorefrontHomePrefetchContext';
import { storeSlugFromHostname } from '@/lib/storeSlug';
import type { StorefrontAppEmbed } from '@/lib/api';
import {
  type HomeSection,
  type PosterPromoSettings,
  type StorefrontHomeTheme,
  mergeStorefrontHomeTheme,
  mergePosterPromoSettings,
  resolveStorefrontHeroSettings,
  heroSettingsForStorefront,
  themeToCssVars,
  isMintMarketplaceSectionOrder,
  shouldDisplayPosterPromo,
} from '@/lib/storefrontHomeTheme';

type CouponsBootstrapResponse = {
  volume_promo?: StorefrontHomePrefetchValue['volumePromo'];
};

type BrandingResponse = {
  data?: {
    company_logo_url?: string | null;
    /** Admin → Pro → Customize → hero image; storefront uses when theme hero has no custom background */
    pro_dashboard_hero_image_url?: string | null;
    storefront_home?: StorefrontHomeTheme | null;
    storefront_app_embeds?: StorefrontAppEmbed[] | null;
    header_menu_items?: StorefrontHeaderMenuItem[] | null;
  };
};

function renderSection(
  section: HomeSection,
  storeSlug: string | null,
  index: number,
  sectionSpacing: number,
  proHeroImageUrl: string | null
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
      return wrap(
        <HomeHeroAndCouponPromo
          storeSlug={storeSlug}
          heroSettings={resolveStorefrontHeroSettings(section.settings ?? null, proHeroImageUrl)}
        />
      );
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
      return wrap(<WhyChooseUs storeSlug={storeSlug} />);
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
    case 'member_deals_rail':
      return wrap(<MembersDealsRail storeSlug={storeSlug} settings={settings} />);
    default:
      return null;
  }
}

function renderSectionsWithPosterSlot(
  sections: HomeSection[],
  storeSlug: string | null,
  sectionSpacing: number,
  proHeroImageUrl: string | null,
  poster: PosterPromoSettings,
  posterWideLayout: boolean
): React.ReactNode[] {
  const enabled = sections.filter((s) => s.enabled !== false);
  const posterAfter: 'category_products' | 'browse_categories' | null = enabled.some(
    (s) => s.type === 'category_products'
  )
    ? 'category_products'
    : enabled.some((s) => s.type === 'browse_categories')
      ? 'browse_categories'
      : null;
  const out: React.ReactNode[] = [];
  let inserted = false;
  enabled.forEach((section, i) => {
    const node = renderSection(section, storeSlug, i, sectionSpacing, proHeroImageUrl);
    if (node) out.push(node);
    if (
      !inserted &&
      posterAfter &&
      section.type === posterAfter &&
      shouldDisplayPosterPromo(poster)
    ) {
      inserted = true;
      out.push(
        <div key="__poster_promo" style={{ marginTop: sectionSpacing }}>
          <PosterPromoSection config={poster} wideLayout={posterWideLayout} />
        </div>
      );
    }
  });
  if (!inserted && shouldDisplayPosterPromo(poster)) {
    out.push(
      <div key="__poster_promo_fallback" style={{ marginTop: sectionSpacing }}>
        <PosterPromoSection config={poster} wideLayout={posterWideLayout} />
      </div>
    );
  }
  return out;
}

function DefaultMarketplaceHome({
  storeSlug,
  heroSettings,
  posterPromo,
  posterWideLayout = true,
}: {
  storeSlug: string | null;
  /** Theme → Marketplace hero section settings (admin). */
  heroSettings?: Record<string, unknown> | null;
  posterPromo?: PosterPromoSettings | null;
  posterWideLayout?: boolean;
}) {
  const poster = posterPromo ?? mergePosterPromoSettings(null);
  return (
    <>
      <HomeHeroAndCouponPromo storeSlug={storeSlug} heroSettings={heroSettings ?? undefined} />
      <MembersDealsRail storeSlug={storeSlug} />
      <div className="border-t border-gray-100" />
      <BrowseCategories />
      <CategoryProducts />
      {shouldDisplayPosterPromo(poster) ? (
        <PosterPromoSection config={poster} wideLayout={posterWideLayout} />
      ) : null}
      <SpecialOffers storeSlug={storeSlug} />
      <FeaturedListings />
      <TopSellers />
      <NewArrivals />
      <WhyChooseUs storeSlug={storeSlug} />
      <UserLevels />
      <Testimonials />
      <MarketplaceInsights />
      <Newsletter />
    </>
  );
}

export default function StorefrontHomeBody({ storeSlug }: { storeSlug: string | null }) {
  const storefront = useStorefront();
  const [effectiveSlug, setEffectiveSlug] = useState<string | null>(storeSlug);
  /** Same stack as the main marketplace (mint-shop.pro) until a custom theme is saved in admin. */
  const [layoutKind, setLayoutKind] = useState<'loading' | 'classic' | 'custom'>('loading');
  const [customTheme, setCustomTheme] = useState<StorefrontHomeTheme | null>(null);
  const [appEmbeds, setAppEmbeds] = useState<StorefrontAppEmbed[]>([]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  /** Admin Content → Main menu; 'loading' until branding request finishes */
  const [adminNav, setAdminNav] = useState<'loading' | StorefrontHeaderMenuItem[] | undefined>(undefined);
  const [proHeroImageUrl, setProHeroImageUrl] = useState<string | null>(null);
  /** Batched with branding on store home so Hero / BrowseCategories / coupons do not refetch or show extra skeletons. */
  const [homePrefetch, setHomePrefetch] = useState<StorefrontHomePrefetchValue | null>(null);

  useLayoutEffect(() => {
    if (storeSlug) {
      setEffectiveSlug(storeSlug);
      return;
    }
    setEffectiveSlug(storeSlugFromHostname());
  }, [storeSlug]);

  useEffect(() => {
    if (!effectiveSlug) {
      setLayoutKind('loading');
      setAppEmbeds([]);
      setAdminNav(undefined);
      setHomePrefetch(null);
      return;
    }
    let cancelled = false;
    setLayoutKind('loading');
    setAppEmbeds([]);
    setCompanyLogoUrl(null);
    setProHeroImageUrl(null);
    setAdminNav('loading');
    setHomePrefetch(null);

    const applyBrandingFailure = () => {
      setCustomTheme(null);
      setAppEmbeds([]);
      setCompanyLogoUrl(null);
      setProHeroImageUrl(null);
      setAdminNav([]);
      setLayoutKind('classic');
    };

    Promise.allSettled([
      storefrontRequest<BrandingResponse>('/storefront/store-branding', { store_slug: effectiveSlug }),
      storefrontRequest<CouponsBootstrapResponse>('/storefront/coupons', { store: effectiveSlug }),
      storefrontRequest<StorefrontBrowseCategoriesResponse>('/storefront/browse-categories', {
        store: effectiveSlug,
      }),
    ]).then((results) => {
      if (cancelled) return;
      const brandOutcome = results[0];
      const couponOutcome = results[1];
      const browseOutcome = results[2];

      const couponRes = couponOutcome.status === 'fulfilled' ? couponOutcome.value : null;
      const browseRes = browseOutcome.status === 'fulfilled' ? browseOutcome.value : null;
      const rows = Array.isArray(browseRes?.data?.categories) ? browseRes.data!.categories : [];
      setHomePrefetch({
        browseCategoryRows: rows,
        volumePromo: couponRes?.volume_promo ?? null,
      });

      if (brandOutcome.status !== 'fulfilled') {
        applyBrandingFailure();
        return;
      }
      const res = brandOutcome.value;
      const raw = res.data?.storefront_home;
      const embeds = Array.isArray(res.data?.storefront_app_embeds) ? res.data!.storefront_app_embeds! : [];
      const menuRaw = res.data?.header_menu_items;
      setAdminNav(Array.isArray(menuRaw) ? menuRaw : []);
      setCompanyLogoUrl(
        typeof res.data?.company_logo_url === 'string' && res.data.company_logo_url.trim() !== ''
          ? res.data.company_logo_url
          : null
      );
      const proHero = res.data?.pro_dashboard_hero_image_url;
      setProHeroImageUrl(typeof proHero === 'string' && proHero.trim() !== '' ? proHero.trim() : null);
      setAppEmbeds(embeds);
      if (raw == null) {
        setCustomTheme(null);
        setLayoutKind('classic');
      } else {
        setCustomTheme(mergeStorefrontHomeTheme(raw));
        setLayoutKind('custom');
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

  const heroSettingsResolved = useMemo(
    () => heroSettingsForStorefront(customTheme, proHeroImageUrl),
    [customTheme, proHeroImageUrl]
  );

  if (!effectiveSlug) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <DefaultMarketplaceHome storeSlug={null} heroSettings={null} />
        <Footer />
      </main>
    );
  }

  /** One full-page loader until theme, hero/browse/coupon APIs, and shared catalog (stores/products) finish. */
  const catalogStillLoading = Boolean(storefront?.loading);
  const showPrimaryLoader = layoutKind === 'loading' || catalogStillLoading;

  const prefetchPayload: StorefrontHomePrefetchValue =
    homePrefetch ?? { browseCategoryRows: [], volumePromo: null };

  if (showPrimaryLoader) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
        >
          <div
            className="h-11 w-11 shrink-0 animate-spin rounded-full border-[3px] border-gray-200 border-t-mint"
            aria-hidden
          />
          <p className="text-sm font-medium text-gray-700">Loading storefront…</p>
        </div>
      </main>
    );
  }

  if (layoutKind === 'classic') {
    return (
      <main className="min-h-screen bg-white">
        <StorefrontHomePrefetchProvider value={prefetchPayload}>
          <StorefrontAppEmbedScripts embeds={appEmbeds} />
          <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
          <DefaultMarketplaceHome storeSlug={effectiveSlug} heroSettings={heroSettingsResolved} />
          <Footer />
        </StorefrontHomePrefetchProvider>
      </main>
    );
  }

  if (!customTheme) {
    return (
      <main className="min-h-screen bg-white">
        <StorefrontHomePrefetchProvider value={prefetchPayload}>
          <StorefrontAppEmbedScripts embeds={appEmbeds} />
          <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
          <DefaultMarketplaceHome storeSlug={effectiveSlug} heroSettings={heroSettingsResolved} />
          <Footer />
        </StorefrontHomePrefetchProvider>
      </main>
    );
  }

  const posterConfig = customTheme.poster_promo ?? mergePosterPromoSettings(null);

  /**
   * Default Mint Marketplace theme = same DOM as the global home (`/`): one shared component tree,
   * not the section renderer (which adds extra wrappers/spacing and theme shell).
   * Theme colors/fonts still apply via CSS variables on <main> (previously missing here).
   */
  if (isMintMarketplaceSectionOrder(customTheme.sections)) {
    return (
      <main className="min-h-screen" style={themeToCssVars(customTheme.theme)}>
        <StorefrontHomePrefetchProvider value={prefetchPayload}>
          <StorefrontAppEmbedScripts embeds={appEmbeds} />
          <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
          <DefaultMarketplaceHome
            storeSlug={effectiveSlug}
            heroSettings={heroSettingsResolved}
            posterPromo={posterConfig}
            posterWideLayout={customTheme.theme.wideLayout}
          />
          <Footer />
        </StorefrontHomePrefetchProvider>
      </main>
    );
  }

  const spacing = customTheme.theme.sectionSpacing;
  const innerClass = customTheme.theme.wideLayout ? '' : 'max-w-6xl mx-auto';

  return (
    <main className="min-h-screen" style={outerStyle}>
      <StorefrontHomePrefetchProvider value={prefetchPayload}>
        <StorefrontAppEmbedScripts embeds={appEmbeds} />
        <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
        <div className={innerClass}>
          {renderSectionsWithPosterSlot(
            customTheme.sections,
            effectiveSlug,
            spacing,
            proHeroImageUrl,
            posterConfig,
            customTheme.theme.wideLayout
          )}
        </div>
        <Footer />
      </StorefrontHomePrefetchProvider>
    </main>
  );
}
