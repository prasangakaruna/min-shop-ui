/**
 * Store home theme (sections + global theme settings). Stored in store.settings.storefront_home.
 */

import type { CSSProperties } from 'react';

export type HomeSectionType =
  | 'default_hero'
  | 'announcement_bar'
  | 'video_hero'
  | 'featured_collection'
  | 'multi_column'
  | 'image_with_text'
  | 'instagram_feed'
  | 'testimonials'
  | 'browse_categories'
  | 'category_products'
  | 'special_offers'
  | 'top_sellers'
  | 'new_arrivals'
  | 'user_levels'
  | 'marketplace_insights'
  | 'newsletter';

export type HomeSection = {
  id: string;
  type: HomeSectionType;
  enabled?: boolean;
  settings?: Record<string, unknown>;
};

/** One promotional tile in the home poster grid (2–4 recommended). */
export type PosterPromoItem = {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  linkUrl?: string;
  ctaLabel?: string;
};

/** Optional home poster block (admin Theme → Home sections). Renders after hero + coupon strip. */
export type PosterPromoSettings = {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
  items: PosterPromoItem[];
};

export const DEFAULT_POSTER_PROMO: PosterPromoSettings = {
  enabled: false,
  eyebrow: '',
  title: '',
  viewAllLabel: '',
  viewAllUrl: '',
  items: [],
};

export function mergePosterPromoSettings(raw: unknown): PosterPromoSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_POSTER_PROMO, items: [] };
  }
  const r = raw as Record<string, unknown>;
  const itemsIn = Array.isArray(r.items) ? r.items : [];
  const items: PosterPromoItem[] = [];
  for (const row of itemsIn.slice(0, 4)) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const imageUrl = typeof o.imageUrl === 'string' ? o.imageUrl.trim() : '';
    if (imageUrl === '') continue;
    const item: PosterPromoItem = { imageUrl };
    if (typeof o.title === 'string' && o.title.trim() !== '') item.title = o.title.trim().slice(0, 300);
    if (typeof o.subtitle === 'string' && o.subtitle.trim() !== '') item.subtitle = o.subtitle.trim().slice(0, 400);
    if (typeof o.badge === 'string' && o.badge.trim() !== '') item.badge = o.badge.trim().slice(0, 80);
    if (typeof o.linkUrl === 'string' && o.linkUrl.trim() !== '') item.linkUrl = o.linkUrl.trim().slice(0, 1000);
    if (typeof o.ctaLabel === 'string' && o.ctaLabel.trim() !== '') item.ctaLabel = o.ctaLabel.trim().slice(0, 120);
    items.push(item);
  }
  return {
    enabled: r.enabled === true,
    eyebrow: typeof r.eyebrow === 'string' ? r.eyebrow.trim().slice(0, 120) : '',
    title: typeof r.title === 'string' ? r.title.trim().slice(0, 200) : '',
    viewAllLabel: typeof r.viewAllLabel === 'string' ? r.viewAllLabel.trim().slice(0, 120) : '',
    viewAllUrl: typeof r.viewAllUrl === 'string' ? r.viewAllUrl.trim().slice(0, 1000) : '',
    items,
  };
}

export function getPosterPromoDisplayItems(config: PosterPromoSettings): PosterPromoItem[] {
  return config.items.filter((i) => i.imageUrl.trim() !== '').slice(0, 4);
}

export function shouldDisplayPosterPromo(config: PosterPromoSettings): boolean {
  return config.enabled === true && getPosterPromoDisplayItems(config).length >= 1;
}

/** Search bar category dropdown row (value `all` = no category filter). */
export type HeroSearchCategory = { value: string; label: string };

/** Quick links under the hero search (“Popular”). */
export type HeroPopularLink = { label: string; url: string };

