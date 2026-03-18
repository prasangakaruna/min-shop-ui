'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Order, type Product, type ProductsResponse, type StoreSummary, type CustomersResponse } from '@/lib/api';

interface OrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const DEFAULT_PLAN_PRICES: Record<string, number> = { basic: 9, standard: 29, premium: 99 };

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
  href,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: 'blue' | 'green' | 'mint' | 'purple' | 'gray';
  href?: string;
}) {
  const accentClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-emerald-500/10 text-emerald-600',
    mint: 'bg-mint/10 text-mint',
    purple: 'bg-violet-500/10 text-violet-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
        {icon}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-mint/30"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

const IconOrders = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);
const IconRevenue = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconProducts = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const IconCustomers = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ONBOARDING_KEY = 'mint_admin_onboarding_completed_v1';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [storeDetails, setStoreDetails] = useState<StoreSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [productsTotal, setProductsTotal] = useState<number | null>(null);
  const [customersTotal, setCustomersTotal] = useState<number | null>(null);
  const [revenueFromRecent, setRevenueFromRecent] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const match = document.cookie.match(/(?:^|;\s*)USER_TYPE=([^;]+)/);
    const userType = match ? decodeURIComponent(match[1]) : null;
    if (userType === 'pro_admin') {
      router.replace('/admin/pro');
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem(ONBOARDING_KEY) === 'true';
    if (!done) {
      router.replace('/admin/onboarding');
      return;
    }
    setOnboardingChecked(true);
  }, [router]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<StoreSummary>('/store', { token, storeId: currentStore.id }),
      apiRequest<OrdersResponse>('/store/orders', { token, storeId: currentStore.id, query: { per_page: 10 } }),
      apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query: { per_page: 1 } }),
      apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query: { per_page: 100, status: 'active' } }),
      apiRequest<CustomersResponse>('/store/customers', { token, storeId: currentStore.id, query: { per_page: 1 } }),
    ])
      .then(([storeRes, ordersRes, productsRes, productsListRes, customersRes]) => {
        if (cancelled) return;
        setStoreDetails(storeRes);
        const orderList = (ordersRes.data ?? []) as Order[];
        setOrders(orderList);
        setOrdersTotal(ordersRes.total ?? 0);
        setProductsTotal(productsRes.total ?? 0);
        setCustomersTotal(customersRes.total ?? 0);
        const sum = orderList.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
        setRevenueFromRecent(sum);
        const products = (productsListRes.data ?? []) as Product[];
        const low = products.filter((p) => {
          const total = (p.variants ?? []).reduce((s, v) => s + (v.inventory_quantity ?? 0), 0);
          return total > 0 && total < 10;
        }).length;
        setLowStockCount(low);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore]);

  if (!onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/60">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Preparing your admin…</p>
        </div>
      </div>
    );
  }

  const statusColor = (s: string) =>
    s === 'paid' ? 'bg-emerald-100 text-emerald-800' : s === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700';

  const planPrice =
    storeDetails?.settings?.plan_price ??
    (storeDetails?.plan ? DEFAULT_PLAN_PRICES[storeDetails.plan] : DEFAULT_PLAN_PRICES.basic);

  if (!currentStore) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-50/60 p-6">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🏪
          </div>
          <h2 className="mt-4 text-lg font-semibold text-amber-900">Select a store</h2>
          <p className="mt-2 text-sm text-amber-800">
            Use the store switcher in the header to choose a store or create your first one.
          </p>
          <Link
            href="/admin/stores/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Create store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 relative">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentStore.name}
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
              {storeDetails?.plan ?? currentStore.plan ?? 'basic'}
            </span>
            {storeDetails?.is_active !== false && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" title="Active" />
            )}
            {storeDetails?.is_active === false && (
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                Paused
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-gray-50/70">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">Loading your store data…</p>
          </div>
        </div>
      )}

      <main className="p-6">
        {/* Getting started */}
        {!loading && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Getting started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add store name */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Store name</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {storeDetails?.name ?? currentStore.name ?? 'Name your store'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Set a clear name so customers recognize your brand.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span>Edit name</span>
                    <span aria-hidden="true">✏️</span>
                  </Link>
                </div>
              </div>

              {/* Add your first product */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Products</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {productsTotal && productsTotal > 0
                      ? 'Keep adding products'
                      : 'Add your first product'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {productsTotal && productsTotal > 0
                      ? `You have ${productsTotal} product${productsTotal === 1 ? '' : 's'} in this store.`
                      : 'Start by adding a product with price, images, and inventory.'}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/admin/products/add"
                    className="inline-flex items-center justify-center rounded-lg bg-mint px-3 py-1.5 text-xs font-medium text-white hover:bg-mint-dark"
                  >
                    Add product
                  </Link>
                  <Link
                    href="/admin/products"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View products
                  </Link>
                </div>
              </div>

              {/* Customize storefront / theme */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Online store</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Customize your storefront</h3>
                  <p className="text-xs text-gray-500">
                    Choose a theme, then adjust colors, fonts, and layout to match your brand.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Customize theme
                  </Link>
                </div>
              </div>

              {/* Payment provider */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Payments</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Set up a payment provider</h3>
                  <p className="text-xs text-gray-500">
                    Connect a payment provider so you can start accepting orders.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Set up payments
                  </Link>
                </div>
              </div>

              {/* Shipping rates */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Shipping</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Review your shipping rates</h3>
                  <p className="text-xs text-gray-500">
                    Configure zones and rates so customers see accurate shipping costs at checkout.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Review shipping
                  </Link>
                </div>
              </div>

              {/* Domain */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Domain</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Customize your domain</h3>
                  <p className="text-xs text-gray-500">
                    Use a custom domain so customers can easily find your store.
                  </p>
                  <p className="mt-2 text-xs font-mono text-gray-500">
                    {currentStore.domain || `${currentStore.slug}.mint.local`}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Customize domain
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-600">!</span>
            {error}
          </div>
        )}

        {!loading && lowStockCount !== null && lowStockCount > 0 && (
          <Link
            href="/admin/products"
            className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100"
          >
            <span className="font-medium">
              {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} low on stock
            </span>
            <span className="text-amber-600 hover:underline">View products →</span>
          </Link>
        )}

        {/* Stats */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">At a glance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <StatCard
                  title="Total orders"
                  value={ordersTotal !== null ? String(ordersTotal) : '—'}
                  sub="All time"
                  accent="blue"
                  icon={<IconOrders />}
                  href="/admin/orders"
                />
                <StatCard
                  title="Revenue (recent)"
                  value={`$${revenueFromRecent.toFixed(2)}`}
                  sub="Last 10 orders"
                  accent="green"
                  icon={<IconRevenue />}
                />
                <StatCard
                  title="Products"
                  value={productsTotal !== null ? String(productsTotal) : '—'}
                  sub="In catalog"
                  accent="mint"
                  icon={<IconProducts />}
                  href="/admin/products"
                />
                <StatCard
                  title="Customers"
                  value={customersTotal !== null ? String(customersTotal) : '—'}
                  sub="Total"
                  accent="purple"
                  icon={<IconCustomers />}
                  href="/admin/customers"
                />
              </>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent orders */}
          <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <IconOrders />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Recent orders</h2>
                  <p className="text-xs text-gray-500">Latest activity</p>
                </div>
              </div>
              <Link href="/admin/orders" className="text-sm font-medium text-mint hover:underline">
                View all →
              </Link>
            </div>
            <div className="min-h-[220px]">
              {loading ? (
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <IconOrders />
                  </div>
                  <p className="mt-4 font-medium text-gray-600">No orders yet</p>
                  <p className="mt-1 text-sm text-gray-500">Orders will appear here when customers place them.</p>
                  <div className="mt-4 flex gap-3">
                    <Link href="/admin/orders/new" className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark">
                      Create order
                    </Link>
                    <Link href="/admin/orders" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      View orders
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">#{order.number}</p>
                          <p className="truncate text-xs text-gray-500">{order.email ?? 'No email'}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{formatRelativeDate(order.created_at)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">${order.total}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(order.financial_status)}`}>
                            {order.financial_status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Sidebar: Quick actions + Store */}
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
                <p className="text-xs text-gray-500">Common tasks</p>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  href="/admin/products/add"
                  className="flex items-center gap-3 rounded-xl bg-mint px-4 py-3 text-sm font-medium text-white transition hover:bg-mint-dark"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg font-bold">+</span>
                  Add product
                </Link>
                <Link
                  href="/admin/orders/new"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Create order
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  View orders
                </Link>
                <Link
                  href="/admin/customers"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                    <IconCustomers />
                  </span>
                  Customers
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Settings
                </Link>
              </div>
            </section>

            {/* Store card */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">Store</h2>
                <p className="text-xs text-gray-500">Plan & link</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-medium text-gray-900">{currentStore.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-gray-500">{currentStore.slug}</p>
                </div>
                {!loading && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                      {storeDetails?.plan ?? currentStore.plan}
                    </span>
                    <span className="text-xs text-gray-500">
                      ${planPrice}/mo
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentStore.domain && (
                    <a
                      href={`http://${currentStore.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-mint hover:underline"
                    >
                      Open storefront →
                    </a>
                  )}
                  <Link href="/admin/settings" className="text-sm font-medium text-gray-600 hover:text-mint">
                    Settings →
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
