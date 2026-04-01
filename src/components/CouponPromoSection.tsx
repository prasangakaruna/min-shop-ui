'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { storefrontRequest } from '@/lib/storefrontApi';

type StorefrontCouponRow = { code: string; summary: string; min_subtotal?: string };

type StorefrontCouponsResponse = {
  data?: StorefrontCouponRow[];
  volume_promo?: {
    min_subtotal: string;
    percent: number;
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

function formatMoney(s: string): string {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function usePromoCountdown(endIso: string | null | undefined): { days: number; hours: number; mins: number } | null {
  const [parts, setParts] = useState<{ days: number; hours: number; mins: number } | null>(null);

  useEffect(() => {
    if (!endIso) {
      setParts(null);
      return;
    }
    const end = new Date(endIso).getTime();
    if (Number.isNaN(end)) {
      setParts(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      if (end <= now) {
        setParts(null);
        return;
      }
      const totalSec = Math.floor((end - now) / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      setParts({ days, hours, mins });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endIso]);

  return parts;
}

function CountdownBoxes({
  days,
  hours,
  mins,
  centered,
}: {
  days: number;
  hours: number;
  mins: number;
  centered?: boolean;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [
    { value: pad(days), label: 'DAYS' },
    { value: pad(hours), label: 'HOURS' },
    { value: pad(mins), label: 'MINS' },
  ];
  return (
    <div
      className={`flex flex-wrap gap-3 ${centered ? 'justify-center' : 'justify-center sm:justify-start'}`}
      aria-label="Offer ends in"
    >
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center">
          <div className="flex min-w-[3.25rem] items-center justify-center rounded-xl bg-white px-3 py-2.5 text-lg font-bold tabular-nums text-gray-900 shadow-sm ring-1 ring-gray-200/80">
            {c.value}
          </div>
          <span className="mt-1.5 text-[10px] font-semibold tracking-widest text-gray-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

type VolumePromo = NonNullable<StorefrontCouponsResponse['volume_promo']>;

function LimitedAvailabilityCard({
  volume,
  productsHref,
}: {
  volume: VolumePromo;
  productsHref: string;
}) {
  const countdown = usePromoCountdown(volume.ends_at ?? null);
  const hasEnd = Boolean(volume.ends_at);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-gradient-to-b from-stone-100/90 via-stone-50 to-white p-8 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03] sm:p-9"
      aria-labelledby="limited-promo-heading"
    >
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-teal-400/[0.06] blur-3xl"
        aria-hidden
      />

      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-800">
        {hasEnd ? 'Limited availability' : 'Volume deal'}
      </p>

      <div className="mt-5 flex items-end gap-0.5">
        <span className="text-6xl font-black leading-none tracking-tight text-gray-900 sm:text-7xl">{volume.percent}</span>
        <div className="mb-1 ml-0.5 flex flex-col leading-none">
          <span className="text-3xl font-bold text-gray-900 sm:text-4xl">%</span>
          <span className="text-sm font-bold uppercase tracking-wide text-teal-800">off</span>
        </div>
      </div>

      <h2
        id="limited-promo-heading"
        className="mt-5 text-balance text-xl font-bold leading-snug tracking-tight text-gray-900 sm:text-2xl"
      >
        Big orders, bigger savings — automatic at checkout on qualifying carts.
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Spend <span className="font-semibold text-gray-900">${formatMoney(volume.min_subtotal)}</span> or more and your
        discount applies instantly — stack with a coupon when your store allows it.
      </p>

      {countdown ? (
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Ends in</p>
          <CountdownBoxes days={countdown.days} hours={countdown.hours} mins={countdown.mins} centered />
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-4 pt-8">
        <Link
          href={productsHref}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <span>Shop the sale</span>
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="text-center text-[11px] leading-relaxed text-gray-500">
          Exclusions may apply. See cart and checkout for your live total.
        </p>
      </div>
    </div>
  );
}

/**
 * Homepage promotions: smart-checkout strip + optional limited-availability volume card (side by side on large screens).
 */
export default function CouponPromoSection({ storeSlug }: { storeSlug?: string | null }) {
  const [coupons, setCoupons] = useState<StorefrontCouponRow[]>([]);
  const [volumePromo, setVolumePromo] = useState<StorefrontCouponsResponse['volume_promo']>(null);
  const [loaded, setLoaded] = useState(false);

  const cartHref = (() => {
    const base = '/cart';
    if (!storeSlug) return base;
    return `${base}?store=${encodeURIComponent(storeSlug)}`;
  })();

  const productsHref = (() => {
    const base = '/products';
    if (!storeSlug) return base;
    return `${base}?store=${encodeURIComponent(storeSlug)}`;
  })();

  useEffect(() => {
    if (!storeSlug) {
      setCoupons([]);
      setVolumePromo(null);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    storefrontRequest<StorefrontCouponsResponse>('/storefront/coupons', { store: storeSlug })
      .then((res) => {
        if (cancelled) return;
        setCoupons(Array.isArray(res.data) ? res.data : []);
        setVolumePromo(res.volume_promo ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setCoupons([]);
          setVolumePromo(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const countdown = usePromoCountdown(volumePromo?.ends_at ?? null);
  const hasVolume = Boolean(volumePromo);
  const hasCoupons = coupons.length > 0;
  const hasAnyDeal = hasVolume || hasCoupons;
  /** Second column: volume promo card (avoids duplicating big % + countdown in the main strip). */
  const showLimitedCard = Boolean(storeSlug && loaded && volumePromo);

  return (
    <section
      className="relative w-full border-b border-gray-100 bg-gradient-to-b from-sky-50/40 via-stone-50/50 to-white py-10 sm:py-12"
      aria-labelledby="promo-card-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-6 lg:items-stretch ${showLimitedCard ? 'lg:grid-cols-[1fr_minmax(17rem,20rem)] xl:grid-cols-[1fr_minmax(18rem,22rem)]' : ''}`}
        >
          <div className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-gradient-to-br from-white via-sky-50/30 to-teal-50/20 p-8 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,118,110,0.1)] ring-1 ring-black/[0.03] sm:p-10 lg:p-11">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/[0.08] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-sky-300/[0.07] blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between xl:gap-10">
              <div className="min-w-0 flex-1 space-y-6 text-center sm:text-left">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-200/80"
                    aria-hidden
                  >
                    <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Smart checkout</p>
                    <h2
                      id="promo-card-heading"
                      className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
                    >
                      {!hasAnyDeal ? (
                        <>
                          Your best price starts in the <span className="text-teal-700">cart.</span>
                        </>
                      ) : hasVolume && hasCoupons ? (
                        <>
                          Your code belongs in the cart—<span className="text-teal-700">watch the total drop.</span>
                        </>
                      ) : hasVolume ? (
                        <>
                          Big orders save automatically—<span className="text-teal-700">watch the total drop.</span>
                        </>
                      ) : (
                        <>
                          Your code belongs in the cart—<span className="text-teal-700">watch the total drop.</span>
                        </>
                      )}
                    </h2>
                  </div>
                </div>

                {!storeSlug ? (
                  <p className="mx-auto max-w-lg text-pretty text-sm leading-relaxed text-gray-600 sm:mx-0">
                    Browse the marketplace and add items to your cart. When your store uses Mint coupons or volume
                    discounts, they apply automatically or with one paste before payment.
                  </p>
                ) : !loaded ? (
                  <div className="flex justify-center py-4 sm:justify-start">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600/30 border-t-teal-700" />
                  </div>
                ) : (
                  <>
                    <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-gray-600 sm:mx-0">
                      Paste any valid coupon on the <strong className="font-semibold text-gray-800">cart page</strong>{' '}
                      (before checkout). Newsletter deals, social drops, and partner promos update your order total in
                      one click — no surprises at payment.
                    </p>

                    {hasVolume ? (
                      <div className="rounded-2xl border border-teal-200/80 bg-white/80 px-4 py-3.5 text-sm leading-relaxed text-gray-700 shadow-sm backdrop-blur-sm">
                        <strong className="font-semibold text-gray-900">Bulk savings:</strong> orders of{' '}
                        <span className="font-semibold text-gray-900">${formatMoney(volumePromo!.min_subtotal)}</span> or
                        more save <span className="font-semibold text-teal-800">{volumePromo!.percent}%</span>{' '}
                        automatically at checkout—no code needed
                        {hasCoupons ? ' (can combine with coupons).' : '.'}
                      </div>
                    ) : null}

                    {!showLimitedCard && hasVolume ? (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:gap-6">
                          <div className="flex items-end gap-0.5">
                            <span className="text-6xl font-black leading-none tracking-tight text-gray-900 sm:text-7xl">
                              {volumePromo!.percent}
                            </span>
                            <div className="mb-1 ml-0.5 flex flex-col leading-none">
                              <span className="text-3xl font-bold text-gray-900 sm:text-4xl">%</span>
                              <span className="text-sm font-bold uppercase tracking-wide text-teal-800">off</span>
                            </div>
                          </div>
                          <p className="max-w-sm text-pretty text-center text-sm leading-relaxed text-gray-600 sm:text-left">
                            Orders of{' '}
                            <span className="font-semibold text-gray-900">${formatMoney(volumePromo!.min_subtotal)}</span>{' '}
                            or more save automatically—no code needed{hasCoupons ? ', and you can still stack a coupon' : ''}.
                          </p>
                        </div>

                        {(volumePromo!.starts_at || volumePromo!.ends_at) && (
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const s = volumePromo!.starts_at ? new Date(volumePromo!.starts_at).toLocaleString() : null;
                              const e = volumePromo!.ends_at ? new Date(volumePromo!.ends_at).toLocaleString() : null;
                              if (s && e) return `Runs ${s} – ${e}`;
                              if (s) return `Starts ${s}`;
                              if (e) return `Ends ${e}`;
                              return null;
                            })()}
                          </p>
                        )}

                        {countdown ? (
                          <div>
                            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-left">
                              Ends in
                            </p>
                            <CountdownBoxes days={countdown.days} hours={countdown.hours} mins={countdown.mins} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {storeSlug && loaded && hasCoupons ? (
                      <div className="space-y-3">
                        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800 sm:text-left">
                          Active codes — this store
                        </p>
                        <ul
                          className="flex flex-wrap justify-center gap-2 sm:justify-start"
                          aria-label="Active coupon codes for this store"
                        >
                          {coupons.map((c) => (
                            <li
                              key={c.code}
                              className="inline-flex max-w-full flex-col gap-0.5 rounded-full border border-gray-200/90 bg-white px-4 py-2.5 text-left shadow-sm ring-1 ring-black/[0.02]"
                            >
                              <span className="font-mono text-sm font-bold tracking-wide text-gray-900">{c.code}</span>
                              <span className="text-xs text-gray-500">
                                {c.summary}
                                {c.min_subtotal ? ` · min order $${formatMoney(c.min_subtotal)}` : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <p className="text-center text-xs leading-relaxed text-gray-500 sm:text-left">
                      Same flow you get from email and social:{' '}
                      <strong className="font-medium text-gray-600">add to cart → paste code → see your new total</strong>{' '}
                      before you enter payment details.
                    </p>
                  </>
                )}
              </div>

              <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:mx-auto sm:max-w-sm xl:mx-0 xl:w-auto xl:min-w-[200px]">
                <Link
                  href={cartHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-8 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  <span>Apply code in cart</span>
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <p className="text-center text-[11px] leading-relaxed text-gray-500 xl:text-right">
                  Exclusions may apply. Final totals are shown in your cart and at checkout.
                </p>
              </div>
            </div>
          </div>

          {showLimitedCard ? <LimitedAvailabilityCard volume={volumePromo!} productsHref={productsHref} /> : null}
        </div>
      </div>
    </section>
  );
}