/** One hero carousel slide; empty optional fields fall back to section-wide defaults after merge. */
export type HeroSlide = {
  imageUrl: string;
  badgeText?: string;
  headlineLine1?: string;
  headlineAccent?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type HeroCarouselSettings = {
  /** 0 = off. Default 6000 when there are 2+ slides and this is omitted. */
  autoplayMs?: number;
};

/** Fully resolved slide for rendering (all copy fields filled from defaults). */
export type ResolvedHeroSlide = {
  imageUrl: string;
  badgeText: string;
  headlineLine1: string;
  headlineAccent: string;
  description: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

/** Default hero art for the marketplace and any store that has not set a custom hero image. */
export const DEFAULT_MARKETPLACE_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80';

const DEFAULT_MARKETPLACE_HERO_PHOTO_ID = 'photo-1600596542815-ffad4c1539a9';

/** True if the URL is empty or points at the stock Mint marketplace villa image (not a store-specific upload). */
export function isDefaultMarketplaceHeroImageUrl(url: string): boolean {
  const t = url.trim().toLowerCase();
  if (t === '') return true;
  return t.includes(DEFAULT_MARKETPLACE_HERO_PHOTO_ID);
}

/**
 * Marketplace hero (`default_hero` section). Stored in section.settings JSON.
 * Theme colors come from storefront_home.theme (CSS variables on the page).
 */
export type DefaultHeroSectionSettings = {
  badgeText?: string;
  headlineLine1?: string;
  headlineAccent?: string;
  description?: string;
  searchPlaceholder?: string;
  /** Store-only custom full-bleed background. Omit or leave empty to use {@link DEFAULT_MARKETPLACE_HERO_IMAGE_URL}. */
  backgroundImageUrl?: string;
  /**
   * When non-empty, the hero uses these slides only (carousel if 2+). Per-slide copy overrides
   * section fields when set. The single `backgroundImageUrl` is ignored until all slides are removed.
   */
  heroSlides?: HeroSlide[];
  heroCarousel?: HeroCarouselSettings;
  searchCategories?: HeroSearchCategory[];
  popularLinks?: HeroPopularLink[];
  /**
   * Light wash + gradients over the hero photo. When false, the background image stays fully visible
   * (text may need strong photos — tune headline colors in “Colors & fonts” if needed).
   */
  heroImageOverlayEnabled?: boolean;
  /** 0–100; strength of the overlay stack. Ignored when `heroImageOverlayEnabled` is false. Default 100. */
  heroImageOverlayOpacity?: number;
  /**
   * When false, the storefront hero hides the search field, category filter, and Search button (headline/CTA stay).
   * Default true.
   */
  heroSearchEnabled?: boolean;
};

export const DEFAULT_HERO_SECTION_SETTINGS: DefaultHeroSectionSettings = {
  badgeText: 'MINT CONDITION MARKETPLACE',
  headlineLine1: 'Sell Your Assets',
  headlineAccent: 'With Ease.',
  description:
    'The premier marketplace for high-value trade. Browse verified cars, luxury villas, and professional tech from trusted sellers.',
  searchPlaceholder: 'Search for cars, villas, electronics...',
  searchCategories: [
    { value: 'all', label: 'All Categories' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'real estate', label: 'Real Estate' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'groceries', label: 'Groceries' },
  ],
  popularLinks: [
    { label: 'Vehicles', url: '/vehicles' },
    { label: 'Real Estate', url: '/real-estate' },
    { label: 'Electronics', url: '/electronics' },
    { label: 'Groceries', url: '/groceries' },
  ],
  heroImageOverlayEnabled: true,
  heroImageOverlayOpacity: 100,
  heroSearchEnabled: true,
};

function parseHeroSearchCategories(raw: unknown): HeroSearchCategory[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: HeroSearchCategory[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const value = String(r.value ?? '').trim();
    const label = typeof r.label === 'string' ? r.label.trim() : '';
    if (value === '' || label === '') continue;
    out.push({ value, label });
  }
  return out.length > 0 ? out : undefined;
}

function parseHeroPopularLinks(raw: unknown): HeroPopularLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: HeroPopularLink[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const label = typeof r.label === 'string' ? r.label.trim() : '';
    const url = typeof r.url === 'string' ? r.url.trim() : '';
    if (label === '' || url === '') continue;
    out.push({ label, url });
  }
  return out.length > 0 ? out : undefined;
}

function parseHeroSlides(raw: unknown): HeroSlide[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: HeroSlide[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const imageUrl = typeof r.imageUrl === 'string' ? r.imageUrl.trim() : '';
    if (imageUrl === '') continue;
    const slide: HeroSlide = { imageUrl };
    if (typeof r.badgeText === 'string' && r.badgeText.trim() !== '') slide.badgeText = r.badgeText.trim();
    if (typeof r.headlineLine1 === 'string' && r.headlineLine1.trim() !== '') slide.headlineLine1 = r.headlineLine1.trim();
    if (typeof r.headlineAccent === 'string' && r.headlineAccent.trim() !== '') slide.headlineAccent = r.headlineAccent.trim();
    if (typeof r.description === 'string' && r.description.trim() !== '') slide.description = r.description.trim();
    if (typeof r.ctaLabel === 'string' && r.ctaLabel.trim() !== '') slide.ctaLabel = r.ctaLabel.trim();
    if (typeof r.ctaUrl === 'string' && r.ctaUrl.trim() !== '') slide.ctaUrl = r.ctaUrl.trim();
    out.push(slide);
  }
  return out.length > 0 ? out : undefined;
}

function parseHeroCarousel(raw: unknown): HeroCarouselSettings | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const autoplayMs = r.autoplayMs;
  if (typeof autoplayMs !== 'number' || !Number.isFinite(autoplayMs) || autoplayMs < 0) return undefined;
  return { autoplayMs };
}

