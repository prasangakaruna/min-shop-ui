'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Order } from '@/lib/api';

interface OrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

function getRangeBounds(range: TimeRange): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  if (range === 'week') from.setDate(to.getDate() - 7);
  else if (range === 'month' || range === 'custom') from.setMonth(to.getMonth() - 1);
  else if (range === 'quarter') from.setMonth(to.getMonth() - 3);
  else from.setFullYear(to.getFullYear() - 1);
  return { from, to };
}

function isInRange(iso: string | null, from: Date, to: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function downloadCsv(orders: Order[], filename: string) {
  const headers = ['Order', 'Date', 'Email', 'Total', 'Status'];
  const rows = orders.map((o) => [
    o.number,
    o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '',
    o.email ?? '',
    o.total,
    o.financial_status,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadJson(orders: Order[], filename: string) {
  const data = orders.map((o) => ({
    number: o.number,
    id: o.id,
    date: o.created_at,
    email: o.email,
    total: o.total,
    subtotal: o.subtotal,
    financial_status: o.financial_status,
    fulfillment_status: o.fulfillment_status,
    line_items: o.line_items ?? [],
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function FinancePage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiRequest<OrdersResponse>('/store/orders', { token, storeId: currentStore.id, query: { per_page: 100 } })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data ?? []);
        setOrdersTotal(res.total ?? res.data?.length ?? 0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load finance data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore]);

  const { from: rangeFrom, to: rangeTo } = useMemo(() => {
    if (timeRange === 'custom' && customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      return { from: isNaN(from.getTime()) ? getRangeBounds('month').from : from, to: isNaN(to.getTime()) ? new Date() : to };
    }
    return getRangeBounds(timeRange);
  }, [timeRange, customFrom, customTo]);

  const ordersInRange = useMemo(
    () => orders.filter((o) => isInRange(o.created_at, rangeFrom, rangeTo)),
    [orders, rangeFrom, rangeTo],
  );

  const totalRevenue = useMemo(
    () => ordersInRange.reduce((s, o) => s + parseFloat(o.total || '0'), 0),
    [ordersInRange],
  );

  const avgOrderValue = ordersInRange.length ? totalRevenue / ordersInRange.length : 0;

  const revenueByItem = useMemo(() => {
    const map = new Map<string, number>();
    ordersInRange.forEach((o) => {
      (o.line_items ?? []).forEach((li) => {
        const key = li.title || 'Untitled';
        map.set(key, (map.get(key) ?? 0) + parseFloat(li.total || '0'));
      });
    });
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [ordersInRange]);

  const summaryPeriods = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
    const quarterStart = new Date(now);
    quarterStart.setMonth(now.getMonth() - 3);

    const thisMonth = orders.filter((o) => isInRange(o.created_at, thisMonthStart, now));
    const lastMonth = orders.filter((o) => isInRange(o.created_at, lastMonthStart, lastMonthEnd));
    const thisQuarter = orders.filter((o) => isInRange(o.created_at, quarterStart, now));

    const rev = (list: Order[]) => list.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
    return [
      { label: 'This month', revenue: rev(thisMonth), orders: thisMonth.length },
      { label: 'Last month', revenue: rev(lastMonth), orders: lastMonth.length },
      { label: 'Last 3 months', revenue: rev(thisQuarter), orders: thisQuarter.length },
    ];
  }, [orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())).slice(0, 15),
    [orders],
  );

  const baseFilename = `finance-${currentStore?.name?.replace(/\s+/g, '-') || 'store'}-${timeRange}-${new Date().toISOString().slice(0, 10)}`;
  const handleExportCsv = () => downloadCsv(ordersInRange, `${baseFilename}.csv`);
  const handleExportJson = () => downloadJson(ordersInRange, `${baseFilename}.json`);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-semibold text-amber-900">Select a store</p>
          <p className="mt-2 text-sm text-amber-800">Use the store switcher to view finance for a store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Revenue and orders. Based on last {orders.length} orders (up to 100). Expenses are not tracked in the API.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 12 months</option>
              <option value="custom">Custom range</option>
            </select>
            {timeRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || ordersInRange.length === 0}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={loading || ordersInRange.length === 0}
            className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            Export JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Financial stats */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Revenue (range)</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                <p className="mt-0.5 text-xs text-gray-500">{ordersInRange.length} orders</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Average order</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {ordersInRange.length ? `$${avgOrderValue.toFixed(2)}` : '—'}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">In selected range</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total orders</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{ordersTotal ?? '—'}</p>
                <p className="mt-0.5 text-xs text-gray-500">All time</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">All-time revenue</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  ${orders.reduce((s, o) => s + parseFloat(o.total || '0'), 0).toFixed(2)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">From loaded orders</p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by item */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Revenue by item</h2>
            <p className="text-xs text-gray-500">Line items in selected range</p>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : revenueByItem.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No line items in range.</p>
            ) : (
              <div className="space-y-4">
                {revenueByItem.map((item) => {
                  const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium text-gray-800" title={item.name}>{item.name}</span>
                        <span className="ml-2 shrink-0 font-semibold text-gray-900">${item.revenue.toFixed(2)}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-mint"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{pct.toFixed(1)}% of revenue</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent transactions (orders) */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent transactions</h2>
              <p className="text-xs text-gray-500">Orders as revenue</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-mint hover:underline">
              View all →
            </Link>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No orders yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100 p-2">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Revenue
                        </span>
                        <p className="mt-1 font-medium text-gray-900">#{order.number}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-emerald-600">+${order.total}</p>
                        <p className="text-xs text-gray-500">{order.financial_status}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Financial summary table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Revenue by period</h2>
          <p className="text-xs text-gray-500">No expenses in system; revenue only.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                summaryPeriods.map((row) => (
                  <tr key={row.label} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.label}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-mint">${row.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.orders}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
