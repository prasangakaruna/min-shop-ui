'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Order, type CustomersResponse } from '@/lib/api';

interface OrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

function getStartDate(range: TimeRange): Date {
  const now = new Date();
  const d = new Date(now);
  if (range === 'week') {
    d.setDate(now.getDate() - 7);
  } else if (range === 'month') {
    d.setMonth(now.getMonth() - 1);
  } else if (range === 'quarter') {
    d.setMonth(now.getMonth() - 3);
  } else {
    d.setFullYear(now.getFullYear() - 1);
  }
  return d;
}

function bucketByWeek(orders: Order[], from: Date, to: Date) {
  const buckets: { label: string; revenue: number; orders: number }[] = [];
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const start = new Date(from);
  for (let i = 0; i < 6; i++) {
    const bucketStart = new Date(start.getTime() + i * msPerWeek);
    const bucketEnd = new Date(bucketStart.getTime() + msPerWeek);
    const label = bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const filtered = orders.filter((o) => {
      if (!o.created_at) return false;
      const t = new Date(o.created_at).getTime();
      return t >= bucketStart.getTime() && t < bucketEnd.getTime();
    });
    const revenue = filtered.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
    buckets.push({ label, revenue, orders: filtered.length });
  }
  return buckets;
}

export default function StatisticsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [customersTotal, setCustomersTotal] = useState<number | null>(null);
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
    Promise.all([
      apiRequest<OrdersResponse>('/store/orders', { token, storeId: currentStore.id, query: { per_page: 100 } }),
      apiRequest<CustomersResponse>('/store/customers', { token, storeId: currentStore.id, query: { per_page: 1 } }),
    ])
      .then(([ordersRes, customersRes]) => {
        if (cancelled) return;
        setOrders(ordersRes.data ?? []);
        setOrdersTotal(ordersRes.total ?? ordersRes.data?.length ?? 0);
        setCustomersTotal(customersRes.total ?? customersRes.data?.length ?? 0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore]);

  const fromDate = useMemo(() => {
    if (timeRange === 'custom' && customFrom) {
      const d = new Date(customFrom);
      return isNaN(d.getTime()) ? getStartDate('month') : d;
    }
    return getStartDate(timeRange);
  }, [timeRange, customFrom]);
  const toDate = useMemo(() => {
    if (timeRange === 'custom' && customTo) {
      const d = new Date(customTo);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  }, [timeRange, customTo]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!o.created_at) return false;
        const t = new Date(o.created_at).getTime();
        return t >= fromDate.getTime() && t <= toDate.getTime();
      }),
    [orders, fromDate, toDate],
  );

  const totalRevenue = filteredOrders.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
  const avgOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;

  const ordersPerCustomer =
    customersTotal && customersTotal > 0 ? (ordersTotal ?? 0) / customersTotal : 0;

  const lineItemsAgg = useMemo(() => {
    const map = new Map<string, { sales: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      (o.line_items ?? []).forEach((li) => {
        const key = li.title || 'Untitled';
        const current = map.get(key) ?? { sales: 0, revenue: 0 };
        current.sales += li.quantity ?? 1;
        current.revenue += parseFloat(li.total || '0');
        map.set(key, current);
      });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  const buckets = useMemo(
    () => bucketByWeek(filteredOrders, fromDate, toDate),
    [filteredOrders, fromDate, toDate],
  );

  const statusColor = (trend: 'up' | 'down' | 'neutral') =>
    trend === 'up'
      ? 'text-emerald-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-base font-semibold text-amber-900">Select a store</p>
          <p className="mt-2 text-sm text-amber-800">
            Use the store switcher in the header to view analytics for a store.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/60 min-h-full">
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics &amp; analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Based on your last {orders.length} orders (up to 100).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="border border-gray-200 bg-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
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
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[ 
            {
              label: 'Revenue',
              value: `$${totalRevenue.toFixed(2)}`,
              sub: `In selected range (${filteredOrders.length} orders)`,
              trend: 'up' as const,
            },
            {
              label: 'Average order value',
              value: filteredOrders.length ? `$${avgOrderValue.toFixed(2)}` : '—',
              sub: filteredOrders.length ? 'Revenue ÷ orders in range' : 'No orders in range',
              trend: 'neutral' as const,
            },
            {
              label: 'Total orders',
              value: ordersTotal !== null ? String(ordersTotal) : '—',
              sub: 'All time in this store',
              trend: 'neutral' as const,
            },
            {
              label: 'Orders per customer',
              value: customersTotal ? ordersPerCustomer.toFixed(2) : '—',
              sub: customersTotal ? `${customersTotal} customers` : 'No customers yet',
              trend: 'neutral' as const,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`mt-1 text-xs ${statusColor(stat.trend)}`}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue & orders trend */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Revenue trend</h2>
          <p className="mt-1 text-xs text-gray-500">
            Weekly buckets in the selected range.
          </p>
          <div className="mt-6 h-64 flex items-end justify-between space-x-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-48 rounded-t-lg bg-gray-100 animate-pulse" />
                  <div className="mt-2 h-3 w-10 rounded bg-gray-100 animate-pulse" />
                </div>
              ))
            ) : buckets.every((b) => b.revenue === 0) ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-gray-500">
                No revenue in the selected range yet.
              </div>
            ) : (
              buckets.map((bucket) => {
                const maxRevenue = Math.max(...buckets.map((b) => b.revenue || 0));
                const height = maxRevenue ? (bucket.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '200px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-mint rounded-t-lg transition-all hover:bg-mint-dark"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="mt-2 text-xs text-gray-600">{bucket.label}</span>
                    <span className="text-xs font-semibold text-gray-800">
                      ${bucket.revenue.toFixed(0)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Orders trend</h2>
          <p className="mt-1 text-xs text-gray-500">Same buckets as revenue, by count.</p>
          <div className="mt-6 h-64 flex items-end justify-between space-x-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-32 rounded-t-lg bg-gray-100 animate-pulse" />
                  <div className="mt-2 h-3 w-10 rounded bg-gray-100 animate-pulse" />
                </div>
              ))
            ) : buckets.every((b) => b.orders === 0) ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-gray-500">
                No orders in the selected range yet.
              </div>
            ) : (
              buckets.map((bucket) => {
                const maxOrders = Math.max(...buckets.map((b) => b.orders || 0));
                const height = maxOrders ? (bucket.orders / maxOrders) * 100 : 0;
                return (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="mt-2 text-xs text-gray-600">{bucket.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{bucket.orders}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Top selling line items */} 
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Top items by revenue</h2>
        <p className="mt-1 text-xs text-gray-500">
          Based on line items from orders in the selected range.
        </p>
        {loading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : lineItemsAgg.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            No line item data yet. Create some orders to see top items.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {lineItemsAgg.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.sales} units · ${item.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
