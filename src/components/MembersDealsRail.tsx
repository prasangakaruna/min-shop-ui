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

/** Price line like "Rs 392.00 / KG" when package_size exists */
function priceDisplayLine(p: StorefrontProduct, v: ProductVariant): string {
  const unit = p.package_size?.trim();
  if (unit) return `${v.price} ${unit}`;
  return v.price;
}

function MemberDealRibbon({
  storeLabel,
  pct,
  primary,
}: {
  storeLabel: string;
  pct: number | null;
  primary: string;
}) {
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-20 flex max-w-[calc(100%-1rem)] overflow-hidden rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.18)] ring-1 ring-white/40"
      aria-hidden
    >
      <div className="flex w-[46%] min-w-[3.25rem] flex-col justify-center bg-[#1b4332] px-1.5 py-1.5">
        <span className="text-[6px] font-bold uppercase leading-tight tracking-wider text-white/95">{storeLabel}</span>
        <span className="mt-0.5 text-[6px] font-extrabold uppercase tracking-wide text-white">Members save</span>
      </div>
      <div
        className="flex flex-1 items-center justify-center gap-0.5 px-2 py-1.5"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${primary} 55%, #4ade80), color-mix(in srgb, ${primary} 35%, #15803d))`,
        }}
      >
        <svg className="h-3.5 w-3.5 shrink-0 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 22c5 0 9-4 9-9 0-1.63-.44-3.16-1.2-4.5L17 8z" />
        </svg>
        {pct != null ? (
          <span className="text-[10px] font-black uppercase tracking-tight text-white">{pct}% off</span>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-tight text-white">Save</span>
        )}
      </div>
    </div>
  );
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
      className="relative w-full overflow-x-hidden bg-[#e8efe6] py-10 sm:py-12"
      aria-labelledby="members-deals-heading"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[min(24rem,72vw)] flex-col overflow-visible rounded-3xl shadow-[0_28px_64px_-24px_rgba(20,50,30,0.4)] ring-1 ring-black/[0.04] lg:min-h-[21rem] lg:flex-row">
          {/* Left promo panel */}
          <div className="relative z-0 flex w-full shrink-0 flex-col justify-between bg-[#9eb89a] bg-gradient-to-br from-[#a8c4a3] via-[#8faa8c] to-[#6d8a68] px-6 py-8 text-white lg:w-[min(100%,24rem)] lg:rounded-l-3xl lg:py-10 xl:w-[27rem]">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1b4332] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)] ring-1 ring-white/10 transition hover:bg-[#142f24]"
              >
                <span>{cfg.ctaLabel}</span>
                <span className="text-white/50" aria-hidden>
                  |
                </span>
                <span className="text-lg leading-none" aria-hidden>
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

          {/* Product rail — overlaps green panel (reference layout) */}
          <div className="relative z-[1] -mt-4 flex min-h-0 flex-1 flex-col rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,1)] sm:-mt-0 lg:-ml-10 lg:mt-0 lg:rounded-l-3xl lg:rounded-r-3xl lg:pl-2 xl:-ml-12">
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
                  className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden px-3 py-8 pb-14 sm:gap-4 sm:px-5 lg:gap-5 lg:py-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {products.map((p, cardIndex) => {
                    const v = pickVariantForCard(p)!;
                    const pct = salePercent(v);
                    const compare = v.compare_at_price && parseFloat(v.compare_at_price) > parseFloat(v.price) ? v.compare_at_price : null;
                    const inStock = (v.inventory_quantity ?? 0) > 0;
                    const href = `/product/${p.id}${storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : ''}`;
                    return (
                      <article
                        key={p.id}
                        data-deal-card
                        className={`flex w-[11.75rem] shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)] sm:w-[13.25rem] ${
                          cardIndex === 0 ? 'lg:-translate-x-1 lg:shadow-[0_16px_48px_-12px_rgba(15,23,42,0.3)]' : ''
                        }`}
                      >
                        <div className="relative px-2.5 pt-2.5 sm:px-3 sm:pt-3">
                          <MemberDealRibbon storeLabel={storeLabel} pct={pct} primary={primary} />
                          <Link
                            href={href}
                            className="relative mt-1 block h-[7.5rem] w-full overflow-hidden rounded-xl bg-white sm:h-36"
                          >
                            <Image
                              src={cardImageUrl(p)}
                              alt={p.title}
                              fill
                              sizes="220px"
                              className="object-contain object-center p-2"
                            />
                          </Link>
                          <button
                            type="button"
                            disabled={!inStock || addingId === v.id}
                            onClick={() => onAdd(p)}
                            className="absolute bottom-1.5 right-2 flex items-center gap-1 rounded border border-slate-300/90 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span className="text-sm font-normal leading-none text-slate-500">+</span>
                            {addingId === v.id ? '…' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col px-3 pb-4 pt-2">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-bold tabular-nums" style={{ color: primary }}>
                              {priceDisplayLine(p, v)}
                            </span>
                            {compare ? (
                              <span className="text-xs text-neutral-400 line-through tabular-nums">{compare}</span>
                            ) : null}
                          </div>
                          <Link
                            href={href}
                            className="mt-2 line-clamp-2 text-left text-sm font-normal leading-snug text-neutral-900 hover:underline"
                          >
                            {p.title}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="absolute bottom-4 right-4 z-[3] flex gap-1.5 sm:right-6">
                  <button
                    type="button"
                    aria-label="Scroll deals left"
                    disabled={!canPrev}
                    onClick={() => scrollByDir(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 bg-slate-100/90 text-slate-500 shadow-sm transition enabled:hover:bg-slate-200/90 disabled:cursor-not-allowed disabled:opacity-35"
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
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 bg-slate-100/90 text-slate-500 shadow-sm transition enabled:hover:bg-slate-200/90 disabled:cursor-not-allowed disabled:opacity-35"
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
