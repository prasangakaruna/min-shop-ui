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
  'group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-slate-800 to-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_24px_-6px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:from-slate-700 hover:to-slate-900 hover:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_12px_28px_-8px_rgba(20,184,166,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 active:translate-y-0 sm:text-sm';

function CtaArrow() {
  return (
    <svg
      className="relative h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-4 sm:w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

/** Editorial countdown: glass cells, colon separators, subtle depth */
function CountdownStrip({ parts, label = 'Ends in' }: { parts: CountdownParts; label?: string }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [
    { v: pad(parts.days), l: 'Days' },
    { v: pad(parts.hours), l: 'Hrs' },
    { v: pad(parts.mins), l: 'Min' },
    { v: pad(parts.secs), l: 'Sec' },
  ];
  return (
    <div className="w-full">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-teal-800/90">{label}</p>
      <div
        className="flex flex-wrap items-start justify-center gap-y-2"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${label}: ${cells.map((c) => `${c.v} ${c.l}`).join(', ')}`}
      >
        {cells.map((c, i) => (
          <React.Fragment key={c.l}>
            {i > 0 ? (
              <span
                className="mx-0.5 mb-6 hidden text-lg font-extralight leading-none text-teal-300/80 sm:mx-1 sm:inline"
                aria-hidden
              >
                :
              </span>
            ) : null}
            <div className="flex min-w-[3rem] flex-col items-center px-0.5 sm:min-w-[3.25rem]">
              <div className="w-full rounded-xl border border-white/90 bg-gradient-to-b from-white to-slate-100/90 px-1.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_14px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,118,110,0.06)] sm:py-2">
                <span className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl">{c.v}</span>
              </div>
              <span className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-teal-700/85">{c.l}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function CountdownBoxes({
  days,
  hours,
  mins,
  secs,
}: {
  days: number;
  hours: number;
  mins: number;
  secs?: number;
}) {
  if (secs !== undefined) {
    return <CountdownStrip parts={{ days, hours, mins, secs }} />;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [
    { value: pad(days), label: 'DAYS' },
    { value: pad(hours), label: 'HRS' },
    { value: pad(mins), label: 'MIN' },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3" aria-label="Offer ends in">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center">
          <div className="flex min-w-[2.65rem] items-center justify-center rounded-xl border border-white/80 bg-gradient-to-b from-white to-slate-50 px-2 py-2 text-base font-bold tabular-nums text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:min-w-[2.85rem] sm:text-lg">
            {c.value}
          </div>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

type VolumePromo = NonNullable<StorefrontCouponsResponse['volume_promo']>;

function EyebrowPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-teal-200/60 bg-gradient-to-r from-teal-50/90 to-cyan-50/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-teal-800 shadow-sm sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]">
      {children}
    </span>
  );
}

function VolumePromoCard({ volume, productsHref }: { volume: VolumePromo; productsHref: string }) {
  const countdown = usePromoCountdown(volume.ends_at ?? null);
  const timed = Boolean(volume.ends_at?.trim());

  return (
    <div
      id="store-volume-promo"
      className="group/card relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_20px_50px_-24px_rgba(15,23,42,0.2),0_0_0_1px_rgba(255,255,255,0.5)] sm:rounded-3xl"
      aria-labelledby="volume-promo-title"
    >
      <div
        className="pointer-events-none absolute -right-12 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-teal-300/25 via-cyan-200/15 to-transparent blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent"
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <EyebrowPill>{timed ? 'Limited run' : 'Volume deal'}</EyebrowPill>

        {countdown ? (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-teal-50/95 via-white to-cyan-50/30 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-2xl sm:p-4">
            <div
              className="pointer-events-none absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-teal-400/20 blur-xl"
              aria-hidden
            />
            <CountdownStrip parts={countdown} />
          </div>
        ) : (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-3 text-center shadow-inner sm:rounded-2xl sm:p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[10px]">Offer status</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">
              This rate is <span className="font-semibold text-slate-800">live</span>. Savings appear at checkout when your
              order meets the minimum.
            </p>
          </div>
        )}

        <div className="relative mt-4 flex items-end gap-1 sm:mt-5">
          <span className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-4xl font-black leading-none tracking-tight text-transparent sm:text-5xl">
            {volume.percent}
          </span>
          <div className="mb-0.5 flex flex-col leading-none sm:mb-1">
            <span className="text-xl font-bold text-slate-800 sm:text-2xl">%</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 sm:text-[11px]">off</span>
          </div>
        </div>

        <h2 id="volume-promo-title" className="mt-3 text-base font-bold leading-snug tracking-tight text-slate-900 sm:mt-4 sm:text-lg">
          Automatic savings on large orders — no code.
        </h2>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">
          From <span className="font-semibold text-slate-800">${formatMoney(volume.min_subtotal)}</span> your cart gets{' '}
          <span className="font-semibold text-teal-800">{volume.percent}%</span> off at checkout. Stack a coupon when your
          store allows it.
        </p>
      </div>

      <div className="relative mt-auto border-t border-slate-100/80 bg-gradient-to-b from-slate-50/30 to-white px-5 py-4 sm:px-6 sm:py-5">
        <Link href={productsHref} className={promoCtaClassName}>
          <span className="relative">Shop the sale</span>
          <CtaArrow />
        </Link>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500 sm:mt-3 sm:text-[11px]">
          Exclusions may apply. Final total in cart and checkout.
        </p>
      </div>
    </div>
  );
}

/**
 * Homepage promotions: coupon-focused card + optional volume card.
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
      className="relative w-full overflow-hidden border-b border-slate-200/60 bg-slate-100/60 py-9 sm:py-11"
      aria-labelledby="promo-card-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(45,212,191,0.12),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(14,116,144,0.06),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-4 ${showVolumeColumn ? 'lg:grid-cols-2 lg:gap-6 xl:grid-cols-[1.08fr_0.92fr]' : ''}`}
        >
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/95 shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_24px_56px_-28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-sm sm:rounded-3xl lg:min-h-[280px]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/35 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-gradient-to-tr from-teal-400/12 to-transparent blur-3xl"
              aria-hidden
            />

            <div className="relative flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div
                  className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-[0_4px_12px_rgba(245,158,11,0.12)] sm:mx-0 sm:h-11 sm:w-11 sm:rounded-2xl"
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
                  <EyebrowPill>Smart checkout</EyebrowPill>
                  <h2
                    id="promo-card-heading"
                    className="mt-2 text-pretty text-xl font-bold leading-[1.2] tracking-tight text-slate-900 sm:mt-3 sm:text-2xl"
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

              <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 sm:mt-6 sm:gap-5">
                {!storeSlug ? (
                  <p className="mx-auto max-w-md text-pretty text-center text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-left">
                    Browse the marketplace and add items to your cart. Coupons and volume discounts apply on the cart page
                    before you pay.
                  </p>
                ) : !loaded ? (
                  <div className="flex flex-1 items-center justify-center py-8 sm:justify-start">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-600" />
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
                            className="font-medium text-teal-700 underline decoration-teal-400/40 underline-offset-[3px] transition hover:decoration-teal-600"
                          >
                            Volume savings
                          </a>{' '}
                          are on the companion card.
                        </>
                      ) : showVolumeColumn ? (
                        <>
                          <a
                            href="#store-volume-promo"
                            className="font-medium text-teal-700 underline decoration-teal-400/40 underline-offset-[3px] transition hover:decoration-teal-600"
                          >
                            Volume pricing
                          </a>{' '}
                          is on the right. If you have a code, use the{' '}
                          <span className="font-medium text-slate-800">cart page</span> — totals update before you pay.
                        </>
                      ) : (
                        <>
                          Paste any valid coupon on the <span className="font-medium text-slate-800">cart page</span> before
                          checkout. Newsletter and social codes update your total in one step.
                        </>
                      )}
                    </p>

                    {!showVolumeColumn && hasVolume ? (
                      <div className="space-y-4 overflow-hidden rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/20 p-4 shadow-inner sm:rounded-2xl sm:p-5">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
                          <div className="flex items-end gap-1">
                            <span className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-4xl font-black leading-none text-transparent sm:text-5xl">
                              {volumePromo!.percent}
                            </span>
                            <div className="mb-0.5 flex flex-col leading-none">
                              <span className="text-xl font-bold text-slate-800 sm:text-2xl">%</span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">off</span>
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
                          <div className="border-t border-teal-100/80 pt-4">
                            <CountdownBoxes days={countdown.days} hours={countdown.hours} mins={countdown.mins} secs={countdown.secs} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {hasCoupons ? (
                      <div>
                        <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-teal-800 sm:text-left sm:text-[10px] sm:tracking-[0.22em]">
                          Active codes · this store
                        </p>
                        <ul
                          className="grid gap-2 sm:grid-cols-1 sm:gap-2.5 lg:max-w-xl"
                          aria-label="Active coupon codes for this store"
                        >
                          {coupons.map((c) => (
                            <li
                              key={c.code}
                              className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50/40 to-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] transition hover:border-teal-200/50 hover:shadow-[0_8px_24px_-8px_rgba(20,184,166,0.15)] sm:rounded-2xl sm:p-4"
                            >
                              <div className="absolute right-2.5 top-2.5 h-7 w-7 rounded-full bg-teal-500/5 opacity-0 transition group-hover:opacity-100 sm:right-3 sm:top-3 sm:h-8 sm:w-8" aria-hidden />
                              <span className="font-mono text-sm font-semibold tracking-wide text-slate-900 sm:text-[15px]">{c.code}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-slate-500">
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
                <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-b from-slate-50/90 to-slate-100/30 p-4 shadow-inner sm:mt-7 sm:rounded-2xl sm:p-5">
                  <Link href={cartHref} className={promoCtaClassName}>
                    <span className="relative">Apply code in cart</span>
                    <CtaArrow />
                  </Link>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500 sm:mt-3 sm:text-left sm:text-[11px]">
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
