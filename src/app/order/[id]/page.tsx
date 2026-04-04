'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import { getMyOrder, getImageDisplayUrl, type MyOrderDetail } from '@/lib/api';
import {
  customerOrderStatusPresentation,
  formatOrderDate,
  formatMoneyAmount,
  formatAddressLines,
} from '@/lib/customerOrderUi';

function LineImage({ src, alt }: { src: string; alt: string }) {
  const display = getImageDisplayUrl(src);
  if (!display) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-xs text-gray-400">
        No image
      </div>
    );
  }
  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={display} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

function taxLinesTotal(lines: unknown[]): string | null {
  let sum = 0;
  let any = false;
  for (const row of lines) {
    if (row && typeof row === 'object' && 'price' in row) {
      const p = parseFloat(String((row as { price: unknown }).price));
      if (!Number.isNaN(p)) {
        sum += p;
        any = true;
      }
    }
  }
  return any ? sum.toFixed(2) : null;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const idParam = params?.id;
  const orderId = typeof idParam === 'string' ? parseInt(idParam, 10) : NaN;

  const [order, setOrder] = useState<MyOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token as string | undefined;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent(`/order/${idParam ?? ''}`));
      return;
    }
    if (!token || Number.isNaN(orderId) || orderId <= 0) {
      setError('Invalid order.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyOrder({ token, orderId })
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch((e) => {
        if (!cancelled) {
          setOrder(null);
          setError(e instanceof Error ? e.message : 'Order not found.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, status, router, token, orderId, idParam]);

  if (status === 'loading' || loading) {
    return <MintShopLoader label="Loading order…" />;
  }

  if (!session?.user) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order unavailable</h1>
          <p className="mt-2 text-gray-600">{error ?? 'We could not load this order.'}</p>
          <Link href="/profile/orders" className="mt-6 inline-block font-semibold text-mint-dark hover:underline">
            Back to my orders
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { label, chipClass } = customerOrderStatusPresentation(order);
  const shippingLines = formatAddressLines(order.shipping_address);
  const taxArr = Array.isArray(order.tax_lines) ? order.tax_lines : [];
  const taxSum = taxLinesTotal(taxArr);
  const storeLabel = order.store?.name ?? `Store #${order.store_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/dashboard" className="hover:text-mint-dark">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li>
              <Link href="/profile/orders" className="hover:text-mint-dark">
                My orders
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="font-medium text-gray-900">Order {order.number}</li>
          </ol>
        </nav>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mint-dark">{storeLabel}</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">Order {order.number}</h1>
              <p className="mt-2 text-gray-600">Placed {formatOrderDate(order.created_at)}</p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-4 py-1.5 text-sm font-semibold ${chipClass}`}>{label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Items</h2>
              <div className="mt-4 space-y-5">
                {(order.line_items ?? []).map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <LineImage src={item.image_url ?? ''} alt={item.title} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Quantity {item.quantity} × {formatMoneyAmount(item.price)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-gray-900">{formatMoneyAmount(item.total)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Shipping address</h2>
              <div className="mt-3 text-sm text-gray-700">
                {shippingLines.length > 0 ? (
                  shippingLines.map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p className="text-gray-500">No shipping address on file for this order.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Payment</h2>
              <p className="mt-3 text-sm text-gray-700">
                Status: <span className="font-semibold capitalize">{order.financial_status.replace(/_/g, ' ')}</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Card and wallet details are not stored in your Mint profile for display.
              </p>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-gray-900">{formatMoneyAmount(order.subtotal)}</dd>
                </div>
                {taxSum != null ? (
                  <div className="flex justify-between text-gray-600">
                    <dt>Tax</dt>
                    <dd className="font-medium text-gray-900">{formatMoneyAmount(taxSum)}</dd>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <dt>Tax</dt>
                    <dd className="font-medium text-gray-900">—</dd>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <dt>Shipping</dt>
                  <dd className="font-medium text-gray-900">—</dd>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <dt className="font-bold text-gray-900">Total</dt>
                    <dd className="text-xl font-bold text-mint-dark">{formatMoneyAmount(order.total)}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                <Link
                  href="/profile/track-order"
                  className="flex w-full items-center justify-center rounded-xl bg-mint py-3 text-sm font-semibold text-white transition hover:bg-mint-dark"
                >
                  Track shipment
                </Link>
                <Link
                  href="/profile/orders"
                  className="flex w-full items-center justify-center rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-800 transition hover:border-mint/40"
                >
                  All orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
