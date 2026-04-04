'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import { getMyOrders, getMyOrdersSummary, type MyOrderListItem, type MyOrdersSummary } from '@/lib/api';
import {
  customerOrderStatusPresentation,
  formatOrderDate,
  formatMoneyAmount,
} from '@/lib/customerOrderUi';
import { storeSlugFromHostname, resolveStorefrontStoreSlug } from '@/lib/storeSlug';

const USER_TYPE_COOKIE = 'USER_TYPE';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function welcomeFirstName(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (!t) return 'there';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts.every((p) => p.toLowerCase() === parts[0].toLowerCase())) {
    return parts[0];
  }
  return parts[0] ?? t;
}

function slugToStoreLabel(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

type IconName = 'orders' | 'truck' | 'heart' | 'pin' | 'card' | 'gem' | 'user' | 'gear' | 'shop';

function DashIcon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  const common = { className: `${className} text-mint`, fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24' };
  switch (name) {
    case 'orders':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m8 0a2 2 0 104 0" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'gem':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9v2m4-2v2m-4 4h.01M15 16h.01"
          />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    default:
      return null;
  }
}

const shortcuts: { href: string; label: string; description: string; icon: IconName }[] = [
  { href: '/profile/orders', label: 'My orders', icon: 'orders', description: 'Full history and filters' },
  { href: '/profile/track-order', label: 'Track shipment', icon: 'truck', description: 'Order number lookup' },
  { href: '/profile/wishlist', label: 'Wishlist', icon: 'heart', description: 'Saved products' },
  { href: '/profile/addresses', label: 'Addresses', icon: 'pin', description: 'Shipping & billing' },
  { href: '/profile/payment-methods', label: 'Payment methods', icon: 'card', description: 'How you pay' },
  { href: '/dashboard/billing/plan', label: 'Billing & plan', icon: 'gem', description: 'Subscriptions' },
  { href: '/profile', label: 'Profile', icon: 'user', description: 'Name & email' },
  { href: '/profile/settings', label: 'Settings', icon: 'gear', description: 'Privacy & security' },
  { href: '/products', label: 'Shop catalog', icon: 'shop', description: 'Browse all stores' },
];

const accountLinks = [
  { href: '/profile', label: 'Profile & email' },
  { href: '/profile/addresses', label: 'Addresses' },
  { href: '/profile/wishlist', label: 'Wishlist' },
  { href: '/dashboard/billing/plan', label: 'Billing & plan' },
  { href: '/profile/settings', label: 'Settings' },
];

function StatSkeleton() {
  return <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />;
}

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [onTenant, setOnTenant] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  const [summary, setSummary] = useState<MyOrdersSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<MyOrderListItem[]>([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);

  const token = session?.access_token as string | undefined;

  useEffect(() => {
    setOnTenant(Boolean(storeSlugFromHostname()));
    setTenantSlug(resolveStorefrontStoreSlug());
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
      return;
    }
    const onTenantStore = Boolean(storeSlugFromHostname());
    const userType = getCookie(USER_TYPE_COOKIE);
    if (!onTenantStore && userType === 'store_admin') {
      router.replace('/admin');
      return;
    }
    if (!onTenantStore && userType === 'pro_admin') {
      router.replace('/admin/pro');
      return;
    }
    setChecked(true);
  }, [session, status, router]);

  useEffect(() => {
    if (!checked || !token) return;
    let cancelled = false;
    setDashLoading(true);
    setDashError(null);
    Promise.all([getMyOrdersSummary(token), getMyOrders({ token, page: 1, perPage: 5 })])
      .then(([sum, list]) => {
        if (cancelled) return;
        setSummary(sum);
        setRecentOrders(list.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setSummary(null);
          setRecentOrders([]);
          setDashError(e instanceof Error ? e.message : 'Could not load dashboard data.');
        }
      })
      .finally(() => {
        if (!cancelled) setDashLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checked, token]);

  if (status === 'loading' || !checked) {
    return <MintShopLoader label="Opening your dashboard…" />;
  }

  if (!session?.user) {
    return null;
  }

  const rawName = session.user.name ?? session.user.email ?? '';
  const first = welcomeFirstName(rawName);
  const storeLabel = tenantSlug ? slugToStoreLabel(tenantSlug) : onTenant ? 'This store' : null;
  const shopHref = onTenant ? '/' : '/products';
  const shopLabel = onTenant ? 'Continue shopping' : 'Browse marketplace';
  const userEmail = session.user.email ?? '';

  const statItems: { key: keyof MyOrdersSummary; label: string; hint: string; href: string }[] = [
    { key: 'total', label: 'All orders', hint: 'Lifetime count', href: '/profile/orders' },
    { key: 'processing', label: 'Processing', hint: 'Being prepared', href: '/profile/orders?status=processing' },
    { key: 'shipped', label: 'Shipped', hint: 'On the way', href: '/profile/orders?status=shipped' },
    { key: 'delivered', label: 'Delivered', hint: 'Completed', href: '/profile/orders?status=delivered' },
    { key: 'cancelled', label: 'Cancelled', hint: 'Refunded / void', href: '/profile/orders?status=cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-[#f0faf9]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li className="font-medium text-gray-900">Dashboard</li>
          </ol>
        </nav>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-mint to-mint-dark" aria-hidden />
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl" aria-hidden />
            <div className="relative p-8 md:p-10">
              {onTenant ? (
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mint-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
                  {storeLabel}
                </p>
              ) : (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mint-dark/80">Marketplace account</p>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Welcome back, {first}</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
                {onTenant
                  ? `Your order snapshot and shortcuts for ${storeLabel}. Shop, track, and manage everything in one place.`
                  : 'Overview of your purchases across Mint stores—live counts, recent orders, and quick access to your account tools.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={shopHref}
                  className="inline-flex items-center justify-center rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
                >
                  {shopLabel}
                </Link>
                <Link
                  href="/profile/orders"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-mint/40 hover:text-mint-dark"
                >
                  View all orders
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Signed in</p>
            <p className="mt-2 break-all text-sm font-medium text-gray-900">{userEmail}</p>
            <ul className="mt-4 space-y-1 border-t border-gray-100 pt-4">
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm font-medium text-mint-dark hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {dashError ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dashError} — charts and recent activity may be incomplete until the API responds.
          </div>
        ) : null}

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order overview</h2>
              <p className="text-sm text-gray-500">Counts from your account (all stores).</p>
            </div>
            <Link href="/profile/orders" className="text-sm font-semibold text-mint-dark hover:underline">
              Open orders →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {dashLoading
              ? Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
              : statItems.map((s) => (
                  <Link
                    key={s.key}
                    href={s.href}
                    className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-mint/30 hover:shadow-md"
                  >
                    <p className="text-2xl font-bold tabular-nums text-gray-900 group-hover:text-mint-dark">
                      {summary ? summary[s.key] : '—'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.hint}</p>
                  </Link>
                ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
              <Link href="/profile/orders" className="text-sm font-semibold text-mint-dark hover:underline">
                See all
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {dashLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : dashError && recentOrders.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-600">
                  Recent orders could not be loaded. Try{' '}
                  <button
                    type="button"
                    className="font-semibold text-mint-dark underline"
                    onClick={() => {
                      if (!token) return;
                      setDashLoading(true);
                      setDashError(null);
                      Promise.all([getMyOrdersSummary(token), getMyOrders({ token, page: 1, perPage: 5 })])
                        .then(([sum, list]) => {
                          setSummary(sum);
                          setRecentOrders(list.data ?? []);
                        })
                        .catch((e) => {
                          setDashError(e instanceof Error ? e.message : 'Could not load.');
                        })
                        .finally(() => setDashLoading(false));
                    }}
                  >
                    retry
                  </button>
                  .
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-gray-600">No orders yet.</p>
                  <p className="mt-1 text-sm text-gray-500">When you check out, your latest purchases appear here.</p>
                  <Link
                    href={shopHref}
                    className="mt-5 inline-flex rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white hover:bg-mint-dark"
                  >
                    {shopLabel}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => {
                    const { label, chipClass } = customerOrderStatusPresentation(order);
                    const storeName = order.store?.name ?? `Store #${order.store_id}`;
                    return (
                      <div key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">{order.number}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipClass}`}>{label}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {storeName} · {formatOrderDate(order.created_at)}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {(order.line_items ?? [])
                              .slice(0, 2)
                              .map((l) => l.title)
                              .join(' · ')}
                            {(order.line_items?.length ?? 0) > 2 ? ` +${(order.line_items?.length ?? 0) - 2} more` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <p className="text-lg font-bold text-mint-dark">{formatMoneyAmount(order.total)}</p>
                          <Link
                            href={`/order/${order.id}`}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:border-mint/40 hover:text-mint-dark"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Shortcuts</h2>
            <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
              {[
                { href: '/profile/track-order', label: 'Track a package', sub: 'Order number' },
                { href: '/profile/payment-methods', label: 'Payment methods', sub: 'Cards & wallets' },
                { href: '/profile/orders', label: 'Order history', sub: 'Filters & search' },
              ].map((row) => (
                <Link
                  key={row.href}
                  href={row.href}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-mint/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.sub}</p>
                  </div>
                  <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <h2 className="mb-4 mt-12 text-lg font-bold text-gray-900">All tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-mint/25 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint/10 ring-1 ring-mint/10 transition group-hover:bg-mint/15">
                <DashIcon name={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 transition group-hover:text-mint-dark">{item.label}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
              </div>
              <svg
                className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-mint"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/5 to-white p-8">
          <h2 className="text-lg font-semibold text-gray-900">Help</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            {onTenant
              ? 'Questions about this store? Check your order confirmation email or open settings below.'
              : 'Manage subscriptions under Billing & plan, or update profile and security in Settings.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-mint-dark">
            <Link href="/profile/settings" className="hover:underline">
              Settings
            </Link>
            <Link href={shopHref} className="hover:underline">
              {shopLabel}
            </Link>
            <Link href="/profile/orders" className="hover:underline">
              Orders
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
