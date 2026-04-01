'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type StoreSummary } from '@/lib/api';
import { ProAdminGuard } from '../ProAdminGuard';

const DEFAULT_MIN = 5000;
const DEFAULT_PCT = 10;

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function IconBulk({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

export default function ProPromotionsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hasStoreOverride, setHasStoreOverride] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [minSubtotal, setMinSubtotal] = useState(String(DEFAULT_MIN));
  const [percent, setPercent] = useState(String(DEFAULT_PCT));

  const applyFromStore = useCallback((s: StoreSummary) => {
    const vol = s.settings?.storefront_volume_promo;
    if (vol && typeof vol === 'object') {
      setHasStoreOverride(true);
      setEnabled(vol.enabled !== false);
      setMinSubtotal(
        vol.min_subtotal != null && !Number.isNaN(Number(vol.min_subtotal))
          ? String(vol.min_subtotal)
          : String(DEFAULT_MIN)
      );
      setPercent(
        vol.percent != null && !Number.isNaN(Number(vol.percent)) ? String(vol.percent) : String(DEFAULT_PCT)
      );
    } else {
      setHasStoreOverride(false);
      setEnabled(true);
      setMinSubtotal(String(DEFAULT_MIN));
      setPercent(String(DEFAULT_PCT));
    }
  }, []);

  const load = useCallback(() => {
    if (!token || !currentStore) return;
    setLoading(true);
    setError(null);
    apiRequest<StoreSummary>('/store', { token, storeId: currentStore.id })
      .then(applyFromStore)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load store'))
      .finally(() => setLoading(false));
  }, [token, currentStore, applyFromStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    load();
  }, [token, currentStore, load]);

  const minNum = parseFloat(minSubtotal);
  const pctNum = parseFloat(percent);
  const minValid = !Number.isNaN(minNum) && minNum >= 0;
  const pctValid = !Number.isNaN(pctNum) && pctNum >= 0 && pctNum <= 100;

  const preview = useMemo(() => {
    if (!minValid || !pctValid) return null;
    const exampleCart = minNum + 1200;
    const qualifies = exampleCart >= minNum;
    const savings = qualifies ? Math.round(exampleCart * (pctNum / 100) * 100) / 100 : 0;
    const after = Math.max(0, exampleCart - savings);
    return { exampleCart, qualifies, savings, after };
  }, [minNum, pctNum, minValid, pctValid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    const min = parseFloat(minSubtotal);
    const pct = parseFloat(percent);
    if (Number.isNaN(min) || min < 0) {
      setError('Minimum order amount must be a number ≥ 0.');
      return;
    }
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError('Percent must be between 0 and 100.');
      return;
    }
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: {
          settings: {
            storefront_volume_promo: {
              enabled,
              min_subtotal: min,
              percent: pct,
            },
          },
        },
      });
      setHasStoreOverride(true);
      setSavedAt(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleUsePlatformDefaults = async () => {
    if (!token || !currentStore) return;
    if (
      !confirm(
        'Remove this store’s bulk discount settings? The storefront will use the server default (e.g. .env).'
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: {
          settings: {
            storefront_volume_promo: null,
          },
        },
      });
      setHasStoreOverride(false);
      setEnabled(true);
      setMinSubtotal(String(DEFAULT_MIN));
      setPercent(String(DEFAULT_PCT));
      setSavedAt('Reset — using platform defaults');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProAdminGuard>
      <div className="min-h-full bg-gradient-to-b from-gray-50 to-gray-100/80 text-gray-900">
        {/* Page header — matches Coupons / admin rhythm */}
        <div className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm px-6 py-6 sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mint-dark/90">Pro &amp; Admin</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Store promotions</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                Shape how shoppers save on big carts. Bulk discount applies automatically at checkout; stack it with
                codes from{' '}
                <Link href="/admin/coupons" className="font-semibold text-mint hover:text-mint-dark underline-offset-2 hover:underline">
                  Coupons
                </Link>
                .
              </p>
            </div>
            <Link
              href="/admin/pro"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-mint/40 hover:text-mint"
            >
              <span aria-hidden>←</span> Pro overview
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {!currentStore ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-950 shadow-sm">
              <p className="font-medium">Choose a store</p>
              <p className="mt-1 text-amber-900/80">Use the store dropdown in the header to edit promotions.</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white py-20 shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent" />
              <p className="text-sm text-gray-500">Loading promotion settings…</p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left: visual bulk-discount hero + preview */}
              <div className="space-y-6 lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl border border-teal-200/60 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-6 text-white shadow-xl shadow-teal-900/20 sm:p-8">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                        <IconBulk className="h-7 w-7 text-white" />
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                          enabled
                            ? 'bg-white/20 text-white ring-white/30'
                            : 'bg-black/25 text-white/80 ring-white/10'
                        }`}
                      >
                        {enabled ? 'Live on storefront' : 'Paused'}
                      </span>
                    </div>
                    <h2 className="mt-6 text-xl font-bold leading-tight sm:text-2xl">Bulk order discount</h2>
                    <p className="mt-2 text-sm leading-relaxed text-teal-50/95">
                      Reward larger carts: when subtotal crosses your threshold, Mint knocks a percent off the whole
                      order—no code to remember.
                    </p>
                    <div className="mt-6 rounded-2xl bg-black/20 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-100/90">Shoppers see</p>
                      <p className="mt-2 text-lg font-bold sm:text-xl">
                        {enabled && minValid && pctValid ? (
                          <>
                            Spend <span className="text-cyan-200">${formatMoney(minNum)}</span>+, save{' '}
                            <span className="text-cyan-200">{pctNum}%</span> on this order
                          </>
                        ) : (
                          <span className="text-teal-100/80">Enter valid amounts to preview</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live math preview */}
                {preview ? (
                  <div
                    className={`rounded-2xl border bg-white p-5 shadow-sm ${
                      enabled ? 'border-gray-200' : 'border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-gray-900">
                      <IconSpark className="h-5 w-5 text-amber-500" />
                      <h3 className="text-sm font-semibold">Example checkout</h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Illustration only—your cart uses real line prices.</p>
                    {!enabled ? (
                      <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
                        Toggle is off — shoppers won&apos;t receive this discount until you enable it.
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-3 rounded-xl bg-gray-50/80 p-4 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Sample cart subtotal</span>
                        <span className="font-mono font-medium text-gray-900">${formatMoney(preview.exampleCart)}</span>
                      </div>
                      {preview.qualifies ? (
                        <>
                          <div className="flex justify-between text-emerald-700">
                            <span>Bulk savings ({pctNum}%)</span>
                            <span className="font-mono font-semibold">−${formatMoney(preview.savings)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-gray-900">
                            <span>After discount</span>
                            <span className="font-mono text-mint-dark">${formatMoney(preview.after)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-amber-800">Below threshold—no bulk discount on this sample amount.</p>
                      )}
                    </div>
                  </div>
                ) : null}

                <Link
                  href="/admin/coupons"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-mint/35 hover:shadow-md"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Coupon codes</p>
                    <p className="mt-1 text-xs text-gray-500">Create timed codes, min-order rules, and % or fixed off.</p>
                  </div>
                  <span className="text-mint transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
              </div>

              {/* Right: form */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleSave}
                  className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-gray-200/50 sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Bulk discount rules</h2>
                      <p className="mt-0.5 text-xs text-gray-500">Saved per store · applies to cart &amp; checkout totals</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        hasStoreOverride
                          ? 'bg-mint/15 text-mint-dark ring-1 ring-mint/25'
                          : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/80'
                      }`}
                    >
                      {hasStoreOverride ? 'Custom for this store' : 'Platform default until you save'}
                    </span>
                  </div>

                  <div className="mt-5 space-y-5">
                    {error ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                      </div>
                    ) : null}
                    {savedAt ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        {savedAt.includes('—') ? savedAt : `Saved at ${savedAt}`}
                      </div>
                    ) : null}

                    <div
                      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                        hasStoreOverride ? 'border-mint/25 bg-mint/[0.06]' : 'border-gray-100 bg-gray-50/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">Enable on storefront</p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          Turn off to stop automatic bulk pricing without deleting your numbers.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => setEnabled(!enabled)}
                        className={`relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 ${
                          enabled ? 'bg-mint' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
                            enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="vol-min" className="flex items-center gap-2 text-sm font-medium text-gray-800">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/10 text-mint-dark text-xs font-bold">
                            $
                          </span>
                          Minimum cart subtotal
                        </label>
                        <div className="relative mt-2">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                            $
                          </span>
                          <input
                            id="vol-min"
                            type="number"
                            min={0}
                            step={0.01}
                            value={minSubtotal}
                            onChange={(e) => setMinSubtotal(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-9 pr-4 text-base font-medium text-gray-900 transition focus:border-mint focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint/20"
                          />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                          Line-item subtotal must reach this amount before the percent applies to the current order.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="vol-pct" className="flex items-center gap-2 text-sm font-medium text-gray-800">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold">
                            %
                          </span>
                          Discount percent
                        </label>
                        <input
                          id="vol-pct"
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={percent}
                          onChange={(e) => setPercent(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-base font-medium text-gray-900 transition focus:border-mint focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint/20 sm:max-w-[11rem]"
                        />
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                          Off the cart subtotal. Stacks with coupons; total discount never exceeds subtotal.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-mint to-teal-600 px-6 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:from-mint-dark hover:to-teal-700 disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save for this store'}
                      </button>
                      {hasStoreOverride ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleUsePlatformDefaults}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Revert to platform defaults
                        </button>
                      ) : null}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProAdminGuard>
  );
}
