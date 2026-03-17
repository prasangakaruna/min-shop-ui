'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type StoreSummary } from '@/lib/api';

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  basic: 9,
  standard: 29,
  premium: 99,
};

const PLAN_STEP = 5;

function IconStore({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}

function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const isSuperAdmin = (session as { isSuperAdmin?: boolean } | null)?.isSuperAdmin ?? false;

  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    plan: 'basic' as string,
    is_active: true,
    plan_price: 0,
  });
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiRequest<StoreSummary>('/store', { token, storeId: currentStore.id })
      .then((data) => {
        setStore(data);
        const plan = data.plan ?? 'basic';
        const defaultPrice = DEFAULT_PLAN_PRICES[plan] ?? DEFAULT_PLAN_PRICES.basic;
        const customPrice = data.settings?.plan_price;
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          plan,
          is_active: data.is_active ?? true,
          plan_price: typeof customPrice === 'number' ? customPrice : defaultPrice,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load store'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  const defaultPrice = DEFAULT_PLAN_PRICES[form.plan] ?? DEFAULT_PLAN_PRICES.basic;
  const isCustomPrice = store && typeof store.settings?.plan_price === 'number';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    setSaving(true);
    setError(null);
    try {
      const body: { name: string; email: string | null; plan: string; is_active: boolean; settings?: { plan_price: number } } = {
        name: form.name,
        email: form.email || null,
        plan: form.plan,
        is_active: form.is_active,
      };
      if (isSuperAdmin) body.settings = { plan_price: form.plan_price };
      const updated = await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body,
      });
      setStore(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleIncreasePrice = () => setForm((f) => ({ ...f, plan_price: Math.max(0, f.plan_price + PLAN_STEP) }));
  const handleDecreasePrice = () => setForm((f) => ({ ...f, plan_price: Math.max(0, f.plan_price - PLAN_STEP) }));
  const resetToDefaultPrice = () => setForm((f) => ({ ...f, plan_price: DEFAULT_PLAN_PRICES[f.plan] ?? DEFAULT_PLAN_PRICES.basic }));

  if (!currentStore) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <IconStore className="h-6 w-6 text-amber-600" />
          </div>
          <p className="mt-4 font-semibold text-amber-900">Select a store</p>
          <p className="mt-1 text-sm text-amber-700">Choose a store from the header to manage its settings.</p>
          <Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-mint">
            ← Home
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Store settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your store details, status, and plan.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200">
              <span className="text-red-600">!</span>
            </span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="mt-5 space-y-4">
                  <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store status */}
            <section
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                form.is_active ? 'border-l-4 border-l-emerald-500 border-gray-200' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${form.is_active ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {form.is_active ? (
                      <IconCheck className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <IconStore className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Store status</h2>
                    <p className="text-sm text-gray-500">Turn your store on or off anytime.</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_active}
                    onClick={() => {
                      if (form.is_active) setShowDeactivateConfirm(true);
                      else setForm((f) => ({ ...f, is_active: true }));
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 ${
                      form.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                        form.is_active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      form.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {form.is_active ? 'Live' : 'Paused'}
                  </span>
                  <p className="text-sm text-gray-500">
                    {form.is_active ? 'Your store is visible to customers.' : 'Deactivated — turn on and save to go live again.'}
                  </p>
                </div>
              </div>
            </section>

            {showDeactivateConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
                <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                  <h3 id="deactivate-title" className="text-lg font-semibold text-gray-900">Deactivate store?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Your store won’t be visible to customers. You can turn it back on anytime.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, is_active: false }));
                        setShowDeactivateConfirm(false);
                      }}
                      className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
                    >
                      Yes, deactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeactivateConfirm(false)}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Store details */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <IconStore className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Store details</h2>
                    <p className="text-sm text-gray-500">Name, contact, and URL info.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Store name</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="My store"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Contact email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="store@example.com"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                {store && (
                  <div className="flex flex-wrap gap-2 rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-xs font-medium text-gray-500">Slug</span>
                    <span className="text-xs text-gray-700 font-mono">{store.slug}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs font-medium text-gray-500">Domain</span>
                    <span className="text-xs text-gray-700 font-mono">{store.domain ?? '—'}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Plan & billing */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10">
                    <IconCreditCard className="h-5 w-5 text-mint" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Plan & billing</h2>
                    <p className="text-sm text-gray-500">
                      {isSuperAdmin ? 'Plan tier and custom price (super admin only).' : 'Plan and current price. Custom pricing is for super admins only.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="plan" className="block text-sm font-medium text-gray-700">Plan</label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(['basic', 'standard', 'premium'] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            plan,
                            plan_price: isCustomPrice ? f.plan_price : (DEFAULT_PLAN_PRICES[plan] ?? 9),
                          }))
                        }
                        className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                          form.plan === plan
                            ? 'border-mint bg-mint/5 text-mint'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="capitalize">{plan}</span>
                        <span className="mt-0.5 block text-xs font-normal text-gray-500">${DEFAULT_PLAN_PRICES[plan]}/mo default</span>
                      </button>
                    ))}
                  </div>
                </div>
                {isSuperAdmin ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your price (super admin)</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
                        <button
                          type="button"
                          onClick={handleDecreasePrice}
                          className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          aria-label="Decrease price"
                        >
                          −
                        </button>
                        <span className="flex h-11 min-w-[5rem] items-center justify-center border-x border-gray-200 bg-white px-4 text-base font-semibold tabular-nums text-gray-900">
                          ${form.plan_price}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncreasePrice}
                          className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          aria-label="Increase price"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">/ month</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={form.plan_price}
                        onChange={(e) => setForm((f) => ({ ...f, plan_price: Math.max(0, Number(e.target.value) || 0) }))}
                        className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-center text-sm tabular-nums focus:border-mint focus:ring-2 focus:ring-mint/20"
                      />
                      {(isCustomPrice || form.plan_price !== defaultPrice) && (
                        <button
                          type="button"
                          onClick={resetToDefaultPrice}
                          className="text-sm font-medium text-mint hover:underline"
                        >
                          Reset to ${defaultPrice}
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Default for {form.plan} is ${defaultPrice}/mo. Set a custom price for this store above.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <p className="text-base font-semibold text-gray-900">${form.plan_price} / month</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {isCustomPrice ? 'Custom price set by super admin.' : `Default for ${form.plan} plan.`}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-dark disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
              <Link
                href="/admin"
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
