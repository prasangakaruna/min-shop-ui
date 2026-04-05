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
  /** Logo word inside the leaf + on the dark badge (e.g. nexus). */
  brandMark?: string;
  /** Prepended to variant price when the API returns a bare number (e.g. "Rs "). */
  pricePrefix?: string;
  /** Full-bleed image for the left promo panel (replaces leaf, headline block, and produce art when set). */
  promoPanelImageUrl?: string;
};

const PANEL = '#8FB07E';
const DEEP = '#1B4D2E';
const DEAL_ACCENT = '#77C043';

function parseSettings(raw: Record<string, unknown> | null | undefined): Required<
  Omit<MembersDealsRailSettings, 'ctaUrl' | 'pricePrefix' | 'promoPanelImageUrl'>
> & { ctaUrl: string | undefined; pricePrefix: string; promoPanelImageUrl: string | undefined } {
  const s = raw ?? {};
  const lim = s.productLimit;
  const n = typeof lim === 'number' && Number.isFinite(lim) ? Math.floor(lim) : 14;
  const pp = s.pricePrefix;
  const promo =
    typeof s.promoPanelImageUrl === 'string' && s.promoPanelImageUrl.trim() !== ''
      ? s.promoPanelImageUrl.trim()
      : undefined;
  return {
    headline: typeof s.headline === 'string' && s.headline.trim() !== '' ? s.headline.trim() : 'Members Save',
    subline: typeof s.subline === 'string' ? s.subline.trim() : '',
    ctaLabel: typeof s.ctaLabel === 'string' && s.ctaLabel.trim() !== '' ? s.ctaLabel.trim() : 'View More Deals',
    ctaUrl: typeof s.ctaUrl === 'string' && s.ctaUrl.trim() !== '' ? s.ctaUrl.trim() : undefined,
    productLimit: Math.min(24, Math.max(4, n)),
    brandMark: typeof s.brandMark === 'string' && s.brandMark.trim() !== '' ? s.brandMark.trim() : 'nexus',
    pricePrefix: typeof pp === 'string' ? pp : 'Rs ',
    promoPanelImageUrl: promo,
  };
}

