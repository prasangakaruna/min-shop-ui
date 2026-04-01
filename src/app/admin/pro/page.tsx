'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiRequest, getImageDisplayUrl, type StoreListResponse, type Order, type StoreSummary } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { mergeProDashboard } from './ProHomeCustomizePanel';
import { ProAdminGuard } from './ProAdminGuard';

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
  const { currentStore, loading: storeCtxLoading } = useStore();

  const [stores, setStores] = useState<StoreSummaryLite[]>([]);
  const [storeDetail, setStoreDetail] = useState<StoreSummary | null>(null);
  const [storeDetailLoading, setStoreDetailLoading] = useState(true);
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
  const [integrationStore, setIntegrationStore] = useState<StoreSummaryLite | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integration, setIntegration] = useState<{ base_url?: string; api_key?: string; enabled?: boolean }>({});
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
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

  useEffect(() => {
    if (!token || !currentStore?.id) {
      setStoreDetail(null);
      setStoreDetailLoading(false);
      return;
    }
    let cancelled = false;
    setStoreDetailLoading(true);
    apiRequest<StoreSummary>('/store', { token, storeId: currentStore.id })
      .then((s) => {
        if (!cancelled) setStoreDetail(s);
      })
      .catch(() => {
        if (!cancelled) setStoreDetail(null);
      })
      .finally(() => {
        if (!cancelled) setStoreDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore?.id]);

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

  const cfg = mergeProDashboard(storeDetail?.settings?.pro_dashboard);
  const scope = cfg.kpis_scope ?? 'all_stores';
  const effectiveStores =
    scope === 'current_store' && currentStore ? stores.filter((s) => s.id === currentStore.id) : stores;
  const totalRevenue = effectiveStores.reduce((sum, s) => sum + (metrics[s.id]?.revenue ?? 0), 0);
  const totalOrders = effectiveStores.reduce((sum, s) => sum + (metrics[s.id]?.orders ?? 0), 0);

  const defaultSubtitle =
    'Monitor revenue, multi‑store health, and logistics across your global network of stores.';
  const heroTitle = cfg.title?.trim() || 'Platform overview';
  const heroSubtitle = cfg.subtitle?.trim() || defaultSubtitle;
  const badgeLabel = cfg.badge_label?.trim() || 'PRO & ADMIN';
  /** Primary accent from Theme editor (storefront home); fallback to Mint brand. */
  const themePrimary = storeDetail?.settings?.storefront_home?.theme?.colorPrimary?.trim();
  const accentFromTheme =
    themePrimary && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(themePrimary) ? themePrimary : undefined;
  const accent = accentFromTheme ?? '#0d9488';
  const heroImage = cfg.hero_image_url?.trim();
  const headerLogo = cfg.header_logo_url?.trim();

  const showKpis = cfg.show_top_kpis !== false;
  const showRev = cfg.show_kpi_total_revenue !== false;
  const showOrd = cfg.show_kpi_total_orders !== false;
  const showCnt = cfg.show_kpi_store_count !== false;
  const visibleKpiCount = [showRev, showOrd, showCnt].filter(Boolean).length;
  const kpiGridClass =
    visibleKpiCount <= 1 ? 'md:grid-cols-1' : visibleKpiCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  const primaryLabel = cfg.primary_action_label?.trim();
  const primaryHref = cfg.primary_action_href?.trim();
  const showCustomPrimary = Boolean(primaryLabel && primaryHref);

  const revenueKpiLabel =
    scope === 'current_store' ? 'Revenue (this store)' : 'Total revenue (all stores)';
  const ordersKpiLabel = scope === 'current_store' ? 'Orders (this store)' : 'Total orders';
  const storesKpiLabel = scope === 'current_store' ? 'Stores in view' : 'Stores';

  return (
    <ProAdminGuard>
    <div className="min-h-full bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!storeCtxLoading && !currentStore && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Select a store in the header to load this store&apos;s Pro home settings.
          </div>
        )}

        {storeCtxLoading || storeDetailLoading ? (
          <p className="text-xs text-gray-500">Loading store preferences…</p>
        ) : currentStore ? (
          <p className="text-xs text-gray-600">
            Pro home for{' '}
            <span className="font-semibold text-gray-900">{currentStore.name}</span>
            {currentStore.domain ? (
              <span className="text-gray-500"> — storefront host {currentStore.domain}</span>
            ) : null}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">
            Customize how this page looks in{' '}
            <Link href="/admin/pro/customize" className="font-medium text-mint hover:text-mint-dark">
              Customize Pro home
            </Link>
            . Manage bulk discounts and related rules in{' '}
            <Link href="/admin/pro/promotions" className="font-medium text-mint hover:text-mint-dark">
              Promotions
            </Link>
            .
          </p>
        </div>

        {/* Page header + actions */}
        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200 p-6 sm:p-8"
          style={
            heroImage
              ? undefined
              : {
                  borderColor: `${accent}55`,
                  background: `linear-gradient(135deg, ${accent}12 0%, #fff 48%, #fff 100%)`,
                }
          }
        >
          {heroImage ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${getImageDisplayUrl(heroImage)})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/25" />
            </>
          ) : null}
          <div className={`relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${heroImage ? 'text-white' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
              {headerLogo ? (
                <img
                  src={getImageDisplayUrl(headerLogo)}
                  alt=""
                  className={`h-12 w-auto max-w-[200px] object-contain shrink-0 rounded-lg ${
                    heroImage ? 'bg-white/15 ring-1 ring-white/25' : 'border border-gray-200 bg-white p-1 shadow-sm'
                  }`}
                />
              ) : null}
              <div className="min-w-0">
              <div
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide mb-2 ${
                  heroImage ? 'bg-white/20 text-white border border-white/30' : 'bg-mint/10 text-mint border border-mint/20'
                }`}
                style={
                  !heroImage
                    ? { backgroundColor: `${accent}22`, color: accent, borderColor: `${accent}44` }
                    : undefined
                }
              >
                {badgeLabel}
              </div>
              <h2
                className={`text-2xl font-semibold tracking-tight ${
                  heroImage ? 'text-white' : 'text-gray-900'
                }`}
              >
                {heroTitle}
              </h2>
              <p
                className={`mt-1 text-sm max-w-xl ${
                  heroImage ? 'text-white/90' : 'text-gray-500'
                }`}
              >
                {heroSubtitle}
              </p>
              {cfg.custom_note?.trim() ? (
                <p
                  className={`mt-3 text-sm whitespace-pre-wrap rounded-lg px-3 py-2 ${
                    heroImage ? 'bg-black/30 text-white/95' : 'bg-gray-50 text-gray-800 border border-gray-100'
                  }`}
                >
                  {cfg.custom_note.trim()}
                </p>
              ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-medium ${
                  heroImage
                    ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-mint hover:text-mint'
                }`}
              >
                Go to store dashboard
              </Link>
              {showCustomPrimary ? (
                <Link
                  href={primaryHref!}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
                    heroImage
                      ? 'border-white/50 bg-white text-gray-900 hover:bg-white/90'
                      : 'border-mint/40 bg-mint/10 text-mint hover:bg-mint/20'
                  }`}
                >
                  {primaryLabel}
                </Link>
              ) : (
                <Link
                  href="/admin/pro/plans"
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
                    heroImage
                      ? 'border-white/50 bg-white text-gray-900 hover:bg-white/90'
                      : 'border-mint/40 bg-mint/10 text-mint hover:bg-mint/20'
                  }`}
                >
                  Plans &amp; billing
                </Link>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
                  heroImage ? 'border-white/30 bg-white/10 text-white' : 'border-mint/40 bg-mint/10 text-mint'
                }`}
              >
                Super admin workspace
              </span>
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        {showKpis && visibleKpiCount > 0 ? (
          <section className={`grid grid-cols-1 gap-4 ${kpiGridClass}`}>
            {showRev ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">{revenueKpiLabel}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
                  ${totalRevenue.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  {scope === 'current_store'
                    ? 'Orders attributed to the selected store.'
                    : 'Includes demo orders from every active store.'}
                </p>
              </div>
            ) : null}
            {showOrd ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">{ordersKpiLabel}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">{totalOrders}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {scope === 'current_store' ? 'For the selected store only.' : 'Across all stores you own.'}
                </p>
              </div>
            ) : null}
            {showCnt ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">{storesKpiLabel}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
                  {scope === 'current_store' ? effectiveStores.length : stores.length}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {scope === 'current_store'
                    ? effectiveStores[0]?.is_active
                      ? 'This store is active.'
                      : 'This store is paused.'
                    : `${stores.filter((s) => s.is_active).length} active · ${stores.filter((s) => !s.is_active).length} paused`}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Store table */}
        {cfg.show_stores_table !== false ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Stores overview</h2>
              <p className="text-xs text-gray-500">
                {scope === 'current_store'
                  ? 'Revenue and orders for the selected store.'
                  : 'Revenue and order volume by store.'}
              </p>
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
          ) : effectiveStores.length === 0 ? (
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
                {effectiveStores.map((store) => {
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
        ) : null}
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
    </ProAdminGuard>
  );
}

