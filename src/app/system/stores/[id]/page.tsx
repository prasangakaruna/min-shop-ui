'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getImageDisplayUrl, getSystemStoreDetail, patchSystemStoreStatus, type SystemStoreDetail } from '@/lib/api';
import { formatRevenueCompact } from '@/lib/formatSystemRevenue';
import { StoreDetailCharts } from './StoreDetailCharts';

function storefrontPublicUrl(domain: string | null, slug: string): string {
  const host = (domain ?? '').trim();
  if (!host) return '';
  const isLocal =
    host.includes('localhost') || host.endsWith('.local') || /^127\./.test(host);
  return `${isLocal ? 'http' : 'https'}://${host}/`;
}

const CUSTOMERS_PER_PAGE = 25;

function financialBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-100';
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-100';
    case 'refunded':
      return 'bg-violet-50 text-violet-800 ring-violet-100';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 ring-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 ring-gray-100';
  }
}

export default function SystemStoreDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const storeId = typeof idParam === 'string' ? Number.parseInt(idParam, 10) : NaN;

  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SystemStoreDetail | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersBusy, setCustomersBusy] = useState(false);
  const loadedStoreIdRef = useRef<number | null>(null);

  const copyText = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.alert('Could not copy to clipboard');
    }
  }, []);

  useLayoutEffect(() => {
    setCustomersPage(1);
  }, [storeId]);

  useEffect(() => {
    if (status === 'loading' || !token || !Number.isFinite(storeId)) {
      if (status !== 'loading' && !Number.isFinite(storeId)) setLoading(false);
      return;
    }
    let cancelled = false;
    const sameStoreAlreadyLoaded = loadedStoreIdRef.current === storeId;
    if (sameStoreAlreadyLoaded) setCustomersBusy(true);
    else setLoading(true);
    setError(null);
    getSystemStoreDetail({
      token,
      storeId,
      customers_page: customersPage,
      customers_per_page: CUSTOMERS_PER_PAGE,
    })
      .then((res) => {
        if (!cancelled) {
          setDetail(res.data);
          loadedStoreIdRef.current = storeId;
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          loadedStoreIdRef.current = null;
          setError(e instanceof Error ? e.message : 'Failed to load store');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setCustomersBusy(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, storeId, status, customersPage]);

  const storefrontUrl = useMemo(
    () => (detail ? storefrontPublicUrl(detail.domain, detail.slug) : ''),
    [detail]
  );

  const marketplaceUrl = detail ? `/?store=${encodeURIComponent(detail.slug)}` : '';

  const breakdownMax = useMemo(() => {
    if (!detail?.order_financial_breakdown) return 1;
    const vals = Object.values(detail.order_financial_breakdown);
    return Math.max(1, ...vals);
  }, [detail]);

  if (!Number.isFinite(storeId)) {
    return <p className="text-sm text-gray-600">Invalid store.</p>;
  }

  if (status === 'unauthenticated') {
    return <p className="text-sm text-gray-600">Sign in to view this store.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div>
        <Link
          href="/system/stores"
          className="inline-flex items-center gap-1 text-sm font-semibold text-mint-dark hover:underline"
        >
          <span aria-hidden>←</span> All stores
        </Link>
      </div>

      {loading && (
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-2xl bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {detail && !loading && (
        <>
          {/* Hero */}
          <header className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-mint/5 to-mint/15 shadow-sm">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
              <div className="flex min-w-0 flex-1 gap-4">
                {detail.highlights.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic API URL
                  <img
                    src={getImageDisplayUrl(detail.highlights.company_logo_url)}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-mint/20 text-xl font-bold text-mint-dark sm:h-20 sm:w-20">
                    {detail.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{detail.name}</h1>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        detail.is_active ? 'bg-emerald-500/15 text-emerald-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {detail.is_active ? 'Live' : 'Inactive'}
                    </span>
                    <span className="rounded-full bg-gray-900/5 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-700">
                      {detail.plan}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm text-gray-500">{detail.subdomain}</p>
                  {detail.highlights.company_description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                      {detail.highlights.company_description}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {detail && token ? (
                  <>
                    {detail.is_active ? (
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={async () => {
                          const ok = window.confirm(
                            `Deactivate “${detail.name}”? Shoppers will not be able to use this storefront until it is reactivated.`
                          );
                          if (!ok) return;
                          setStatusBusy(true);
                          try {
                            await patchSystemStoreStatus({ token, storeId, is_active: false });
                            setDetail((d) => (d ? { ...d, is_active: false } : null));
                          } catch (e) {
                            window.alert(e instanceof Error ? e.message : 'Update failed');
                          } finally {
                            setStatusBusy(false);
                          }
                        }}
                        className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                      >
                        {statusBusy ? 'Updating…' : 'Deactivate store'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={async () => {
                          setStatusBusy(true);
                          try {
                            await patchSystemStoreStatus({ token, storeId, is_active: true });
                            setDetail((d) => (d ? { ...d, is_active: true } : null));
                          } catch (e) {
                            window.alert(e instanceof Error ? e.message : 'Update failed');
                          } finally {
                            setStatusBusy(false);
                          }
                        }}
                        className="w-full rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-50 sm:w-auto"
                      >
                        {statusBusy ? 'Updating…' : 'Activate store'}
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 border-t border-gray-200/80 bg-white/60 px-6 py-4 sm:px-8">
              {storefrontUrl ? (
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
                >
                  <span aria-hidden>↗</span> Customer storefront
                </a>
              ) : null}
              <Link
                href={marketplaceUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
              >
                Marketplace listing
              </Link>
              <button
                type="button"
                onClick={() => copyText('id', String(detail.id))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
              >
                {copied === 'id' ? 'Copied' : `Store ID ${detail.id}`}
              </button>
              {detail.domain ? (
                <button
                  type="button"
                  onClick={() => copyText('domain', detail.domain ?? '')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
                >
                  {copied === 'domain' ? 'Copied' : 'Copy domain'}
                </button>
              ) : null}
            </div>
          </header>

          {/* KPI strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Lifetime revenue"
              value={formatRevenueCompact(detail.revenue_total ?? 0, detail.highlights.currency_display)}
              sub="Excl. cancelled & refunded"
            />
            <KpiCard
              label="Avg. order value"
              value={formatRevenueCompact(detail.average_order_value ?? 0, detail.highlights.currency_display)}
              sub="On qualifying orders"
            />
            <KpiCard
              label="Qualifying orders"
              value={String(detail.qualifying_orders_count ?? 0)}
              sub="Counted toward revenue"
            />
            <KpiCard label="Customers" value={String(detail.counts.customers ?? 0)} sub="Registered shoppers" />
            <KpiCard label="Products" value={String(detail.counts.products)} sub="Catalog SKUs" />
          </section>

          <StoreDetailCharts detail={detail} />

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Order pipeline */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-bold text-gray-900">Order pipeline</h2>
              <p className="mt-1 text-xs text-gray-500">All orders by financial status</p>
              <div className="mt-5 space-y-3">
                {Object.keys(detail.order_financial_breakdown ?? {}).length === 0 ? (
                  <p className="text-sm text-gray-500">No orders yet.</p>
                ) : (
                  Object.entries(detail.order_financial_breakdown ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([st, count]) => (
                      <div key={st}>
                        <div className="mb-1 flex justify-between text-xs font-medium">
                          <span className="capitalize text-gray-700">{st}</span>
                          <span className="tabular-nums text-gray-900">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-mint/70"
                            style={{ width: `${(count / breakdownMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>

            {/* Recent orders */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Recent orders</h2>
                  <p className="mt-1 text-xs text-gray-500">Latest 12 by ID</p>
                </div>
                <span className="text-xs font-semibold text-gray-400">{detail.counts.orders} total</span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="pb-2 pr-2">Order</th>
                      <th className="pb-2 pr-2">Customer</th>
                      <th className="pb-2 pr-2">Total</th>
                      <th className="pb-2 pr-2">Payment</th>
                      <th className="pb-2">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(detail.recent_orders ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                          No orders yet.
                        </td>
                      </tr>
                    ) : (
                      (detail.recent_orders ?? []).map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50/80">
                          <td className="py-2.5 pr-2 font-mono text-xs font-medium text-gray-900">
                            {o.number ?? `#${o.id}`}
                          </td>
                          <td className="max-w-[140px] truncate py-2.5 pr-2 text-xs text-gray-600" title={o.email ?? ''}>
                            {o.email ?? '—'}
                          </td>
                          <td className="py-2.5 pr-2 text-xs font-semibold tabular-nums text-gray-900">
                            {formatRevenueCompact(o.total, detail.highlights.currency_display)}
                          </td>
                          <td className="py-2.5 pr-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${financialBadgeClass(o.financial_status)}`}
                            >
                              {o.financial_status}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs capitalize text-gray-600">
                            {o.fulfillment_status ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Store customers */}
          <section
            className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${customersBusy ? 'opacity-60' : ''} transition-opacity`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Customers</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Registered shoppers for this store (newest first). Super-admin view only.
                </p>
              </div>
              {detail.customers_meta ? (
                <span className="text-xs font-semibold tabular-nums text-gray-500">
                  {detail.customers_meta.total} total
                </span>
              ) : null}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-2 pr-2">ID</th>
                    <th className="pb-2 pr-2">Name</th>
                    <th className="pb-2 pr-2">Email</th>
                    <th className="pb-2 pr-2">Phone</th>
                    <th className="pb-2 pr-2 text-right">Orders</th>
                    <th className="pb-2 pr-2">Marketing</th>
                    <th className="pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.customers === undefined ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        Customer list is not available. Deploy the latest API to load this section.
                      </td>
                    </tr>
                  ) : (detail.customers ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        No customers for this store yet.
                      </td>
                    </tr>
                  ) : (
                    (detail.customers ?? []).map((c) => {
                      const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/80">
                          <td className="py-2.5 pr-2 font-mono text-xs text-gray-600">{c.id}</td>
                          <td className="max-w-[140px] truncate py-2.5 pr-2 text-xs text-gray-900" title={name || ''}>
                            {name || '—'}
                          </td>
                          <td className="max-w-[200px] truncate py-2.5 pr-2 text-xs text-gray-700" title={c.email ?? ''}>
                            {c.email ?? '—'}
                          </td>
                          <td className="max-w-[120px] truncate py-2.5 pr-2 text-xs text-gray-600" title={c.phone ?? ''}>
                            {c.phone ?? '—'}
                          </td>
                          <td className="py-2.5 pr-2 text-right text-xs font-semibold tabular-nums text-gray-900">
                            {c.orders_count}
                          </td>
                          <td className="py-2.5 pr-2 text-xs text-gray-600">
                            {c.accepts_marketing ? 'Yes' : 'No'}
                          </td>
                          <td className="py-2.5 text-xs tabular-nums text-gray-600">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {detail.customers_meta && detail.customers_meta.last_page > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">
                  Page {detail.customers_meta.current_page} of {detail.customers_meta.last_page}
                  <span className="text-gray-400"> · </span>
                  {detail.customers_meta.per_page} per page
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={customersBusy || detail.customers_meta.current_page <= 1}
                    onClick={() => setCustomersPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={customersBusy || detail.customers_meta.current_page >= detail.customers_meta.last_page}
                    onClick={() => setCustomersPage((p) => p + 1)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {/* Catalog & content volume */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Catalog &amp; content</h2>
            <p className="mt-1 text-xs text-gray-500">Entity counts for this tenant</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ['Products', detail.counts.products],
                  ['Orders (all)', detail.counts.orders],
                  ['Customers', detail.counts.customers ?? 0],
                  ['Pages', detail.counts.pages],
                  ['Categories', detail.counts.categories],
                  ['Collections', detail.counts.collections],
                  ['API keys', detail.counts.api_keys],
                ] as const
              ).map(([label, n]) => (
                <div
                  key={label}
                  id={label === 'API keys' ? 'tenant-api-keys' : undefined}
                  className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{n}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Store record</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Store ID" value={String(detail.id)} mono />
                <Row label="Owner ID" value={String(detail.owner_id)} mono />
                <Row label="Contact email" value={detail.email ?? '—'} />
                <Row
                  label="Created"
                  value={detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}
                />
                <Row
                  label="Updated"
                  value={detail.updated_at ? new Date(detail.updated_at).toLocaleString() : '—'}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Owner</h2>
              {detail.owner ? (
                <div className="mt-4 flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/15 text-lg font-bold text-mint-dark">
                    {(detail.owner.name ?? detail.owner.email ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <dl className="min-w-0 flex-1 space-y-2 text-sm">
                    <Row label="Name" value={detail.owner.name ?? '—'} />
                    <Row label="Email" value={detail.owner.email ?? '—'} />
                    <Row label="Type" value={detail.owner.user_type ?? '—'} />
                    <Row label="User ID" value={String(detail.owner.id)} mono />
                  </dl>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No owner linked.</p>
              )}
            </section>
          </div>

          {/* Commerce settings */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Commerce settings</h2>
            <p className="mt-1 text-xs text-gray-500">From store settings (high-signal fields)</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SettingTile label="Display currency" value={detail.highlights.currency_display ?? '—'} />
              <SettingTile label="Timezone" value={detail.highlights.timezone ?? '—'} />
              <SettingTile label="Backup region" value={detail.highlights.backup_region ?? '—'} />
              <SettingTile label="Order ID prefix" value={detail.highlights.order_id_prefix ?? '—'} />
              <SettingTile
                label="Onboarding"
                value={detail.highlights.onboarding_completed ? 'Complete' : 'Incomplete'}
              />
            </div>
          </section>

          {/* Raw JSON */}
          <section className="rounded-2xl border border-gray-200 bg-gray-900 shadow-sm">
            <button
              type="button"
              onClick={() => setJsonOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:bg-gray-800/50"
            >
              <span>Raw settings JSON</span>
              <span className="text-gray-400">{jsonOpen ? '▼' : '▶'}</span>
            </button>
            {jsonOpen ? (
              <pre className="max-h-[min(70vh,520px)] overflow-auto border-t border-gray-700 p-5 text-xs leading-relaxed text-gray-100">
                {JSON.stringify(detail.settings ?? {}, null, 2)}
              </pre>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl">{value}</p>
      <p className="mt-1 text-[11px] text-gray-500">{sub}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function SettingTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value}</p>
    </div>
  );
}
