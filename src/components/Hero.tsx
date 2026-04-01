'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getImageDisplayUrl } from '@/lib/api';
import { formatCategoryLabel } from '@/lib/categories';
import { storefrontRequest, type StorefrontBrowseCategoriesResponse } from '@/lib/storefrontApi';
import {
  mergeDefaultHeroSettings,
  resolveHeroSlidesForRender,
  getHeroCarouselAutoplayMs,
  type HeroPopularLink,
  type HeroSearchCategory,
  type ResolvedHeroSlide,
} from '@/lib/storefrontHomeTheme';

type HeroProps = {
  variant?: 'default' | 'video';
  /** From theme section `default_hero` (admin Theme editor). */
  settings?: Record<string, unknown> | null;
  /** When set, hero loads the category dropdown from GET /storefront/browse-categories */
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale categories before refetch
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

  /** Theme-only quick links; hidden when catalog API fills the dropdown (same categories would repeat). */
  const popularLinks: HeroPopularLink[] = useMemo(() => {
    if (catalogCategories !== null && catalogCategories.length > 0) {
      return [];
    }
    const raw = hero.popularLinks ?? [];
    const seen = new Set<string>();
    return raw.filter((p) => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });
  }, [catalogCategories, hero.popularLinks]);

  useEffect(() => {
    if (searchCategories.length === 0) return;
    const ok = searchCategories.some((c) => c.value === selectedCategory);
    if (!ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- align selection when category list updates
      setSelectedCategory(searchCategories[0].value);
    }
  }, [searchCategories, selectedCategory]);

  const slides: ResolvedHeroSlide[] = useMemo(() => resolveHeroSlidesForRender(hero), [hero]);

  const displaySlides = useMemo(
    () =>
      slides.map((s) => ({
        ...s,
        imageUrl: getImageDisplayUrl(s.imageUrl),
      })),
    [slides],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = displaySlides.length;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, slideCount - 1));
  const autoplayMs = useMemo(() => getHeroCarouselAutoplayMs(hero, slideCount), [hero, slideCount]);
  const [pauseAutoplay, setPauseAutoplay] = useState(false);
  const touchStartX = React.useRef<number | null>(null);

  useEffect(() => {
    if (autoplayMs <= 0 || pauseAutoplay || slideCount < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => {
      setActiveIndex((i) => {
        const s = Math.min(i, slideCount - 1);
        return (s + 1) % slideCount;
      });
    }, autoplayMs);
    return () => window.clearInterval(t);
  }, [autoplayMs, pauseAutoplay, slideCount]);

  const go = (dir: -1 | 1) => {
    setActiveIndex((i) => {
      const s = Math.min(i, slideCount - 1);
      return (s + dir + slideCount) % slideCount;
    });
  };

  const activeSlide = displaySlides[safeActiveIndex] ?? displaySlides[0];

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

  const overlayEnabled = hero.heroImageOverlayEnabled !== false;
  const overlayOpacityRaw =
    typeof hero.heroImageOverlayOpacity === 'number' && Number.isFinite(hero.heroImageOverlayOpacity)
      ? hero.heroImageOverlayOpacity
      : 100;
  const overlayStrength = Math.min(100, Math.max(0, overlayOpacityRaw)) / 100;
  const showHeroOverlay = overlayEnabled && overlayStrength > 0;
  const showHeroSearch = hero.heroSearchEnabled !== false;

  return (
    <section
      className="relative h-[500px] md:h-[550px] overflow-hidden outline-none"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (slideCount < 2) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(-1);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(1);
        }
      }}
      onMouseEnter={() => setPauseAutoplay(true)}
      onMouseLeave={() => setPauseAutoplay(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const x0 = touchStartX.current;
        touchStartX.current = null;
        if (x0 == null || slideCount < 2) return;
        const x1 = e.changedTouches[0]?.clientX ?? x0;
        const dx = x1 - x0;
        if (dx > 56) go(-1);
        if (dx < -56) go(1);
      }}
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 overflow-hidden z-[1]">
          <div
            className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{
              width: `${slideCount * 100}%`,
              transform: `translateX(-${(safeActiveIndex * 100) / slideCount}%)`,
            }}
          >
            {displaySlides.map((s, i) => (
              <div
                key={`${s.imageUrl}-${i}`}
                className="h-full shrink-0 bg-cover bg-center bg-no-repeat"
                style={{
                  width: `${100 / slideCount}%`,
                  backgroundImage: `url("${s.imageUrl.replace(/"/g, '\\"')}")`,
                }}
                aria-hidden={i !== safeActiveIndex}
              />
            ))}
          </div>
        </div>

        {showHeroOverlay ? (
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ opacity: overlayStrength }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/20 to-white/95" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
            <div
              className="absolute inset-0 animate-pulse opacity-90"
              style={{
                background: `linear-gradient(to bottom right, color-mix(in srgb, ${primary} 20%, transparent), transparent, color-mix(in srgb, #3b82f6 20%, transparent))`,
              }}
            />
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)` }}
              />
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-300" />
            </div>
          </div>
        ) : null}
      </div>

      {slideCount > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 rounded-full p-2.5 bg-white/90 shadow-lg border border-gray-200/80 text-gray-800 hover:bg-white transition-opacity motion-reduce:transition-none"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 rounded-full p-2.5 bg-white/90 shadow-lg border border-gray-200/80 text-gray-800 hover:bg-white transition-opacity motion-reduce:transition-none"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2"
            role="tablist"
            aria-label="Hero slides"
          >
            {displaySlides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeActiveIndex}
                aria-label={`Slide ${i + 1} of ${slideCount}`}
                onClick={() => setActiveIndex(i)}
                className="h-2.5 rounded-full transition-all motion-reduce:transition-none"
                style={{
                  width: i === safeActiveIndex ? 28 : 10,
                  backgroundColor: i === safeActiveIndex ? primary : `color-mix(in srgb, ${primary} 35%, white)`,
                  opacity: i === safeActiveIndex ? 1 : 0.65,
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >{`Slide ${safeActiveIndex + 1} of ${slideCount}: ${activeSlide.headlineLine1} ${activeSlide.headlineAccent}`}</div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center pointer-events-auto">
        <div className="max-w-2xl" style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}>
          <div key={safeActiveIndex} className="motion-reduce:animate-none">
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
              {activeSlide.badgeText}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 animate-slide-up leading-tight">
              {activeSlide.headlineLine1}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${primary}, color-mix(in srgb, ${primary} 65%, #0f172a))`,
                }}
              >
                {activeSlide.headlineAccent}
              </span>
            </h1>

            <p
              className={`text-lg md:text-xl text-gray-700 animate-slide-up delay-100 leading-relaxed max-w-xl ${
                activeSlide.ctaLabel && activeSlide.ctaUrl ? 'mb-4' : 'mb-6'
              }`}
            >
              {activeSlide.description}
            </p>

            {activeSlide.ctaLabel && activeSlide.ctaUrl ? (
              <HeroSlideCta
                label={activeSlide.ctaLabel}
                url={activeSlide.ctaUrl}
                primary={primary}
                accent={accent}
                className="mb-6 animate-slide-up delay-100"
              />
            ) : null}
          </div>

          {showHeroSearch ? (
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
              <div className="relative sm:w-[min(100%,11rem)] md:w-[min(100%,13rem)]">
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
                className="text-white px-8 py-3 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-95"
                style={{
                  backgroundColor: primary,
                  borderRadius: 'var(--sf-button-radius, 9999px)',
                }}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </form>
          ) : null}

          {popularLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in delay-300">
              <span className="text-sm text-gray-600 font-medium">Popular:</span>
              {popularLinks.map((item) => (
                <HeroPopularPill key={`${item.label}-${item.url}`} item={item} primary={primary} accent={accent} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HeroSlideCta({
  label,
  url,
  primary,
  accent,
  className,
}: {
  label: string;
  url: string;
  primary: string;
  accent: string;
  className?: string;
}) {
  const router = useRouter();
  const external =
    /^https?:\/\//i.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');

  const style: React.CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${primary} 92%, #0f172a)`,
    color: '#fff',
    borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
  };

  const cls = `inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border shadow-sm transition hover:opacity-95 ${className ?? ''}`;

  if (external) {
    return (
      <a href={url} className={cls} style={style} rel="noopener noreferrer">
        {label}
        <svg className="w-4 h-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    );
  }

  return (
    <button type="button" onClick={() => router.push(url)} className={cls} style={style}>
      {label}
      <svg className="w-4 h-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </button>
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
