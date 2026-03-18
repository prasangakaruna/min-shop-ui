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
    business_entity: '',
    business_country: '',
    contact_phone: '',
    contact_address: '',
    currency_display: 'Sri Lankan Rupee (LKR Rs)',
    backup_region: 'Sri Lanka',
    unit_system: 'metric',
    default_weight_unit: 'kg',
    timezone: '',
    order_id_prefix: '#',
    order_id_suffix: '',
    order_processing_mode: 'manual' as 'auto_all' | 'auto_gift_cards' | 'manual',
    order_auto_archive: true,
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
        const settings = data.settings ?? {};
        const op = (settings.order_processing ?? {}) as {
          mode?: 'auto_all' | 'auto_gift_cards' | 'manual';
          auto_archive?: boolean;
        };
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          plan,
          is_active: data.is_active ?? true,
          plan_price: typeof customPrice === 'number' ? customPrice : defaultPrice,
          business_entity: (settings.business_entity as string | undefined) ?? '',
          business_country: (settings.business_country as string | undefined) ?? '',
          contact_phone: (settings.contact_phone as string | undefined) ?? '',
          contact_address: (settings.contact_address as string | undefined) ?? '',
          currency_display:
            (settings.currency_display as string | undefined) ?? 'Sri Lankan Rupee (LKR Rs)',
          backup_region: (settings.backup_region as string | undefined) ?? 'Sri Lanka',
          unit_system: (settings.unit_system as string | undefined) ?? 'metric',
          default_weight_unit:
            (settings.default_weight_unit as string | undefined) ?? 'kg',
          timezone: (settings.timezone as string | undefined) ?? '',
          order_id_prefix: (settings.order_id_prefix as string | undefined) ?? '#',
          order_id_suffix: (settings.order_id_suffix as string | undefined) ?? '',
          order_processing_mode: op.mode ?? 'manual',
          order_auto_archive: op.auto_archive ?? true,
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
      const settingsPayload: Record<string, unknown> = {
        business_entity: form.business_entity || null,
        business_country: form.business_country || null,
        contact_phone: form.contact_phone || null,
        contact_address: form.contact_address || null,
        currency_display: form.currency_display,
        backup_region: form.backup_region,
        unit_system: form.unit_system,
        default_weight_unit: form.default_weight_unit,
        timezone: form.timezone || null,
        order_id_prefix: form.order_id_prefix || null,
        order_id_suffix: form.order_id_suffix || null,
        order_processing: {
          mode: form.order_processing_mode,
          auto_archive: form.order_auto_archive,
        },
      };
      if (isSuperAdmin) {
        settingsPayload.plan_price = form.plan_price;
      }
      const body: {
        name: string;
        email: string | null;
        plan: string;
        is_active: boolean;
        settings?: Record<string, unknown>;
      } = {
        name: form.name,
        email: form.email || null,
        plan: form.plan,
        is_active: form.is_active,
      };
      body.settings = settingsPayload;
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

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200">
              <span className="text-red-600">!</span>
            </span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex gap-8">
            <div className="hidden w-56 shrink-0 md:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-9 w-32 animate-pulse rounded bg-gray-100" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
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
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Settings sub-navigation */}
            <aside className="hidden w-56 shrink-0 md:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Settings
                  </p>
                </div>
                <nav className="mt-1 space-y-0.5 text-sm">
                  {[
                    'General',
                    'Plan',
                    'Billing',
                    'Users',
                    'Payments',
                    'Checkout',
                    'Customer accounts',
                    'Shipping and delivery',
                    'Taxes and duties',
                    'Locations',
                    'Apps',
                    'Sales channels',
                    'Domains',
                    'Customer events',
                    'Notifications',
                    'Metafields and metaobjects',
                    'Languages',
                    'Customer privacy',
                    'Policies',
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left ${
                        item === 'General'
                          ? 'bg-gray-100 font-medium text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Integrations
                  </p>
                  <nav className="mt-1 space-y-0.5 text-sm">
                    <Link
                      href="/admin/settings/api"
                      className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      API Settings
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50"
                    >
                      Webhooks
                    </button>
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main settings content */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-6">
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

            {/* Business details */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <IconStore className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">General</h2>
                    <p className="text-sm text-gray-500">Business details used for payments, markets, and apps.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business name
                  </label>
                  <input
                    type="text"
                    value={form.business_entity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, business_entity: e.target.value }))
                    }
                    placeholder="My Store – entity"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country / region
                  </label>
                  <input
                    type="text"
                    value={form.business_country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, business_country: e.target.value }))
                    }
                    placeholder="Sri Lanka"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>
            </section>

            {/* Store contact details */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Store contact details</h2>
                <p className="text-sm text-gray-500">How customers can reach your store.</p>
              </div>
              <div className="space-y-5 p-6">
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, contact_phone: e.target.value }))
                      }
                      placeholder="+94 71 234 5678"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Store address
                    </label>
                    <input
                      type="text"
                      value={form.contact_address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, contact_address: e.target.value }))
                      }
                      placeholder="Sri Lanka"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
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

            {/* Store defaults */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Store defaults</h2>
                <p className="text-sm text-gray-500">
                  Region, units, and order ID format used across your store.
                </p>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency display
                    </label>
                    <input
                      type="text"
                      value={form.currency_display}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currency_display: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      To manage the currencies customers see, go to Markets.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Backup region
                    </label>
                    <input
                      type="text"
                      value={form.backup_region}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, backup_region: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit system
                      </label>
                      <select
                        value={form.unit_system}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, unit_system: e.target.value }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                      >
                        <option value="metric">Metric system</option>
                        <option value="imperial">Imperial system</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Default weight unit
                      </label>
                      <input
                        type="text"
                        value={form.default_weight_unit}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            default_weight_unit: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time zone
                    </label>
                    <input
                      type="text"
                      value={form.timezone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, timezone: e.target.value }))
                      }
                      placeholder="(GMT+05:30) Sri Jayawardenepura"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Order ID format</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Shown on the order page, customer pages, and notifications.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Prefix
                        </label>
                        <input
                          type="text"
                          value={form.order_id_prefix}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, order_id_prefix: e.target.value }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Suffix
                        </label>
                        <input
                          type="text"
                          value={form.order_id_suffix}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, order_id_suffix: e.target.value }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Your order ID will appear as {form.order_id_prefix}1001
                      {form.order_id_suffix}, {form.order_id_prefix}1002
                      {form.order_id_suffix}, ...
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Order processing */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Order processing</h2>
                <p className="text-sm text-gray-500">
                  Choose how orders are fulfilled and archived.
                </p>
              </div>
              <div className="space-y-6 p-6 text-sm text-gray-700">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-900">
                    After an order has been paid
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="order_processing_mode"
                        value="auto_all"
                        checked={form.order_processing_mode === 'auto_all'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            order_processing_mode: e.target.value as
                              | 'auto_all'
                              | 'auto_gift_cards'
                              | 'manual',
                          }))
                        }
                        className="h-4 w-4 border-gray-300 text-mint focus:ring-mint/40"
                      />
                      <span>Automatically fulfill the order&apos;s line items</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="order_processing_mode"
                        value="auto_gift_cards"
                        checked={form.order_processing_mode === 'auto_gift_cards'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            order_processing_mode: e.target.value as
                              | 'auto_all'
                              | 'auto_gift_cards'
                              | 'manual',
                          }))
                        }
                        className="h-4 w-4 border-gray-300 text-mint focus:ring-mint/40"
                      />
                      <span>Automatically fulfill only the gift cards of the order</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="order_processing_mode"
                        value="manual"
                        checked={form.order_processing_mode === 'manual'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            order_processing_mode: e.target.value as
                              | 'auto_all'
                              | 'auto_gift_cards'
                              | 'manual',
                          }))
                        }
                        className="h-4 w-4 border-gray-300 text-mint focus:ring-mint/40"
                      />
                      <span>Don&apos;t fulfill any of the order&apos;s line items automatically</span>
                    </label>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={form.order_auto_archive}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, order_auto_archive: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                    />
                    <span>Automatically archive the order when it&apos;s fulfilled and paid</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    The order will be removed from your list of open orders.
                  </p>
                </div>
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
          </div>
        )}
      </main>
    </div>
  );
}
