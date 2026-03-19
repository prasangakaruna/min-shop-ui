'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiRequest, type StoreListResponse, type Order, type StoreSummary } from '@/lib/api';
import { fetchActiveSubscription } from '@/lib/subscription';

type StoreSummaryLite = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
};

interface OrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function ProAdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [stores, setStores] = useState<StoreSummaryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<
    Record<
      number,
      {
        orders: number;
        revenue: number;
      }
    >
  >({});
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [proAccessState, setProAccessState] = useState<'loading' | 'ok' | 'blocked'>('loading');
  const [integrationStore, setIntegrationStore] = useState<StoreSummaryLite | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integration, setIntegration] = useState<{ base_url?: string; api_key?: string; enabled?: boolean }>({});
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const isStoreOnboardingComplete = (store: StoreSummary): boolean => {
    const s = store.settings ?? {};
    if (s.onboarding_completed) return true;
    const ob = s.onboarding ?? {};
    return Boolean(
      (store.name ?? '').trim() &&
        (s.business_country ?? '').toString().trim() &&
        (ob.store_category ?? '').toString().trim() &&
        (ob.business_stage === 'new' || ob.business_stage === 'existing') &&
        Array.isArray(ob.sell_types) &&
        ob.sell_types.length > 0 &&
        Array.isArray(ob.sell_places) &&
        ob.sell_places.length > 0
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem('mint_admin_onboarding_completed_v1') === 'true';
    if (done) {
      setOnboardingChecked(true);
      return;
    }
    // Incognito/new browser: accept server onboarding flag from any owned store.
    if (!token) return;
    let cancelled = false;
    apiRequest<StoreListResponse>('/me/stores', { token, query: { per_page: 1 } })
      .then(async (res) => {
        if (cancelled) return;
        const storeId = res.data?.[0]?.id;
        if (!storeId) {
          router.replace('/admin/onboarding');
          return;
        }
        const store = await apiRequest<StoreSummary>('/store', { token, storeId });
        if (isStoreOnboardingComplete(store)) {
          window.localStorage.setItem('mint_admin_onboarding_completed_v1', 'true');
          setOnboardingChecked(true);
        } else {
          router.replace('/admin/onboarding');
        }
      })
      .catch(() => router.replace('/admin/onboarding'));
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    // Wait until the admin onboarding redirect is finished.
    if (!onboardingChecked) return;

    let cancelled = false;
    setProAccessState('loading');

    fetchActiveSubscription({ token, ownerType: 'user' })
      .then((sub) => {
        if (cancelled) return;
        const ok = Boolean(sub && sub.status === 'active' && sub.plan_code === 'pro');
        setProAccessState(ok ? 'ok' : 'blocked');
        if (!ok) router.replace('/admin/pro/plans');
      })
      .catch(() => {
        if (cancelled) return;
        setProAccessState('blocked');
        router.replace('/admin/pro/plans');
      });

    return () => {
      cancelled = true;
    };
  }, [token, onboardingChecked, router]);

  useEffect(() => {
    if (!token) return;
    // Only allow users who chose the "pro_admin" level
    const userTypeCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)USER_TYPE=([^;]+)/)?.[1] : null;
    const decodedType = userTypeCookie ? decodeURIComponent(userTypeCookie) : null;
    if (decodedType && decodedType !== 'pro_admin') {
      router.replace('/admin');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiRequest<StoreListResponse>('/me/stores', { token, query: { per_page: 50 } })
      .then(async (res) => {
        if (cancelled) return;
        const list: StoreSummaryLite[] = (res.data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          plan: s.plan,
          is_active: s.is_active,
        }));
        setStores(list);
        const metricsEntries: typeof metrics = {};
        await Promise.all(
          list.map(async (store) => {
            try {
              const ordersRes = await apiRequest<OrdersResponse>('/store/orders', {
                token,
                storeId: store.id,
                query: { per_page: 50 },
              });
              const orders = (ordersRes.data ?? []) as Order[];
              const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
              metricsEntries[store.id] = { orders: ordersRes.total ?? orders.length, revenue };
            } catch {
              metricsEntries[store.id] = { orders: 0, revenue: 0 };
            }
          })
        );
        if (!cancelled) {
          setMetrics(metricsEntries);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load admin overview');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const openIntegration = async (store: StoreSummaryLite) => {
    if (!token) return;
    setIntegrationStore(store);
    setIntegrationLoading(true);
    setIntegrationError(null);
    try {
      const data = await apiRequest<{ base_url?: string; api_key?: string; enabled?: boolean }>(
        '/store/pos-integration',
        { token, storeId: store.id }
      );
      setIntegration(data ?? {});
    } catch (e) {
      setIntegrationError(e instanceof Error ? e.message : 'Failed to load integration');
      setIntegration({});
    } finally {
      setIntegrationLoading(false);
    }
  };

  const saveIntegration = async () => {
    if (!token || !integrationStore) return;
    setIntegrationLoading(true);
    setIntegrationError(null);
    try {
      const body = {
        base_url: integration.base_url ?? null,
        api_key: integration.api_key ?? null,
        enabled: integration.enabled ?? false,
      };
      const data = await apiRequest<{ base_url?: string; api_key?: string; enabled?: boolean }>(
        '/store/pos-integration',
        { method: 'PATCH', token, storeId: integrationStore.id, body }
      );
      setIntegration(data ?? body);
      setTestStatus(null);
      router.push(`/admin/pro/integration?store=${integrationStore.id}`);
    } catch (e) {
      setIntegrationError(e instanceof Error ? e.message : 'Failed to save integration');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const testIntegration = async () => {
    if (!token || !integrationStore) return;
    setIntegrationLoading(true);
    setIntegrationError(null);
    setTestStatus(null);
    try {
      const data = await apiRequest<{ ok: boolean; status?: number; message?: string }>(
        '/store/pos-integration/test',
        {
          method: 'POST',
          token,
          storeId: integrationStore.id,
          body: {
            method: 'GET',
            path: '',
          },
        }
      );
      if (data.ok) {
        setTestStatus(`Connection successful (status ${data.status ?? 200}).`);
      } else {
        setTestStatus(data.message ?? 'Test call did not succeed.');
      }
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : 'Failed to reach the external API.');
    } finally {
      setIntegrationLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    );
  }

  if (!onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Preparing your admin workspace…</p>
        </div>
      </div>
    );
  }

  if (proAccessState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Checking your Pro access…</p>
        </div>
      </div>
    );
  }

  if (proAccessState === 'blocked') {
    return null;
  }

  const totalRevenue = Object.values(metrics).reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = Object.values(metrics).reduce((sum, m) => sum + m.orders, 0);

  return (
    <div className="min-h-full bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Page header + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint tracking-wide mb-2">
              PRO &amp; ADMIN
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Platform overview
            </h2>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Monitor revenue, multi‑store health, and logistics across your global network of stores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:border-mint hover:text-mint"
            >
              Go to store dashboard
            </Link>
            <Link
              href="/admin/pro/plans"
              className="inline-flex items-center rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-xs font-semibold text-mint hover:bg-mint/20"
            >
              Plans &amp; billing
            </Link>
            <span className="inline-flex items-center rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-xs font-semibold text-mint">
              Super admin workspace
            </span>
          </div>
        </div>

        {/* Top KPIs */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total revenue (all stores)</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
              ${totalRevenue.toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Includes demo orders from every active store.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total orders</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">{totalOrders}</p>
            <p className="mt-2 text-xs text-gray-500">Across all stores you own.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Stores</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">{stores.length}</p>
            <p className="mt-2 text-xs text-gray-500">
              {stores.filter((s) => s.is_active).length} active ·{' '}
              {stores.filter((s) => !s.is_active).length} paused
            </p>
          </div>
        </section>

        {/* Store table */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Stores overview</h2>
              <p className="text-xs text-gray-500">Revenue and order volume by store.</p>
            </div>
            <Link
              href="/admin/stores"
              className="text-xs font-medium text-mint hover:text-mint-dark"
            >
              Manage stores →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  <div className="h-7 w-24 rounded-full bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No stores yet. Create a store from the admin to see platform‑wide insights here.
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] text-[11px] font-medium text-gray-500 px-2 pb-2">
                <span>Store details</span>
                <span className="text-center">Status</span>
                <span className="text-right">Revenue</span>
                <span className="text-right">Orders</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="space-y-2">
                {stores.map((store) => {
                  const m = metrics[store.id] ?? { orders: 0, revenue: 0 };
                  return (
                    <div
                      key={store.id}
                      className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-mint/10 flex items-center justify-center text-[11px] font-semibold text-mint">
                          {store.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{store.name}</p>
                          <p className="text-[11px] text-gray-500">{store.slug}</p>
                        </div>
                      </div>
                      <div className="md:text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                            store.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {store.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="md:text-right">
                        <p className="text-[11px] text-gray-500 md:hidden">Revenue</p>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          ${m.revenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-[11px] text-gray-500 md:hidden">Orders</p>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          {m.orders}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <Link
                          href={`/admin?store=${encodeURIComponent(String(store.id))}`}
                          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-mint hover:text-mint"
                        >
                          Open store
                        </Link>
                        <button
                          type="button"
                          onClick={() => openIntegration(store)}
                          className="mt-2 inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:border-mint/40 hover:text-mint"
                        >
                          Configure integration
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
      {integrationStore && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Connect physical store system
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Link <span className="font-medium">{integrationStore.name}</span> to your external POS
              or ERP API so Mint can sync data between systems.
            </p>
            {integrationError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {integrationError}
              </div>
            )}
            {testStatus && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {testStatus}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  API base URL
                </label>
                <input
                  type="url"
                  value={integration.base_url ?? ''}
                  onChange={(e) =>
                    setIntegration((prev) => ({ ...prev, base_url: e.target.value }))
                  }
                  placeholder="https://pos.yourdomain.com/api"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  API key / token
                </label>
                <input
                  type="text"
                  value={integration.api_key ?? ''}
                  onChange={(e) =>
                    setIntegration((prev) => ({ ...prev, api_key: e.target.value }))
                  }
                  placeholder="Paste a secret key from your POS system"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={integration.enabled ?? false}
                  onChange={(e) =>
                    setIntegration((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 rounded border-gray-300 text-mint focus:ring-mint/40"
                />
                <span>Enable syncing between this store and the physical system</span>
              </label>
              <p className="text-[11px] text-gray-400">
                We&apos;ll use this configuration for future sync jobs (for example, pulling
                inventory or pushing orders). Exact sync rules can be implemented later.
              </p>
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                disabled={integrationLoading}
                onClick={testIntegration}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-mint hover:text-mint disabled:opacity-60"
              >
                Test connection
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!integrationLoading) {
                    setIntegrationStore(null);
                    setIntegrationError(null);
                  }
                }}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={integrationLoading}
                onClick={saveIntegration}
                className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-1.5 text-xs font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
              >
                {integrationLoading && (
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>Save integration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