/**
 * When `heroSlides` is set, returns those slides with defaults applied per slide.
 * Otherwise a single slide from `backgroundImageUrl` + section copy.
 */
export function resolveHeroSlidesForRender(merged: DefaultHeroSectionSettings): ResolvedHeroSlide[] {
  const badgeText = merged.badgeText ?? DEFAULT_HERO_SECTION_SETTINGS.badgeText!;
  const headlineLine1 = merged.headlineLine1 ?? DEFAULT_HERO_SECTION_SETTINGS.headlineLine1!;
  const headlineAccent = merged.headlineAccent ?? DEFAULT_HERO_SECTION_SETTINGS.headlineAccent!;
  const description = merged.description ?? DEFAULT_HERO_SECTION_SETTINGS.description!;

  const fromSlide = (s: HeroSlide): ResolvedHeroSlide => {
    const row: ResolvedHeroSlide = {
      imageUrl: s.imageUrl,
      badgeText: s.badgeText?.trim() || badgeText,
      headlineLine1: s.headlineLine1?.trim() || headlineLine1,
      headlineAccent: s.headlineAccent?.trim() || headlineAccent,
      description: s.description?.trim() || description,
    };
    const ctaL = s.ctaLabel?.trim() ?? '';
    const ctaU = s.ctaUrl?.trim() ?? '';
    if (ctaL !== '' && ctaU !== '') {
      row.ctaLabel = ctaL;
      row.ctaUrl = ctaU;
    }
    return row;
  };

  const slides = merged.heroSlides;
  if (slides && slides.length > 0) {
    return slides.map(fromSlide);
  }

  let bg = merged.backgroundImageUrl?.trim() ?? '';
  if (bg === '' || isDefaultMarketplaceHeroImageUrl(bg)) {
    bg = DEFAULT_MARKETPLACE_HERO_IMAGE_URL;
  }
  return [
    {
      imageUrl: bg,
      badgeText,
      headlineLine1,
      headlineAccent,
      description,
    },
  ];
}

/** Autoplay interval in ms; 0 when disabled or only one slide. */
export function getHeroCarouselAutoplayMs(merged: DefaultHeroSectionSettings, slideCount: number): number {
  if (slideCount < 2) return 0;
  const v = merged.heroCarousel?.autoplayMs;
  if (v === 0) return 0;
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  return 6000;
}

