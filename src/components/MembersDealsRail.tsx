'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  addStorefrontCartLine,
  getImageDisplayUrl,
  getStorefrontProducts,
  setCartCount,
  setCartTokenForStore,
  type ProductVariant,
  type StorefrontProduct,
} from '@/lib/api';

const LAST_CART_STORE_KEY = 'mint_cart_store_id';

export type MembersDealsRailSettings = {
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  /** Relative or absolute URL; empty = `/products?store=…` */
  ctaUrl?: string;
  productLimit?: number;
};

function parseSettings(raw: Record<string, unknown> | null | undefined): Required<
  Omit<MembersDealsRailSettings, 'ctaUrl'>
> & { ctaUrl: string | undefined } {
  const s = raw ?? {};
  const lim = s.productLimit;
  const n = typeof lim === 'number' && Number.isFinite(lim) ? Math.floor(lim) : 14;
  return {
    headline: typeof s.headline === 'string' && s.headline.trim() !== '' ? s.headline.trim() : 'Members Save',
    subline:
      typeof s.subline === 'string' && s.subline.trim() !== ''
        ? s.subline.trim()
        : 'Member pricing on fresh picks — stack with your usual deals at checkout.',
    ctaLabel: typeof s.ctaLabel === 'string' && s.ctaLabel.trim() !== '' ? s.ctaLabel.trim() : 'View More Deals',
    ctaUrl: typeof s.ctaUrl === 'string' && s.ctaUrl.trim() !== '' ? s.ctaUrl.trim() : undefined,
    productLimit: Math.min(24, Math.max(4, n)),
  };
}

function pickVariantForCard(p: StorefrontProduct): ProductVariant | null {
  const vs = p.variants ?? [];
  if (vs.length === 0) return null;
  const inStock = (v: ProductVariant) => (v.inventory_quantity ?? 0) > 0;
  const onSale = (v: ProductVariant) => {
    const c = v.compare_at_price ? parseFloat(v.compare_at_price) : NaN;
    const pr = parseFloat(v.price);
    return Number.isFinite(c) && Number.isFinite(pr) && c > pr;
  };
  return (
    vs.find((v) => inStock(v) && onSale(v)) ??
    vs.find((v) => onSale(v)) ??
    vs.find((v) => inStock(v)) ??
    vs[0] ??
    null
  );
}

function salePercent(variant: ProductVariant): number | null {
  const c = variant.compare_at_price ? parseFloat(variant.compare_at_price) : NaN;
  const pr = parseFloat(variant.price);
  if (!Number.isFinite(c) || !Number.isFinite(pr) || c <= pr) return null;
  return Math.min(99, Math.max(1, Math.round((1 - pr / c) * 100)));
}

function cardImageUrl(p: StorefrontProduct): string {
  const u = p.image_urls?.length ? p.image_urls[0] : p.image_url ?? '';
  return getImageDisplayUrl(u) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
}

type Props = {
  storeSlug: string | null;
  settings?: Record<string, unknown> | null;
};

