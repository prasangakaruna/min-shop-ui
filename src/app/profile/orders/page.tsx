'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import { getMyOrders, getImageDisplayUrl, type MyOrderListItem } from '@/lib/api';
import {
  ORDER_FILTER_TABS,
  type OrderFilterTab,
  customerOrderStatusPresentation,
  formatOrderDate,
  formatMoneyAmount,
} from '@/lib/customerOrderUi';

const PER_PAGE = 10;

function LineThumb({ src, alt }: { src: string; alt: string }) {
  const display = getImageDisplayUrl(src);
  if (!display) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-xs text-gray-400">
        No image
      </div>
    );
  }
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {/* API product URLs vary by environment; avoid next/image remotePatterns drift */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={display} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilterTab>('all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<MyOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = session?.access_token as string | undefined;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders({
        token,
        status: filter,
        page,
        perPage: PER_PAGE,
      });
      setOrders(res.data ?? []);
      setTotal(res.total ?? 0);
      setLastPage(Math.max(1, res.last_page ?? 1));
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [token, filter, page]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/profile/orders'));
      return;
    }
    void load();
  }, [session, status, router, load]);

  useEffect(() => {
    setPage(1);
    setOrders([]);
  }, [filter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = new URLSearchParams(window.location.search).get('status');
    if (s && ORDER_FILTER_TABS.some((t) => t.id === s)) {
      setFilter(s as OrderFilterTab);
    }
  }, []);

  if (status === 'loading' || (status === 'authenticated' && loading && orders.length === 0 && !error)) {
    return <MintShopLoader label="Loading your orders…" />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-mint-dark">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="font-medium text-gray-900">My orders</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">My orders</h1>
          <p className="mt-2 text-gray-600">Everything you&apos;ve purchased across Mint stores, with live status from the seller.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {ORDER_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === tab.id
                  ? 'bg-mint text-white shadow-md'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-mint/30 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-semibold text-red-900 underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!error && loading && orders.length > 0 ? (
          <p className="mb-4 text-center text-sm font-medium text-mint-dark">Updating list…</p>
        ) : null}

        {!error && !loading && orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint/10">
              <svg className="h-8 w-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">No orders in this view</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              {filter === 'all'
                ? 'When you check out, your orders will show up here with tracking-friendly details.'
                : 'Try another filter or place a new order.'}
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
            >
              Browse products
            </Link>
          </div>
        ) : null}

        {!error && !loading && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const { label, chipClass } = customerOrderStatusPresentation(order);
              const storeLabel = order.store?.name ?? `Store #${order.store_id}`;
              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-mint/20 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">Order {order.number}</h2>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${chipClass}`}>{label}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Placed {formatOrderDate(order.created_at)} · {storeLabel}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-mint-dark">{formatMoneyAmount(order.total)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 px-6 py-5">
                    {(order.line_items ?? []).slice(0, 4).map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <LineThumb src={item.image_url ?? ''} alt={item.title} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">
                            Qty {item.quantity} · {formatMoneyAmount(item.price)} each
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold text-gray-900">{formatMoneyAmount(item.total)}</p>
                      </div>
                    ))}
                    {(order.line_items?.length ?? 0) > 4 ? (
                      <p className="text-sm text-gray-500">+{order.line_items!.length - 4} more line items — see details.</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-gray-100 bg-white px-6 py-4">
                    <Link
                      href={`/order/${order.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-mint-dark"
                    >
                      View details
                    </Link>
                    <Link
                      href="/profile/track-order"
                      className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-mint/40"
                    >
                      Track shipment
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {!error && !loading && lastPage > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {lastPage} ({total} orders)
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
