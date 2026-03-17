'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStorefrontOrder, type StorefrontOrder } from '@/lib/api';

function formatOrderDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatAddress(addr: Record<string, unknown> | null): string[] {
  if (!addr || typeof addr !== 'object') return [];
  const lines: string[] = [];
  const first = [addr.first_name, addr.last_name].filter(Boolean).join(' ');
  if (first) lines.push(first);
  const a1 = addr.address1 ?? addr.address;
  if (a1) lines.push(String(a1));
  const city = addr.city;
  const province = addr.province_code ?? addr.province ?? addr.state;
  const zip = addr.zip ?? addr.postal_code;
  if (city || province || zip) {
    lines.push([city, province, zip].filter(Boolean).join(', '));
  }
  if (addr.phone) lines.push(String(addr.phone));
  return lines;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const storeIdParam = searchParams.get('store_id');
  const storeId = storeIdParam ? parseInt(storeIdParam, 10) : NaN;
  const effectiveStoreId = !isNaN(storeId) && storeId > 0 ? storeId : null;

  const [order, setOrder] = useState<StorefrontOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId?.trim()) {
      setLoading(false);
      setError('Order ID is required.');
      return;
    }
    if (effectiveStoreId == null) {
      setLoading(false);
      setError('Store is required. Use the link from your checkout email or go back to the store.');
      return;
    }
    setLoading(true);
    setError(null);
    getStorefrontOrder(effectiveStoreId, orderId.trim())
      .then(setOrder)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load order.');
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [orderId, effectiveStoreId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4" />
            <p className="text-gray-600">Loading order confirmation...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
            <p className="text-gray-600 mb-6">{error ?? 'We could not load this order.'}</p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">Order reference: <span className="font-mono">{orderId}</span></p>
            )}
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-mint text-white rounded-xl font-semibold hover:bg-mint-dark transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const shippingLines = formatAddress(order.shipping_address);
  const orderDate = formatOrderDate(order.created_at);
  const totalFormatted = typeof order.total === 'string' && order.total.startsWith('$') ? order.total : `$${Number(order.total).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for your purchase</p>
          <p className="text-gray-500">Your order has been received and is being processed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
              <p className="text-sm text-gray-600">
                Order ID: <span className="font-semibold text-gray-900">{order.number}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold text-gray-900">{orderDate}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {(order.line_items ?? []).map((item) => {
                const priceStr = typeof item.price === 'string' && item.price.startsWith('$') ? item.price : `$${Number(item.price).toFixed(2)}`;
                const totalStr = typeof item.total === 'string' && item.total.startsWith('$') ? item.total : `$${Number(item.total).toFixed(2)}`;
                return (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center border border-gray-200">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{priceStr} × {item.quantity}</p>
                      <p className="font-bold text-mint text-lg">{totalStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Shipping Address
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                {shippingLines.length > 0 ? (
                  shippingLines.map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p className="text-gray-500">No shipping address provided</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold capitalize">{order.financial_status}</p>
                <p className="mt-2 text-lg font-bold text-mint">Total: {totalFormatted}</p>
              </div>
            </div>
          </div>

          <div className="bg-mint/10 border border-mint/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-mint flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Estimated Delivery</h4>
                <p className="text-gray-700">3–5 business days</p>
                <p className="text-sm text-gray-600 mt-2">You will receive a tracking number via email once your order ships.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href={`/order/${order.id}`}
            className="inline-flex items-center justify-center px-8 py-4 bg-mint text-white rounded-xl font-semibold hover:bg-mint-dark transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Order Details
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-mint text-mint rounded-xl font-semibold hover:bg-mint/10 transition-all shadow-md hover:shadow-lg"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Confirmation Email</h4>
              <p className="text-sm text-gray-600">You&apos;ll receive an order confirmation email shortly with all the details.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Order Processing</h4>
              <p className="text-sm text-gray-600">We&apos;re preparing your order and will notify you when it ships.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Track Your Order</h4>
              <p className="text-sm text-gray-600">Use your order number <span className="font-mono">{order.number}</span> to track the status of your shipment.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4" />
            <p className="text-gray-600">Loading order confirmation...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