function themeHasHeroSlideImages(raw: Record<string, unknown>): boolean {
  const slides = raw.heroSlides;
  if (!Array.isArray(slides)) return false;
  return slides.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const u = String((row as Record<string, unknown>).imageUrl ?? '').trim();
    return u !== '';
  });
}

/** Merge saved section.settings with built-in defaults for the marketplace hero. */
export function mergeDefaultHeroSettings(
  raw: Record<string, unknown> | undefined | null
): DefaultHeroSectionSettings {
  const base: DefaultHeroSectionSettings = { ...DEFAULT_HERO_SECTION_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;

  if (typeof raw.badgeText === 'string' && raw.badgeText.trim() !== '') base.badgeText = raw.badgeText.trim();
  if (typeof raw.headlineLine1 === 'string' && raw.headlineLine1.trim() !== '') base.headlineLine1 = raw.headlineLine1.trim();
  if (typeof raw.headlineAccent === 'string' && raw.headlineAccent.trim() !== '') base.headlineAccent = raw.headlineAccent.trim();
  if (typeof raw.description === 'string' && raw.description.trim() !== '') base.description = raw.description.trim();
  if (typeof raw.searchPlaceholder === 'string' && raw.searchPlaceholder.trim() !== '')
    base.searchPlaceholder = raw.searchPlaceholder.trim();
  if (typeof raw.backgroundImageUrl === 'string') {
    const bg = raw.backgroundImageUrl.trim();
    if (bg !== '' && !isDefaultMarketplaceHeroImageUrl(bg)) {
      base.backgroundImageUrl = bg;
    }
  }

  const cats = parseHeroSearchCategories(raw.searchCategories);
  if (cats) base.searchCategories = cats;
  const pop = parseHeroPopularLinks(raw.popularLinks);
  if (pop) base.popularLinks = pop;

  const heroSlides = parseHeroSlides(raw.heroSlides);
  if (heroSlides) base.heroSlides = heroSlides;
  const heroCarousel = parseHeroCarousel(raw.heroCarousel);
  if (heroCarousel) base.heroCarousel = heroCarousel;

  if (typeof raw.heroImageOverlayEnabled === 'boolean') {
    base.heroImageOverlayEnabled = raw.heroImageOverlayEnabled;
  }
  const opRaw = raw.heroImageOverlayOpacity;
  if (typeof opRaw === 'number' && Number.isFinite(opRaw)) {
    base.heroImageOverlayOpacity = Math.min(100, Math.max(0, opRaw));
  } else if (typeof opRaw === 'string' && opRaw.trim() !== '') {
    const n = parseFloat(opRaw);
    if (Number.isFinite(n)) {
      base.heroImageOverlayOpacity = Math.min(100, Math.max(0, n));
    }
  }

  if (typeof raw.heroSearchEnabled === 'boolean') {
    base.heroSearchEnabled = raw.heroSearchEnabled;
  }

  return base;
}

/**
 * Built-in theme templates. `mint_marketplace` is the default: same section stack as the public
 * marketplace home at `/` (search hero, categories, offers, etc.).
 */
export type StorefrontHomeThemePresetId = 'mint_marketplace';

export const MINT_MARKETPLACE_PRESET: StorefrontHomeThemePresetId = 'mint_marketplace';

export const BUILTIN_THEME_PRESETS: {
  id: StorefrontHomeThemePresetId;
  name: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'mint_marketplace',
    name: 'Mint Marketplace',
    shortLabel: 'Marketplace (default)',
    description:
      'Same layout as the public home page (/) — marketplace hero, browse categories, special offers, testimonials, newsletter, and more.',
  },
];

