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
};

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
  return { theme, sections, preset };
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