export default function MembersDealsRail({ storeSlug, settings: rawSettings }: Props) {
  const cfg = useMemo(() => parseSettings(rawSettings ?? undefined), [rawSettings]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const productsHref = useMemo(() => {
    if (cfg.ctaUrl) return cfg.ctaUrl;
    if (!storeSlug) return '/products';
    return `/products?store=${encodeURIComponent(storeSlug)}`;
  }, [cfg.ctaUrl, storeSlug]);

  useEffect(() => {
    if (!storeSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getStorefrontProducts({ store: storeSlug, per_page: 48, page: 1 })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []).filter((p) => pickVariantForCard(p));
        const scored = rows.map((p) => {
          const v = pickVariantForCard(p)!;
          const pct = salePercent(v);
          return { p, score: pct ?? 0 };
        });
        scored.sort((a, b) => b.score - a.score);
        setProducts(scored.map((x) => x.p).slice(0, cfg.productLimit));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug, cfg.productLimit]);

  const storeLabel = products[0]?.store?.name?.trim() || 'Members';

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [products, updateScrollState]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-deal-card]');
    const w = card?.offsetWidth ?? 220;
    el.scrollBy({ left: dir * w * 2, behavior: 'smooth' });
  };

  const onAdd = async (p: StorefrontProduct) => {
    const v = pickVariantForCard(p);
    if (!v || (v.inventory_quantity ?? 0) <= 0) return;
    setAddingId(v.id);
    try {
      const cart = await addStorefrontCartLine(p.store_id, v.id, 1);
      if (cart.cart_token) setCartTokenForStore(p.store_id, cart.cart_token);
      if (typeof window !== 'undefined') localStorage.setItem(LAST_CART_STORE_KEY, String(p.store_id));
      const total = (cart.lines ?? []).reduce((sum, l) => sum + l.quantity, 0);
      setCartCount(total);
      window.location.href = `/cart?store_id=${p.store_id}`;
    } catch {
      setAddingId(null);
    }
  };

  if (!storeSlug) return null;

  if (!loading && products.length === 0) return null;

  const primary = 'var(--sf-color-primary, #0f766e)';

  return (
    <section
      className="relative w-full overflow-hidden bg-[#f4f7f4] py-10 sm:py-12"
      aria-labelledby="members-deals-heading"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[min(22rem,70vw)] flex-col overflow-hidden rounded-3xl shadow-[0_24px_60px_-28px_rgba(15,40,25,0.35)] lg:min-h-[20rem] lg:flex-row">
          {/* Left promo panel */}
          <div className="relative flex w-full shrink-0 flex-col justify-between bg-gradient-to-br from-[#8faa8c] via-[#7d9a78] to-[#5c7a56] px-6 py-8 text-white lg:w-[min(100%,22rem)] lg:py-10 xl:w-[26rem]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=60")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-hidden
            />
            <div className="relative z-[1]">
              <div className="relative inline-block">
                <svg
                  className="h-28 w-28 text-[#1a3d2e] drop-shadow-md sm:h-32 sm:w-32"
                  viewBox="0 0 120 120"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    opacity="0.95"
                    d="M60 8c-8 18-32 38-38 58-4 12 2 28 14 34 10 5 24 2 32-8 8-10 10-24 4-36C68 44 60 28 60 8z"
                  />
                  <path
                    className="text-[#2d5a45]"
                    d="M72 22c6 14 20 26 24 42 3 14-4 30-18 36-8 4-18 3-26-2 14-8 24-22 28-38 2-12 0-24-8-38z"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-2 text-center">
                  <span className="max-w-[5.5rem] text-[10px] font-bold uppercase leading-tight tracking-wide text-white drop-shadow-sm">
                    {storeLabel}
                  </span>
                </div>
              </div>
              <h2 id="members-deals-heading" className="mt-4 max-w-[16rem] text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                {cfg.headline}
              </h2>
              <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-white/90">{cfg.subline}</p>
            </div>

            <div className="relative z-[1] mt-8 flex flex-wrap items-end gap-4 lg:mt-0">
              <Link
                href={productsHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#1e3d2f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#152e24]"
              >
                {cfg.ctaLabel}
                <span aria-hidden className="text-lg leading-none">
                  ›
                </span>
              </Link>
              <div className="hidden gap-1 sm:flex lg:hidden" aria-hidden>
                <span className="h-12 w-12 overflow-hidden rounded-lg ring-2 ring-white/40">
                  <Image
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=96&q=70"
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="h-12 w-12 overflow-hidden rounded-lg ring-2 ring-white/40">
                  <Image
                    src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=96&q=70"
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </span>
              </div>
            </div>

            {/* Decorative produce cluster — desktop */}
            <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[55%] translate-x-[8%] translate-y-[12%] lg:block">
              <div className="relative h-44 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=75"
                  alt=""
                  width={200}
                  height={160}
                  className="absolute bottom-0 right-0 w-[45%] rotate-6 rounded-2xl object-cover shadow-xl ring-4 ring-white/25"
                />
                <Image
                  src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=75"
                  alt=""
                  width={180}
                  height={140}
                  className="absolute bottom-2 right-[28%] w-[40%] -rotate-3 rounded-2xl object-cover shadow-lg ring-4 ring-white/20"
                />
                <Image
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=75"
                  alt=""
                  width={160}
                  height={130}
                  className="absolute bottom-8 right-[52%] w-[35%] rotate-[-8deg] rounded-2xl object-cover shadow-md ring-4 ring-white/20"
                />
              </div>
            </div>
          </div>

          {/* Product rail */}
          <div className="relative flex min-h-0 flex-1 flex-col bg-white lg:rounded-r-3xl">
            <div className="pointer-events-none absolute -left-6 top-8 z-[2] hidden h-32 w-16 rounded-l-3xl bg-white shadow-[-12px_0_24px_-8px_rgba(0,0,0,0.08)] lg:block" aria-hidden />

            {loading ? (
              <div className="flex flex-1 items-center gap-4 overflow-hidden px-4 py-8 sm:px-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 w-[11.5rem] shrink-0 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden px-4 py-8 pb-14 sm:gap-5 sm:px-6 lg:py-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {products.map((p) => {
                    const v = pickVariantForCard(p)!;
                    const pct = salePercent(v);
                    const compare = v.compare_at_price && parseFloat(v.compare_at_price) > parseFloat(v.price) ? v.compare_at_price : null;
                    const inStock = (v.inventory_quantity ?? 0) > 0;
                    const href = `/product/${p.id}${storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : ''}`;
                    return (
                      <article
                        key={p.id}
                        data-deal-card
                        className="flex w-[11.5rem] shrink-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.2)] sm:w-[13rem]"
                      >
                        <div className="relative px-3 pt-3">
                          <div className="flex items-start gap-1.5">
                            <span className="max-w-[5.5rem] rounded-md bg-[#1e3d2f] px-1.5 py-0.5 text-[7px] font-bold uppercase leading-tight tracking-wide text-white">
                              {storeLabel} · save
                            </span>
                            {pct != null ? (
                              <span
                                className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${primary}, #0d9488)` }}
                              >
                                <svg className="h-3 w-3 opacity-95" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 22c5 0 9-4 9-9 0-1.63-.44-3.16-1.2-4.5L17 8z" />
                                </svg>
                                {pct}% off
                              </span>
                            ) : (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-teal-800"
                                style={{ backgroundColor: `color-mix(in srgb, ${primary} 18%, white)` }}
                              >
                                Deal
                              </span>
                            )}
                          </div>
                          <Link href={href} className="relative mt-2 block h-32 w-full overflow-hidden rounded-xl bg-slate-50 sm:h-36">
                            <Image
                              src={cardImageUrl(p)}
                              alt={p.title}
                              fill
                              sizes="200px"
                              className="object-contain p-2"
                            />
                          </Link>
                          <button
                            type="button"
                            disabled={!inStock || addingId === v.id}
                            onClick={() => onAdd(p)}
                            className="absolute bottom-2 right-3 flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/80 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span className="text-sm leading-none">+</span>
                            {addingId === v.id ? '…' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-bold tabular-nums" style={{ color: primary }}>
                              {v.price}
                            </span>
                            {compare ? (
                              <span className="text-xs text-slate-400 line-through tabular-nums">{compare}</span>
                            ) : null}
                          </div>
                          <Link
                            href={href}
                            className="mt-1 line-clamp-2 text-left text-xs font-medium leading-snug text-slate-600 hover:text-slate-900"
                          >
                            {p.title}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="absolute bottom-4 right-4 z-[3] flex gap-2 sm:right-6">
                  <button
                    type="button"
                    aria-label="Scroll deals left"
                    disabled={!canPrev}
                    onClick={() => scrollByDir(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll deals right"
                    disabled={!canNext}
                    onClick={() => scrollByDir(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