export type StorefrontHomeThemeSettings = {
  fontHeading: string;
  fontBody: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorAccent: string;
  /** 0–100, maps to border-radius on buttons */
  buttonCornerRoundness: number;
  /** px */
  buttonBorderWeight: number;
  wideLayout: boolean;
  /** px between sections */
  sectionSpacing: number;
};

export type StorefrontHomeTheme = {
  sections: HomeSection[];
  theme: StorefrontHomeThemeSettings;
  /** When set, this store home was derived from a built-in preset (see BUILTIN_THEME_PRESETS). */
  preset?: StorefrontHomeThemePresetId | null;
  /** Promotional poster grid after hero (optional). */
  poster_promo?: PosterPromoSettings;
};

/**
 * Merge Pro → Customize hero upload into saved Marketplace hero settings when the theme has no
 * real custom background (empty, or the stock Mint villa image). Used for both the classic home
 * layout and per-section rendering when the section order differs from the default stack.
 */
export function resolveStorefrontHeroSettings(
  sectionSettings: Record<string, unknown> | undefined | null,
  proDashboardHeroImageUrl: string | null,
): Record<string, unknown> {
  const raw =
    sectionSettings && typeof sectionSettings === 'object'
      ? ({ ...sectionSettings } as Record<string, unknown>)
      : {};
  const themeBg = typeof raw.backgroundImageUrl === 'string' ? raw.backgroundImageUrl.trim() : '';
  const themeHasRealCustomBg = themeBg !== '' && !isDefaultMarketplaceHeroImageUrl(themeBg);
  const hasSlideImages = themeHasHeroSlideImages(raw);

  if (proDashboardHeroImageUrl && !themeHasRealCustomBg && !hasSlideImages) {
    return { ...raw, backgroundImageUrl: proDashboardHeroImageUrl };
  }
  return raw;
}

/** null = no overrides and no Pro image (Hero uses built-in defaults only). */
export function heroSettingsForStorefront(
  customTheme: StorefrontHomeTheme | null,
  proDashboardHeroImageUrl: string | null,
): Record<string, unknown> | null {
  const secSettings = customTheme?.sections.find((s) => s.type === 'default_hero')?.settings;
  const resolved = resolveStorefrontHeroSettings(secSettings, proDashboardHeroImageUrl);
  if (Object.keys(resolved).length === 0 && !proDashboardHeroImageUrl) return null;
  return resolved;
}

export const SECTION_CATALOG: { type: HomeSectionType; label: string }[] = [
  { type: 'default_hero', label: 'Marketplace hero' },
  { type: 'announcement_bar', label: 'Announcement Bar' },
  { type: 'video_hero', label: 'Video Hero' },
  { type: 'featured_collection', label: 'Featured Collection' },
  { type: 'multi_column', label: 'Multi-column' },
  { type: 'image_with_text', label: 'Image with Text' },
  { type: 'instagram_feed', label: 'Instagram Feed' },
  { type: 'testimonials', label: 'Testimonials' },
  { type: 'browse_categories', label: 'Browse Categories' },
  { type: 'category_products', label: 'Category Products' },
  { type: 'special_offers', label: 'Special Offers' },
  { type: 'top_sellers', label: 'Top Sellers' },
  { type: 'new_arrivals', label: 'New Arrivals' },
  { type: 'user_levels', label: 'User Levels' },
  { type: 'marketplace_insights', label: 'Marketplace Insights' },
  { type: 'newsletter', label: 'Newsletter' },
];

