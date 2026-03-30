'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getImageDisplayUrl } from '@/lib/api';
import { formatCategoryLabel } from '@/lib/categories';
import { storefrontRequest, type StorefrontBrowseCategoriesResponse } from '@/lib/storefrontApi';
import {
  DEFAULT_MARKETPLACE_HERO_IMAGE_URL,
  mergeDefaultHeroSettings,
  type HeroPopularLink,
  type HeroSearchCategory,
} from '@/lib/storefrontHomeTheme';

const POPULAR_CATEGORY_LIMIT = 8;

type HeroProps = {
  variant?: 'default' | 'video';
  /** From theme section `default_hero` (admin Theme editor). */
  settings?: Record<string, unknown> | null;
  /** When set, hero loads category dropdown + popular links from GET /storefront/browse-categories */
  storeSlug?: string | null;
};

export default function Hero({ variant = 'default', settings, storeSlug = null }: HeroProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  /** null = fetch not finished yet (use theme defaults); array after fetch (may be empty → theme) */
  const [catalogCategories, setCatalogCategories] = useState<{ id: string; count: number }[] | null>(null);

  const hero = useMemo(() => mergeDefaultHeroSettings(settings ?? undefined), [settings]);

  useEffect(() => {
    let cancelled = false;
    setCatalogCategories(null);
    storefrontRequest<StorefrontBrowseCategoriesResponse>('/storefront/browse-categories', {
      ...(storeSlug ? { store: storeSlug } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data?.categories) ? res.data!.categories! : [];
        setCatalogCategories(rows);
      })
      .catch(() => {
        if (!cancelled) setCatalogCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const searchCategories: HeroSearchCategory[] = useMemo(() => {
    if (catalogCategories !== null && catalogCategories.length > 0) {
      return [
        { value: 'all', label: 'All Categories' },
        ...catalogCategories.map((c) => ({
          value: c.id,
          label: formatCategoryLabel(c.id),
        })),
      ];
    }
    return hero.searchCategories ?? [];
  }, [catalogCategories, hero.searchCategories]);

  const popularLinks: HeroPopularLink[] = useMemo(() => {
    if (catalogCategories !== null && catalogCategories.length > 0) {
      return catalogCategories.slice(0, POPULAR_CATEGORY_LIMIT).map((c) => ({
        label: formatCategoryLabel(c.id),
        url: storeSlug
          ? `/products?category=${encodeURIComponent(c.id)}&store=${encodeURIComponent(storeSlug)}`
          : `/products?category=${encodeURIComponent(c.id)}`,
      }));
    }
    return hero.popularLinks ?? [];
  }, [catalogCategories, hero.popularLinks, storeSlug]);

  useEffect(() => {
    if (searchCategories.length === 0) return;
    const ok = searchCategories.some((c) => c.value === selectedCategory);
    if (!ok) setSelectedCategory(searchCategories[0].value);
  }, [searchCategories, selectedCategory]);

  const bgUrl = useMemo(() => {
    const u = hero.backgroundImageUrl?.trim() ?? '';
    if (!u) return DEFAULT_MARKETPLACE_HERO_IMAGE_URL;
    return getImageDisplayUrl(u);
  }, [hero.backgroundImageUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (storeSlug) params.set('store', storeSlug);
    router.push(`/products?${params.toString()}`);
  };

  if (variant === 'video') {
    const primary = 'var(--sf-color-primary, #0f766e)';
    const accent = 'var(--sf-color-accent, #99f6e4)';
    return (
      <section
        className="relative h-[480px] md:h-[520px] overflow-hidden flex items-center"
        style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80')] bg-cover bg-center" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-white">
            <p className="text-xs uppercase tracking-[0.2em] mb-3 opacity-80">Featured</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Motion in Minimal</h1>
            <p className="text-slate-300 text-sm md:text-base mb-8">
              Curated pieces for modern living. Tap play to see the story, or shop the collection.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-6 py-3 text-sm font-semibold bg-white text-slate-900 shadow-lg transition hover:bg-slate-100"
                style={{ borderRadius: 'var(--sf-button-radius, 9999px)', borderWidth: 'var(--sf-button-border, 0)', borderStyle: 'solid', borderColor: primary }}
              >
                Explore Video
              </button>
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-6 py-3 text-sm font-semibold border-2 border-white/80 text-white bg-transparent hover:bg-white/10"
                style={{ borderRadius: 'var(--sf-button-radius, 9999px)' }}
              >
                Shop Now
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-105"
              style={{ backgroundColor: accent, color: primary }}
              aria-label="Play video"
            >
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const primary = 'var(--sf-color-primary, #0f766e)';
  const accent = 'var(--sf-color-accent, #99f6e4)';

  return (
    <section className="relative h-[500px] md:h-[550px] overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${bgUrl.replace(/"/g, '\\"')}")`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/20 to-white/95 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent z-10" />
        <div
          className="absolute inset-0 z-10 animate-pulse opacity-90"
          style={{
            background: `linear-gradient(to bottom right, color-mix(in srgb, ${primary} 20%, transparent), transparent, color-mix(in srgb, #3b82f6 20%, transparent))`,
          }}
        />
      </div>

      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)` }}
        />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center pointer-events-auto">
        <div className="max-w-2xl" style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}>
          <div
            className="inline-flex items-center backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-fade-in border shadow-md"
            style={{
              backgroundColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
              color: primary,
              borderColor: `color-mix(in srgb, ${primary} 25%, transparent)`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full mr-2 animate-pulse shrink-0"
              style={{ backgroundColor: primary }}
            />
            {hero.badgeText}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 animate-slide-up leading-tight">
            {hero.headlineLine1}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${primary}, color-mix(in srgb, ${primary} 65%, #0f172a))`,
              }}
            >
              {hero.headlineAccent}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-6 animate-slide-up delay-100 leading-relaxed max-w-xl">
            {hero.description}
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 animate-slide-up delay-200 border border-white/20"
          >
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={hero.searchPlaceholder}
                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[color:var(--sf-color-primary,#0f766e)] focus:border-[color:var(--sf-color-primary,#0f766e)] transition-all text-sm text-gray-800 bg-white placeholder:text-gray-400"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border-2 w-full border-gray-200 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-[color:var(--sf-color-primary,#0f766e)] focus:border-[color:var(--sf-color-primary,#0f766e)] transition-all text-sm font-medium text-gray-800"
              >
                {searchCategories.map((c) => (
                  <option key={`${c.value}-${c.label}`} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 whitespace-nowrap hover:opacity-95"
              style={{
                backgroundColor: primary,
                borderRadius: 'var(--sf-button-radius, 0.5rem)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in delay-300">
            <span className="text-sm text-gray-600 font-medium">Popular:</span>
            {popularLinks.map((item) => (
              <HeroPopularPill key={`${item.label}-${item.url}`} item={item} primary={primary} accent={accent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPopularPill({
  item,
  primary,
  accent,
}: {
  item: HeroPopularLink;
  primary: string;
  accent: string;
}) {
  const router = useRouter();
  const external =
    /^https?:\/\//i.test(item.url) || item.url.startsWith('mailto:') || item.url.startsWith('tel:');

  const style: React.CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
    color: `color-mix(in srgb, ${primary} 90%, #0f172a)`,
    borderColor: `color-mix(in srgb, ${primary} 22%, transparent)`,
  };

  const className =
    'text-sm px-3 py-1.5 rounded-full font-medium border transition-all hover:scale-105 hover:opacity-90';

  if (external) {
    return (
      <a href={item.url} className={className} style={style} rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }

  return (
    <button type="button" onClick={() => router.push(item.url)} className={className} style={style}>
      {item.label}
    </button>
  );
}
