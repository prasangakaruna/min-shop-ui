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

type CountdownParts = { days: number; hours: number; mins: number; secs: number };

function usePromoCountdown(endIso: string | null | undefined): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

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
      const secs = totalSec % 60;
      setParts({ days, hours, mins, secs });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endIso]);

  return parts;
}

const promoCtaClassName =
  'group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

function CtaArrow() {
  return (
    <svg
      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function CountdownBoxes({
  days,
  hours,
  mins,
  secs,
  size = 'default',
}: {
  days: number;
  hours: number;
  mins: number;
  secs?: number;
  size?: 'default' | 'compact';
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [
    { value: pad(days), label: 'DAYS' },
    { value: pad(hours), label: 'HRS' },
    { value: pad(mins), label: 'MIN' },
    ...(secs !== undefined ? ([{ value: pad(secs), label: 'SEC' }] as const) : []),
  ];
  const box =
    size === 'compact'
      ? 'flex min-w-[2.35rem] items-center justify-center rounded-lg bg-white px-1.5 py-1.5 text-sm font-bold tabular-nums text-slate-900 shadow-sm ring-1 ring-slate-200/90 sm:min-w-[2.5rem] sm:text-base'
      : 'flex min-w-[2.65rem] items-center justify-center rounded-lg bg-white px-2 py-2 text-base font-bold tabular-nums text-slate-900 shadow-sm ring-1 ring-slate-200/90 sm:min-w-[2.85rem] sm:text-lg';
  const labelCls = size === 'compact' ? 'mt-1 text-[8px]' : 'mt-1 text-[9px]';
  return (
    <div
      className={`flex flex-wrap justify-center gap-1.5 sm:gap-2 ${cells.length > 3 ? 'max-w-[20rem] sm:max-w-none' : ''}`}
      aria-label="Offer ends in"
    >
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center">
          <div className={box}>{c.value}</div>
          <span className={`${labelCls} font-semibold uppercase tracking-widest text-slate-400`}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

type VolumePromo = NonNullable<StorefrontCouponsResponse['volume_promo']>;

function VolumePromoCard({ volume, productsHref }: { volume: VolumePromo; productsHref: string }) {
  const countdown = usePromoCountdown(volume.ends_at ?? null);
  const timed = Boolean(volume.ends_at?.trim());

  return (
    <div
      id="store-volume-promo"
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm sm:p-8"
      aria-labelledby="volume-promo-title"
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-teal-500/[0.06]"
        aria-hidden
      />

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
        {timed ? 'Limited run' : 'Volume deal'}
      </p>

      {countdown ? (
        <div
          className="mt-4 rounded-xl bg-gradient-to-b from-teal-50/90 via-slate-50/80 to-slate-50/40 px-3 py-3.5 ring-1 ring-teal-100/80"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-teal-800">Ends in</p>
          <CountdownBoxes
            days={countdown.days}
            hours={countdown.hours}
            mins={countdown.mins}
            secs={countdown.secs}
            size="compact"
          />
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Offer status</p>
          <p className="mt-1 text-xs leading-snug text-slate-600">
            This rate is <span className="font-medium text-slate-800">live</span>. Your savings show up at checkout when your
            order meets the minimum.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-end gap-0.5">
        <span className="text-5xl font-black leading-none tracking-tight text-slate-900 sm:text-6xl">{volume.percent}</span>
        <div className="mb-0.5 ml-0.5 flex flex-col leading-none">
          <span className="text-2xl font-bold text-slate-900 sm:text-3xl">%</span>
          <span className="text-xs font-bold uppercase tracking-wide text-teal-700">off</span>
        </div>
      </div>

      <h2 id="volume-promo-title" className="mt-4 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
        Automatic savings on large orders — no code.
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        From <span className="font-semibold text-slate-800">${formatMoney(volume.min_subtotal)}</span> your cart gets{' '}
        <span className="font-semibold text-slate-800">{volume.percent}%</span> off at checkout. Combine with a coupon when
        allowed.
      </p>

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-6">
        <Link href={productsHref} className={promoCtaClassName}>
          <span>Shop the sale</span>
          <CtaArrow />
        </Link>
        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          Exclusions may apply. Final total in cart and checkout.
        </p>
      </div>
    </div>
  );
}

/**
 * Homepage promotions: coupon-focused card + optional volume card (no duplicated bulk copy when both show).
 */
export default function CouponPromoSection({ storeSlug }: { storeSlug?: string | null }) {
  const [coupons, setCoupons] = useState<StorefrontCouponRow[]>([]);
  const [volumePromo, setVolumePromo] = useState<StorefrontCouponsResponse['volume_promo']>(null);
  const [loaded, setLoaded] = useState(false);

  const cartHref = !storeSlug ? '/cart' : `/cart?store=${encodeURIComponent(storeSlug)}`;
  const productsHref = !storeSlug ? '/products' : `/products?store=${encodeURIComponent(storeSlug)}`;

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
  const showVolumeColumn = Boolean(storeSlug && loaded && volumePromo);

  return (
    <section
      className="relative w-full border-b border-slate-100 bg-slate-50/80 py-12 sm:py-14"
      aria-labelledby="promo-card-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-5 ${showVolumeColumn ? 'lg:grid-cols-2 lg:gap-6 xl:grid-cols-[1.05fr_0.95fr]' : ''}`}
        >
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm sm:p-8 lg:min-h-[320px]">
            <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-teal-500/[0.04]" aria-hidden />

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div
                  className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200/60 sm:mx-0"
                  aria-hidden
                >
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">Smart checkout</p>
                  <h2
                    id="promo-card-heading"
                    className="mt-1.5 text-pretty text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem] sm:leading-snug"
                  >
                    {!hasAnyDeal ? (
                      <>
                        Your best price starts in the <span className="text-teal-700">cart.</span>
                      </>
                    ) : showVolumeColumn && !hasCoupons ? (
                      <>
                        Codes optional — <span className="text-teal-700">your cart does the math.</span>
                      </>
                    ) : (
                      <>
                        Your code belongs in the cart — <span className="text-teal-700">watch the total drop.</span>
                      </>
                    )}
                  </h2>
                </div>
              </div>

              <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5">
                {!storeSlug ? (
                  <p className="mx-auto max-w-md text-pretty text-center text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-left">
                    Browse the marketplace and add items to your cart. Coupons and volume discounts apply on the cart page
                    before you pay.
                  </p>
                ) : !loaded ? (
                  <div className="flex flex-1 items-center justify-center py-10 sm:justify-start sm:py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600/25 border-t-teal-700" />
                  </div>
                ) : (
                  <>
                    <p className="mx-auto max-w-xl text-pretty text-center text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-left">
                      {showVolumeColumn && hasCoupons ? (
                        <>
                          Paste a code on the{' '}
                          <span className="font-medium text-slate-800">cart page</span> before checkout — your total updates
                          before payment.{' '}
                          <a
                            href="#store-volume-promo"
                            className="font-medium text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:decoration-teal-700"
                          >
                            Volume savings
                          </a>{' '}
                          are summarized beside this card.
                        </>
                      ) : showVolumeColumn ? (
                        <>
                          <a
                            href="#store-volume-promo"
                            className="font-medium text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:decoration-teal-700"
                          >
                            Volume pricing
                          </a>{' '}
                          is on the right. If you receive a code, enter it on the{' '}
                          <span className="font-medium text-slate-800">cart page</span> — your total updates before you pay.
                        </>
                      ) : (
                        <>
                          Paste any valid coupon on the <span className="font-medium text-slate-800">cart page</span> before
                          checkout. Newsletter and social codes update your total in one step.
                        </>
                      )}
                    </p>

                    {!showVolumeColumn && hasVolume ? (
                      <div className="space-y-5 rounded-xl border border-teal-200/70 bg-teal-50/40 px-4 py-4 sm:px-5">
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
                          <div className="flex items-end gap-0.5">
                            <span className="text-5xl font-black leading-none text-slate-900 sm:text-6xl">
                              {volumePromo!.percent}
                            </span>
                            <div className="mb-0.5 ml-0.5 flex flex-col leading-none">
                              <span className="text-2xl font-bold text-slate-900">%</span>
                              <span className="text-xs font-bold uppercase text-teal-700">off</span>
                            </div>
                          </div>
                          <p className="max-w-md text-center text-sm text-slate-600 sm:text-left">
                            Orders of{' '}
                            <span className="font-semibold text-slate-800">${formatMoney(volumePromo!.min_subtotal)}</span> or
                            more — automatic at checkout{hasCoupons ? '; stack a coupon when allowed.' : '.'}
                          </p>
                        </div>
                        {(volumePromo!.starts_at || volumePromo!.ends_at) && (
                          <p className="text-center text-xs text-slate-500 sm:text-left">
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
                            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-left">
                              Ends in
                            </p>
                            <CountdownBoxes days={countdown.days} hours={countdown.hours} mins={countdown.mins} secs={countdown.secs} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {hasCoupons ? (
                      <div>
                        <p className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700 sm:text-left">
                          Active codes · this store
                        </p>
                        <ul
                          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2"
                          aria-label="Active coupon codes for this store"
                        >
                          {coupons.map((c) => (
                            <li
                              key={c.code}
                              className="flex flex-col gap-0.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-left sm:min-w-[200px] sm:flex-1 sm:flex-none"
                            >
                              <span className="font-mono text-sm font-semibold tracking-wide text-slate-900">{c.code}</span>
                              <span className="text-xs text-slate-500">
                                {c.summary}
                                {c.min_subtotal ? ` · Min. $${formatMoney(c.min_subtotal)}` : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {!showVolumeColumn ? (
                      <p className="text-center text-xs text-slate-500 sm:text-left">
                        Add to cart → paste code → confirm total before paying.
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {storeSlug && loaded ? (
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <Link href={cartHref} className={promoCtaClassName}>
                    <span>Apply code in cart</span>
                    <CtaArrow />
                  </Link>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500 sm:text-left">
                    Totals shown in cart and at checkout. Exclusions may apply.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {showVolumeColumn ? <VolumePromoCard volume={volumePromo!} productsHref={productsHref} /> : null}
        </div>
      </div>
    </section>
  );
}