export const DEFAULT_THEME_SETTINGS: StorefrontHomeThemeSettings = {
  fontHeading: 'Inter, system-ui, sans-serif',
  fontBody: 'Inter, system-ui, sans-serif',
  colorPrimary: '#0f766e',
  colorSecondary: '#334155',
  colorBackground: '#ffffff',
  colorAccent: '#99f6e4',
  buttonCornerRoundness: 100,
  buttonBorderWeight: 2,
  wideLayout: true,
  sectionSpacing: 64,
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultSections(): HomeSection[] {
  return [
    { id: newId(), type: 'announcement_bar', enabled: true, settings: { text: 'FREE SHIPPING ON ALL ORDERS OVER $150 • LIMITED TIME OFFER' } },
    { id: newId(), type: 'video_hero', enabled: true },
    { id: newId(), type: 'featured_collection', enabled: true },
    { id: newId(), type: 'multi_column', enabled: true },
    { id: newId(), type: 'image_with_text', enabled: true },
    { id: newId(), type: 'instagram_feed', enabled: true },
    { id: newId(), type: 'testimonials', enabled: true },
  ];
}

/**
 * Same section order as the global marketplace home (`/`) and store classic layout (`/?store=` with no saved theme).
 */
export function createClassicStoreSections(): HomeSection[] {
  return [
    { id: newId(), type: 'default_hero', enabled: true },
    { id: newId(), type: 'browse_categories', enabled: true },
    { id: newId(), type: 'category_products', enabled: true },
    { id: newId(), type: 'special_offers', enabled: true },
    { id: newId(), type: 'featured_collection', enabled: true },
    { id: newId(), type: 'top_sellers', enabled: true },
    { id: newId(), type: 'new_arrivals', enabled: true },
    { id: newId(), type: 'multi_column', enabled: true },
    { id: newId(), type: 'user_levels', enabled: true },
    { id: newId(), type: 'testimonials', enabled: true },
    { id: newId(), type: 'marketplace_insights', enabled: true },
    { id: newId(), type: 'newsletter', enabled: true },
  ];
}

/** @deprecated Use createClassicStoreSections — kept name for any older imports */
export function createFullDefaultSections(): HomeSection[] {
  return createClassicStoreSections();
}

/** True when visible sections match the Mint Marketplace default (same as `/`). */
export function isMintMarketplaceSectionOrder(sections: HomeSection[]): boolean {
  const want = createClassicStoreSections().map((s) => s.type);
  const got = sections.filter((s) => s.enabled !== false).map((s) => s.type);
  if (got.length !== want.length) return false;
  return want.every((t, i) => t === got[i]);
}

export function mergeStorefrontHomeTheme(raw: StorefrontHomeTheme | null | undefined): StorefrontHomeTheme {
  const theme = { ...DEFAULT_THEME_SETTINGS, ...(raw?.theme ?? {}) };
  const hasSavedSections = Boolean(raw?.sections && raw.sections.length > 0);
  const sections = hasSavedSections
    ? raw!.sections!.map((s) => ({ ...s, enabled: s.enabled !== false }))
    : createClassicStoreSections();
  const preset: StorefrontHomeThemePresetId | null =
    raw?.preset ?? (!hasSavedSections ? MINT_MARKETPLACE_PRESET : null);
  const poster_promo = mergePosterPromoSettings(raw?.poster_promo);
  return { theme, sections, preset, poster_promo };
}

export function themeToCssVars(t: StorefrontHomeThemeSettings): CSSProperties {
  const r = Math.min(48, (t.buttonCornerRoundness / 100) * 48);
  return {
    ['--sf-font-heading' as string]: t.fontHeading,
    ['--sf-font-body' as string]: t.fontBody,
    ['--sf-color-primary' as string]: t.colorPrimary,
    ['--sf-color-secondary' as string]: t.colorSecondary,
    ['--sf-color-background' as string]: t.colorBackground,
    ['--sf-color-accent' as string]: t.colorAccent,
    ['--sf-button-radius' as string]: `${r}px`,
    ['--sf-button-border' as string]: `${t.buttonBorderWeight}px`,
    ['--sf-section-gap' as string]: `${t.sectionSpacing}px`,
    backgroundColor: t.colorBackground,
    fontFamily: t.fontBody,
  };
}

export function buttonRadiusLabel(roundness: number): string {
  if (roundness >= 95) return 'Full';
  if (roundness >= 70) return 'Large';
  if (roundness >= 40) return 'Medium';
  if (roundness >= 15) return 'Small';
  return 'None';
}