function headlineTwoLines(headline: string): [string, string] {
  const h = headline.trim() || 'Members Save';
  const i = h.indexOf(' ');
  if (i <= 0) return [h, ''];
  return [h.slice(0, i), h.slice(i + 1).trim()];
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
function priceDisplayLine(p: StorefrontProduct, v: ProductVariant, pricePrefix: string): string {
  const pre = pricePrefix.trim();
  const cur = pre ? `${pre} ${v.price}`.replace(/\s+/g, ' ').trim() : v.price;
  const unit = p.package_size?.trim();
  if (unit) {
    const join = unit.startsWith('/') ? `${cur}${unit}` : `${cur} ${unit}`;
    return join.replace(/\s+/g, ' ').trim();
  }
  return cur;
}

function formatComparePrice(compare: string, pricePrefix: string): string {
  const pre = pricePrefix.trim();
  if (!pre) return compare;
  return `${pre} ${compare}`.replace(/\s+/g, ' ').trim();
}

function MemberDealBadges({ brandMark, pct }: { brandMark: string; pct: number | null }) {
  const raw = brandMark.trim() || 'nexus';
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-col items-start gap-1" aria-hidden>
      <div
        className="max-w-[calc(100%-0.5rem)] rounded-sm px-2 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.15)] ring-1 ring-white/25"
        style={{ backgroundColor: DEEP }}
      >
        <p className="text-[6px] font-extrabold uppercase leading-tight tracking-wide text-white">
          <span className="tracking-tight">{titled}</span>
          <span> MEMBERS SAVE</span>
        </p>
      </div>
      <div
        className="min-w-[3.25rem] px-2.5 py-1 text-center text-[9px] font-black uppercase tracking-wide text-white shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
        style={{
          backgroundColor: DEAL_ACCENT,
          clipPath: 'polygon(8% 12%, 50% 0%, 92% 12%, 100% 45%, 88% 100%, 12% 100%, 0% 45%)',
        }}
      >
        {pct != null ? `${pct}% OFF` : 'SAVE'}
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

  const useDefaultPromoArt = !cfg.promoPanelImageUrl;
  const [line1, line2] = useDefaultPromoArt ? headlineTwoLines(cfg.headline) : (['', ''] as [string, string]);
  const brandLower = useDefaultPromoArt ? cfg.brandMark.toLowerCase() : '';

  return (
    <section className="relative w-full overflow-x-hidden bg-white py-10 sm:py-12" aria-labelledby="members-deals-heading">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[min(22rem,78vw)] flex-col overflow-visible rounded-3xl shadow-[0_24px_56px_-28px_rgba(27,77,46,0.35)] ring-1 ring-black/[0.06] lg:min-h-[20rem] lg:flex-row">
          {/* Left promo panel — custom full banner image, or default sage + leaf + collage */}
          {cfg.promoPanelImageUrl ? (
            <div
              className="relative z-0 flex min-h-[min(22rem,78vw)] w-full shrink-0 flex-col justify-end overflow-hidden text-white lg:min-h-0 lg:h-full lg:w-[min(100%,26rem)] lg:rounded-l-3xl xl:w-[28rem]"
              style={{ backgroundColor: PANEL }}
            >
              <h2 id="members-deals-heading" className="sr-only">
                {cfg.headline}
                {cfg.subline ? ` ${cfg.subline}` : ''}
              </h2>
              <div className="absolute inset-0">
                <Image
                  src={getImageDisplayUrl(cfg.promoPanelImageUrl)}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 28rem"
                  priority={false}
                />
              </div>
              <div className="relative z-[1] w-full bg-gradient-to-t from-black/55 via-black/20 to-transparent px-6 pb-8 pt-16 lg:pb-10 lg:pt-24">
                <Link
                  href={productsHref}
                  className="inline-flex w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)] ring-1 ring-white/15 transition hover:brightness-110 sm:w-auto"
                  style={{ backgroundColor: DEEP }}
                >
                  <span>{cfg.ctaLabel}</span>
                  <span className="text-white/55" aria-hidden>
                    |
                  </span>
                  <span className="text-base font-semibold leading-none" aria-hidden>
                    &gt;
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="relative z-0 flex w-full shrink-0 flex-col justify-between overflow-hidden px-6 py-8 text-white lg:w-[min(100%,26rem)] lg:rounded-l-3xl lg:py-10 xl:w-[28rem]"
              style={{ backgroundColor: PANEL }}
            >
              <div className="relative z-[1] flex flex-col gap-6 lg:min-h-[12rem]">
                <div className="relative mx-auto w-[min(100%,17.5rem)] sm:mx-0">
                  <svg
                    className="h-44 w-44 drop-shadow-lg sm:h-48 sm:w-48"
                    viewBox="0 0 200 220"
                    aria-hidden
                  >
                    <path
                      d="M100 18c-18 8-42 38-52 72-6 20-4 44 12 58 14 12 36 14 54 4 22-12 34-36 30-58-4-22-22-42-44-76z"
                      fill={DEEP}
                      stroke="#fff"
                      strokeWidth="7"
                      strokeLinejoin="round"
                      transform="rotate(8 100 110)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-7 pb-5 pt-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className="text-[1.35rem] font-medium lowercase tracking-wide text-white drop-shadow-sm"
                        style={{ fontFamily: 'ui-rounded, "Nunito", system-ui, sans-serif' }}
                      >
                        {brandLower}
                      </span>
                      <svg className="-mt-0.5 h-2 w-[3.25rem] text-white/95" viewBox="0 0 52 8" fill="none" aria-hidden>
                        <path
                          d="M1 5.5c4-3 8 3 12 0s8-3 12 0 8 3 12 0 8-3 12 0"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h2
                      id="members-deals-heading"
                      className="mt-3 max-w-[9.5rem] text-[1.65rem] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:max-w-[11rem] sm:text-[1.85rem]"
                    >
                      <span className="block">{line1}</span>
                      {line2 ? <span className="block">{line2}</span> : null}
                    </h2>
                  </div>
                </div>
                {cfg.subline ? (
                  <p className="max-w-[20rem] text-sm leading-relaxed text-white/90">{cfg.subline}</p>
                ) : null}
              </div>

              <div className="relative z-[1] mt-8 lg:mt-4">
                <Link
                  href={productsHref}
                  className="inline-flex w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)] ring-1 ring-white/15 transition hover:brightness-110 sm:w-auto"
                  style={{ backgroundColor: DEEP }}
                >
                  <span>{cfg.ctaLabel}</span>
                  <span className="text-white/55" aria-hidden>
                    |
                  </span>
                  <span className="text-base font-semibold leading-none" aria-hidden>
                    &gt;
                  </span>
                </Link>
              </div>

              <div className="pointer-events-none absolute bottom-0 right-0 hidden h-[min(100%,14rem)] w-[58%] lg:block">
                <div className="relative h-full min-h-[11rem] w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=75"
                    alt=""
                    width={200}
                    height={160}
                    className="absolute bottom-1 right-[4%] w-[42%] rotate-[-6deg] rounded-2xl object-cover shadow-xl ring-4 ring-white/30"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=75"
                    alt=""
                    width={180}
                    height={140}
                    className="absolute bottom-3 right-[32%] w-[38%] rotate-[4deg] rounded-2xl object-cover shadow-lg ring-4 ring-white/25"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=75"
                    alt=""
                    width={170}
                    height={130}
                    className="absolute bottom-10 right-[55%] w-[34%] rotate-[-10deg] rounded-2xl object-cover shadow-md ring-4 ring-white/22"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 lg:hidden" aria-hidden>
                <span className="h-14 w-14 overflow-hidden rounded-xl ring-2 ring-white/35">
                  <Image
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=96&q=70"
                    alt=""
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="h-14 w-14 overflow-hidden rounded-xl ring-2 ring-white/35">
                  <Image
                    src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=96&q=70"
                    alt=""
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </span>
              </div>
            </div>
          )}

          {/* Product rail — white panel, overlaps sage (reference) */}
          <div className="relative z-[1] -mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border-l-4 border-white bg-white shadow-[inset_0_1px_0_rgba(255,255,255,1)] sm:-mt-0 lg:-ml-10 lg:mt-0 lg:rounded-l-3xl lg:rounded-r-3xl lg:border-l-[6px] lg:pl-1 xl:-ml-12">
            {loading ? (
              <div className="flex flex-1 items-center gap-4 overflow-hidden px-4 py-8 sm:px-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 w-[11.5rem] shrink-0 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-600">No products in this strip yet</p>
                <p className="max-w-sm text-xs text-slate-500">
                  Publish products with variants for this store, or confirm the storefront API is reachable from this site.
                </p>
                <Link href={productsHref} className="mt-2 text-sm font-semibold underline" style={{ color: DEAL_ACCENT }}>
                  View catalog
                </Link>
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden px-3 py-8 sm:gap-4 sm:px-5 lg:gap-5 lg:py-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                        <div className="relative px-2.5 pb-1 pt-12 sm:px-3 sm:pt-14">
                          <MemberDealBadges brandMark={cfg.brandMark} pct={pct} />
                          <Link
                            href={href}
                            className="relative block h-[7.5rem] w-full overflow-hidden rounded-xl bg-white sm:h-36"
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
                            <span className="text-sm font-bold tabular-nums" style={{ color: DEAL_ACCENT }}>
                              {priceDisplayLine(p, v, cfg.pricePrefix)}
                            </span>
                            {compare ? (
                              <span className="text-xs text-[#666666]/80 line-through tabular-nums">
                                {formatComparePrice(compare, cfg.pricePrefix)}
                              </span>
                            ) : null}
                          </div>
                          <Link
                            href={href}
                            className="mt-2 line-clamp-2 text-left text-sm font-normal leading-snug text-[#666666] hover:underline"
                          >
                            {p.title}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div
                  className="flex shrink-0 justify-end gap-1.5 border-t border-slate-200/70 bg-white px-3 py-3 sm:px-5"
                  role="toolbar"
                  aria-label="Scroll product deals"
                >
                  <button
                    type="button"
                    aria-label="Scroll deals left"
                    disabled={!canPrev}
                    onClick={() => scrollByDir(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
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
