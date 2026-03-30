'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Homepage promo: drives shoppers to the cart to apply codes—copy and layout tuned for conversion.
 */
export default function CouponPromoSection({ storeSlug }: { storeSlug?: string | null }) {
  const cartHref = (() => {
    const base = '/cart';
    if (!storeSlug) return base;
    return `${base}?store=${encodeURIComponent(storeSlug)}`;
  })();

  return (
    <section className="w-full overflow-hidden border-y border-mint/20" aria-labelledby="coupon-promo-heading">
      {/* Top band: value prop */}
      <div className="bg-gradient-to-r from-mint/[0.12] via-cyan-50/50 to-teal-50/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div
              className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-md shadow-mint/10 ring-1 ring-mint/20 sm:mx-0"
              aria-hidden
            >
              <span className="text-3xl leading-none">🏷️</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="mb-1.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-mint-dark ring-1 ring-mint/25 sm:justify-start">
                <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-sm shadow-mint/50" />
                Smart checkout
              </p>
              <h2
                id="coupon-promo-heading"
                className="text-lg font-extrabold leading-snug tracking-tight text-gray-900 sm:text-xl md:text-2xl"
              >
                Your code belongs in the cart—<span className="text-mint-dark">watch the total drop.</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                Paste any valid coupon on the{' '}
                <strong className="font-semibold text-gray-800">cart</strong> page (before checkout). Newsletter deals,
                social drops, and partner promos update your order total in one click—no surprises at payment.
              </p>
            </div>
          </div>
          <Link
            href={cartHref}
            className="group relative mx-auto flex w-full max-w-xs shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-mint px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-mint/25 transition-all hover:bg-mint-dark hover:shadow-xl hover:shadow-mint/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 sm:mx-0 sm:w-auto sm:max-w-none"
          >
            <span className="relative z-10">Apply code in cart</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
              aria-hidden
            />
          </Link>
        </div>
      </div>
      {/* Lower strip: social proof + texture */}
      <div
        className="border-t border-mint/10 bg-white bg-[radial-gradient(circle_at_center,_rgb(79_209_199/0.08)_1px,_transparent_1px)] bg-[length:14px_14px] px-4 py-3 sm:px-6 lg:px-8"
        role="note"
      >
        <p className="mx-auto max-w-7xl text-center text-xs font-medium text-gray-500 sm:text-left">
          Same flow you get from email and social:{' '}
          <span className="text-gray-700">add to cart → paste code → see your new total</span> before you enter payment
          details.
        </p>
      </div>
    </section>
  );
}
