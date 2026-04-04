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
import CouponPromoSection from '@/components/CouponPromoSection';
import PosterPromoSection from '@/components/PosterPromoSection';
import StorefrontAppEmbedScripts from '@/components/StorefrontAppEmbedScripts';
import { storefrontRequest, type StorefrontHeaderMenuItem } from '@/lib/storefrontApi';
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
        <>
          <Hero
            settings={resolveStorefrontHeroSettings(section.settings ?? null, proHeroImageUrl)}
            storeSlug={storeSlug}
          />
          <CouponPromoSection storeSlug={storeSlug} />
        </>
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
      <Hero settings={heroSettings ?? undefined} storeSlug={storeSlug} />
      <CouponPromoSection storeSlug={storeSlug} />
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
  const [effectiveSlug, setEffectiveSlug] = useState<string | null>(storeSlug);
  /** Same stack as the main marketplace (mint-shop.pro) until a custom theme is saved in admin. */
  const [layoutKind, setLayoutKind] = useState<'loading' | 'classic' | 'custom'>('loading');
  const [customTheme, setCustomTheme] = useState<StorefrontHomeTheme | null>(null);
  const [appEmbeds, setAppEmbeds] = useState<StorefrontAppEmbed[]>([]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  /** Admin Content → Main menu; 'loading' until branding request finishes */
  const [adminNav, setAdminNav] = useState<'loading' | StorefrontHeaderMenuItem[] | undefined>(undefined);
  const [proHeroImageUrl, setProHeroImageUrl] = useState<string | null>(null);

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
      setAppEmbeds([]);
      setAdminNav(undefined);
      return;
    }
    let cancelled = false;
    setLayoutKind('loading');
    setAppEmbeds([]);
    setCompanyLogoUrl(null);
    setProHeroImageUrl(null);
    setAdminNav('loading');
    storefrontRequest<BrandingResponse>('/storefront/store-branding', { store_slug: effectiveSlug })
      .then((res) => {
        if (cancelled) return;
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
      })
      .catch(() => {
        if (!cancelled) {
          setCustomTheme(null);
          setAppEmbeds([]);
          setCompanyLogoUrl(null);
          setProHeroImageUrl(null);
          setAdminNav([]);
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

  if (layoutKind === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <StorefrontAppEmbedScripts embeds={appEmbeds} />
        <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
        {/* Coupon strip + API need the store slug; this block used to hide the whole home (no promo) until branding finished */}
        <CouponPromoSection storeSlug={effectiveSlug} />
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center gap-4 border-t border-gray-100 bg-white px-4 py-16"
        >
          <div
            className="h-11 w-11 shrink-0 animate-spin rounded-full border-[3px] border-gray-200 border-t-mint"
            aria-hidden
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Loading storefront…</p>
            <p className="mt-1 text-xs text-gray-500">Fetching your theme and navigation</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (layoutKind === 'classic') {
    return (
      <main className="min-h-screen bg-white">
        <StorefrontAppEmbedScripts embeds={appEmbeds} />
        <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
        <DefaultMarketplaceHome storeSlug={effectiveSlug} heroSettings={heroSettingsResolved} />
        <Footer />
      </main>
    );
  }

  if (!customTheme) {
    return (
      <main className="min-h-screen bg-white">
        <StorefrontAppEmbedScripts embeds={appEmbeds} />
        <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
        <DefaultMarketplaceHome storeSlug={effectiveSlug} heroSettings={heroSettingsResolved} />
        <Footer />
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
        <StorefrontAppEmbedScripts embeds={appEmbeds} />
        <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
        <DefaultMarketplaceHome
          storeSlug={effectiveSlug}
          heroSettings={heroSettingsResolved}
          posterPromo={posterConfig}
          posterWideLayout={customTheme.theme.wideLayout}
        />
        <Footer />
      </main>
    );
  }

  const spacing = customTheme.theme.sectionSpacing;
  const innerClass = customTheme.theme.wideLayout ? '' : 'max-w-6xl mx-auto';
  const hasEnabledHero = customTheme.sections.some((s) => s.enabled !== false && s.type === 'default_hero');

  return (
    <main className="min-h-screen" style={outerStyle}>
      <StorefrontAppEmbedScripts embeds={appEmbeds} />
      <Header companyLogoUrl={companyLogoUrl} adminNav={adminNav} />
      {!hasEnabledHero ? <CouponPromoSection storeSlug={effectiveSlug} /> : null}
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
    </main>
  );
}
