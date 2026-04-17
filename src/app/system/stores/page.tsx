'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  getSystemStores,
  patchSystemStoreStatus,
  type SystemStoreListRow,
  type SystemStoresListResponse,
  type SystemStoresSort,
} from '@/lib/api';
import { formatRevenueCompact } from '@/lib/formatSystemRevenue';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type FilterActive = 'all' | 'active' | 'inactive';

const PER_PAGE_OPTIONS = [10, 25, 50] as const;

const SORT_OPTIONS: { value: SystemStoresSort; label: string }[] = [
  { value: '-created', label: 'Newest first' },
  { value: 'created', label: 'Oldest first' },
  { value: '-revenue', label: 'Revenue (high → low)' },
  { value: 'revenue', label: 'Revenue (low → high)' },
  { value: '-orders', label: 'Orders (most)' },
  { value: 'orders', label: 'Orders (fewest)' },
  { value: '-products', label: 'Products (most)' },
  { value: 'products', label: 'Products (fewest)' },
  { value: 'name', label: 'Name A → Z' },
  { value: '-name', label: 'Name Z → A' },
];

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadStoresCsv(rows: SystemStoreListRow[], filename: string) {
  const headers = [
    'id',
    'name',
    'slug',
    'domain',
    'plan',
    'active',
    'owner_email',
    'customers',
    'products',
    'orders',
    'qualifying_orders',
    'revenue_total',
    'average_order_value',
    'api_keys',
    'created_at',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.id,
        csvEscape(r.name),
        csvEscape(r.slug),
        csvEscape(r.domain ?? ''),
        r.plan,
        r.is_active ? 'yes' : 'no',
        csvEscape(r.owner?.email ?? ''),
        r.counts.customers ?? 0,
        r.counts.products,
        r.counts.orders,
        r.qualifying_orders_count ?? 0,
        r.revenue_total ?? 0,
        r.average_order_value ?? 0,
        r.counts.api_keys,
        csvEscape(r.created_at ?? ''),
      ].join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SystemStoresPage() {
  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [filter, setFilter] = useState<FilterActive>('all');
  const [sort, setSort] = useState<SystemStoresSort>('-created');
  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SystemStoresListResponse | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchParams = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch.trim() || undefined,
      is_active: filter === 'all' ? undefined : filter === 'active',
      sort,
    }),
    [page, perPage, debouncedSearch, filter, sort]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemStores({ token, ...fetchParams });
      setPayload(res);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [token, fetchParams]);

  const refreshListQuiet = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getSystemStores({ token, ...fetchParams });
      setPayload(res);
    } catch {
      /* keep existing */
    }
  }, [token, fetchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) {
      setLoading(false);
      return;
    }
    load();
  }, [status, token, load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, sort, perPage]);

  const pageRevenueTotal = useMemo(
    () => (payload?.data ?? []).reduce((s, r) => s + (r.revenue_total ?? 0), 0),
    [payload?.data]
  );

  if (status === 'unauthenticated') {
    return <p className="text-sm text-gray-600">Sign in to view stores.</p>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-16">
      {/* Hero */}
      <header className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-mint/5 to-mint/10 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mint-dark">System console</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">All stores</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              Search, sort, and export every tenant. Open a store name for the full dashboard—revenue pipeline, recent
              orders, and settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white/80 text-gray-600 ring-1 ring-gray-200 hover:bg-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {payload?.summary ? (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <SummaryCard
              label="Platform revenue"
              value={formatRevenueCompact(payload.summary.platform_revenue_total)}
              hint="All qualifying orders"
            />
            <SummaryCard
              label="Stores"
              value={`${payload.summary.active_stores_count} active`}
              hint={
                payload.summary.inactive_stores_count != null
                  ? `${payload.summary.inactive_stores_count} inactive · ${payload.summary.total_stores_count} total`
                  : `${payload.summary.total_stores_count} total`
              }
            />
            <SummaryCard
              label="Qualifying orders"
              value={payload.summary.platform_orders_count.toLocaleString()}
              hint="Platform-wide"
            />
            <SummaryCard
              label="This page revenue"
              value={formatRevenueCompact(pageRevenueTotal)}
              hint={`${payload.data.length} row${payload.data.length === 1 ? '' : 's'} on screen`}
            />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Top by revenue</p>
              {payload.summary.top_store_by_revenue ? (
                <>
                  <p className="mt-2 truncate text-base font-bold text-gray-900">
                    {payload.summary.top_store_by_revenue.name ?? payload.summary.top_store_by_revenue.slug}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-mint-dark">
                    {formatRevenueCompact(payload.summary.top_store_by_revenue.revenue_total)}
                  </p>
                  <Link
                    href={`/system/stores/${payload.summary.top_store_by_revenue.id}`}
                    className="mt-3 inline-flex text-xs font-bold text-mint-dark hover:underline"
                  >
                    Open dashboard →
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No revenue yet.</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">{payload.summary.revenue_definition}</p>
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <label htmlFor="system-store-search" className="mb-1.5 block text-[11px] font-bold uppercase text-gray-400">
            Search
          </label>
          <input
            id="system-store-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, slug, or store email…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm focus:border-mint focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint/25"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-gray-400">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SystemStoresSort)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-gray-400">Rows</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number])}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading || !token}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-mint hover:text-mint-dark disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              disabled={!payload?.data.length}
              onClick={() =>
                downloadStoresCsv(
                  payload?.data ?? [],
                  `mint-stores-page-${payload?.current_page ?? 1}-${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white hover:bg-mint-dark disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/*
          Scrollbars hidden (WebKit / Firefox / legacy Edge) but table still scrolls with wheel,
          trackpad, touch, and Shift+wheel for horizontal when needed. Keeps sticky header working.
        */}
        <div className="max-h-[min(70vh,900px)] overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-[10px] font-bold uppercase tracking-wider text-gray-500 backdrop-blur-sm">
              <tr>
                <th className="px-3 py-3 pl-4 font-medium">Store</th>
                <th className="px-3 py-3 font-medium">Slug / domain</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">State</th>
                <th className="px-3 py-3 font-medium">Owner</th>
                <th className="px-3 py-3 text-right font-medium">Customers</th>
                <th className="px-3 py-3 text-right font-medium">Products</th>
                <th className="px-3 py-3 text-right font-medium" title="All orders">
                  Orders
                </th>
                <th className="px-3 py-3 text-right font-medium" title="Excludes cancelled & refunded">
                  Revenue
                </th>
                <th className="px-3 py-3 text-right font-medium" title="On qualifying orders">
                  AOV
                </th>
                <th className="px-3 py-3 text-right font-medium">Keys</th>
                <th className="px-3 py-3 pr-4 font-medium min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                      Loading stores…
                    </span>
                  </td>
                </tr>
              )}
              {!loading &&
                (payload?.data ?? []).map((row, i) => (
                  <StoreRow
                    key={row.id}
                    row={row}
                    token={token}
                    busy={togglingId === row.id}
                    striped={i % 2 === 1}
                    onToggleStart={() => setTogglingId(row.id)}
                    onToggleEnd={() => setTogglingId(null)}
                    onUpdated={refreshListQuiet}
                  />
                ))}
              {!loading && payload && payload.data.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-20 text-center">
                    <p className="text-base font-semibold text-gray-900">No stores match</p>
                    <p className="mt-1 text-sm text-gray-500">Try another search or switch the active filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payload && payload.total > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{payload.total.toLocaleString()}</span> stores
            {payload.last_page > 1 ? (
              <>
                {' '}
                · page <span className="font-mono font-semibold">{payload.current_page}</span> of{' '}
                <span className="font-mono font-semibold">{payload.last_page}</span>
              </>
            ) : null}
            {payload.meta?.sort ? (
              <span className="ml-2 text-xs text-gray-400">· sort: {payload.meta.sort}</span>
            ) : null}
          </p>
          {payload.last_page > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={payload.current_page <= 1}
                onClick={() => setPage(1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                First
              </button>
              <button
                type="button"
                disabled={payload.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={payload.current_page >= payload.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                disabled={payload.current_page >= payload.last_page}
                onClick={() => setPage(payload.last_page)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Last
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function StoreRow({
  row,
  token,
  busy,
  striped,
  onToggleStart,
  onToggleEnd,
  onUpdated,
}: {
  row: SystemStoreListRow;
  token: string | null;
  busy: boolean;
  striped: boolean;
  onToggleStart: () => void;
  onToggleEnd: () => void;
  onUpdated: () => Promise<void>;
}) {
  async function setActive(next: boolean) {
    if (!token) return;
    if (!next) {
      const ok = window.confirm(
        `Deactivate “${row.name}”? The storefront will no longer be available to shoppers until reactivated.`
      );
      if (!ok) return;
    }
    onToggleStart();
    try {
      await patchSystemStoreStatus({ token, storeId: row.id, is_active: next });
      await onUpdated();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not update store status');
    } finally {
      onToggleEnd();
    }
  }

  const detailHref = `/system/stores/${row.id}`;
  const customers = row.counts.customers ?? 0;
  const qOrders = row.qualifying_orders_count ?? 0;
  const aov = row.average_order_value ?? 0;

  return (
    <tr className={`${striped ? 'bg-gray-50/50' : ''} hover:bg-mint/5`}>
      <td className="px-3 py-3 pl-4 align-top">
        <Link
          href={detailHref}
          className="group block max-w-[200px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          <div className="truncate font-semibold text-gray-900 group-hover:text-mint-dark">{row.name}</div>
          {row.email ? <div className="truncate text-xs text-gray-500">{row.email}</div> : null}
          {row.created_at ? (
            <div className="mt-1 text-[10px] text-gray-400">
              Since {new Date(row.created_at).toLocaleDateString()}
            </div>
          ) : null}
        </Link>
      </td>
      <td className="px-3 py-3 align-top font-mono text-xs text-gray-700">
        <Link href={detailHref} className="font-semibold text-mint-dark hover:underline">
          {row.slug}
        </Link>
        {row.domain ? <div className="mt-0.5 text-gray-500">{row.domain}</div> : null}
      </td>
      <td className="px-3 py-3 align-top capitalize text-gray-700">{row.plan}</td>
      <td className="px-3 py-3 align-top">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            row.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {row.is_active ? 'Active' : 'Off'}
        </span>
      </td>
      <td className="max-w-[160px] px-3 py-3 align-top text-gray-700">
        {row.owner ? (
          <>
            <div className="truncate text-sm font-medium text-gray-900">{row.owner.name ?? '—'}</div>
            <div className="truncate text-xs text-gray-500">{row.owner.email}</div>
            {row.owner.user_type ? (
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{row.owner.user_type}</div>
            ) : null}
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-3 py-3 align-top text-right tabular-nums text-gray-800">{customers}</td>
      <td className="px-3 py-3 align-top text-right tabular-nums text-gray-800">{row.counts.products}</td>
      <td className="px-3 py-3 align-top text-right tabular-nums text-gray-800">{row.counts.orders}</td>
      <td className="px-3 py-3 align-top text-right tabular-nums font-semibold text-gray-900">
        {formatRevenueCompact(row.revenue_total ?? 0)}
      </td>
      <td
        className="px-3 py-3 align-top text-right tabular-nums text-sm text-gray-700"
        title={`${qOrders} qualifying orders`}
      >
        {qOrders > 0 ? formatRevenueCompact(aov) : '—'}
      </td>
      <td className="px-3 py-3 align-top text-right tabular-nums text-gray-600">{row.counts.api_keys}</td>
      <td className="px-3 py-3 pr-4 align-top">
        <div className="flex flex-col gap-1.5">
          <Link
            href={detailHref}
            className="inline-flex w-fit items-center rounded-lg bg-mint/10 px-2.5 py-1.5 text-center text-[11px] font-bold text-mint-dark ring-1 ring-mint/30 hover:bg-mint/20"
          >
            Details
          </Link>
          {row.is_active ? (
            <button
              type="button"
              disabled={busy || !token}
              onClick={() => setActive(false)}
              className="w-fit rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? '…' : 'Deactivate'}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !token}
              onClick={() => setActive(true)}
              className="w-fit rounded-lg bg-mint px-2.5 py-1 text-[11px] font-bold text-white hover:bg-mint-dark disabled:opacity-50"
            >
              {busy ? '…' : 'Activate'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
