'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  getStorefrontCart,
  updateStorefrontCartLine,
  removeStorefrontCartLine,
  applyStorefrontCoupon,
  removeStorefrontCoupon,
  getImageDisplayUrl,
  setCartCount,
} from '@/lib/api';
import type { StorefrontCart, StorefrontCartLine } from '@/lib/api';
import { getLastCartStoreId, setLastCartStoreId } from '@/lib/storefrontLastCartStore';

/** Ensure we always get an array of lines (API returns array; guard against object or null). */
function normalizeCartLines(cart: StorefrontCart | null): StorefrontCartLine[] {
  if (!cart?.lines) return [];
  return Array.isArray(cart.lines) ? cart.lines : Object.values(cart.lines);
}

function CartPageInner() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const storeIdParam = searchParams?.get('store_id');
  const storeIdFromUrl = storeIdParam ? parseInt(storeIdParam, 10) : NaN;
  const [storeId, setStoreId] = useState<number | null>(null);
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLineId, setUpdatingLineId] = useState<number | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const checkoutHref =
    storeId != null && storeId > 0
      ? status === 'authenticated'
        ? `/checkout/payment?store_id=${storeId}`
        : `/login?callbackUrl=${encodeURIComponent(`/checkout/payment?store_id=${storeId}`)}`
      : '/login';

  useEffect(() => {
    const sid = !isNaN(storeIdFromUrl) && storeIdFromUrl > 0 ? storeIdFromUrl : getLastCartStoreId();
    setStoreId(sid);
  }, [storeIdFromUrl]);

  useEffect(() => {
    if (storeId == null || storeId <= 0) {
      setLoading(false);
      setCart(null);
      setCartCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    getStorefrontCart(storeId)
      .then((c) => {
        setCart(c);
        setLastCartStoreId(storeId);
        const lines = normalizeCartLines(c);
        const total = lines.reduce((sum, l) => sum + l.quantity, 0);
        setCartCount(total);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load cart');
        setCart(null);
        setCartCount(0);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const updateQuantity = async (line: StorefrontCartLine, newQuantity: number) => {
    if (storeId == null || newQuantity < 1) return;
    setUpdatingLineId(line.id);
    try {
      const updated = await updateStorefrontCartLine(storeId, line.id, newQuantity);
      setCart(updated);
      const total = normalizeCartLines(updated).reduce((sum, l) => sum + l.quantity, 0);
      setCartCount(total);
    } catch {
      // keep current cart
    } finally {
      setUpdatingLineId(null);
    }
  };

  const removeLine = async (lineId: number) => {
    if (storeId == null) return;
    setUpdatingLineId(lineId);
    try {
      const updated = await removeStorefrontCartLine(storeId, lineId);
      setCart(updated);
      const total = normalizeCartLines(updated).reduce((sum, l) => sum + l.quantity, 0);
      setCartCount(total);
    } catch {
      // keep current cart
    } finally {
      setUpdatingLineId(null);
    }
  };

  if (loading && storeId != null) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-100 rounded" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (storeId == null || storeId <= 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart</h1>
          <p className="text-gray-600 mb-6">Add items from a product page to see your cart here.</p>
          <Link href="/" className="text-mint font-medium hover:underline">
            Browse products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-mint font-medium hover:underline">Back to home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const lines = normalizeCartLines(cart);
  const isEmpty = lines.length === 0;
  const computedSubtotal = lines.reduce((sum, l) => sum + parseFloat(l.price) * l.quantity, 0);
  const subtotal = cart?.subtotal ?? computedSubtotal.toFixed(2);
  const discountTotal = parseFloat(cart?.discount_total ?? '0') || 0;
  const total = cart?.total ?? Math.max(0, computedSubtotal - discountTotal).toFixed(2);
  const rawCouponDisc = cart?.coupon_discount;
  const couponDiscountNum =
    rawCouponDisc !== undefined && rawCouponDisc !== null
      ? parseFloat(rawCouponDisc) || 0
      : cart?.coupon_code
        ? parseFloat(cart?.discount_total ?? '0') || 0
        : 0;
  const volumePromo = cart?.volume_promo;
  const volumeScheduleOk = volumePromo?.schedule_active !== false;
  const volumeDiscountNum = parseFloat(volumePromo?.discount_amount ?? '0') || 0;
  const remainingForVolume =
    volumePromo?.enabled &&
    volumeScheduleOk &&
    volumePromo.remaining_to_qualify != null &&
    volumePromo.remaining_to_qualify !== ''
      ? parseFloat(volumePromo.remaining_to_qualify)
      : null;
  const showVolumeProgress =
    !isEmpty && volumePromo?.enabled && volumeScheduleOk && remainingForVolume != null && remainingForVolume > 0;
  const showVolumeSchedulePaused =
    !isEmpty && volumePromo?.enabled && volumePromo.schedule_active === false;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800">Cart</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping cart</h1>

        {isEmpty ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600 mb-6">Your cart is empty.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <ul className="divide-y divide-gray-200">
              {lines.map((line) => (
                <li key={line.id} className="py-6 flex flex-col sm:flex-row gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {line.image_url ? (
                      <img
                        src={getImageDisplayUrl(line.image_url)}
                        alt={line.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-gray-900 truncate">{line.title}</h2>
                    <p className="text-mint font-semibold mt-1">${line.price} each</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          type="button"
                          disabled={updatingLineId === line.id || line.quantity <= 1}
                          onClick={() => updateQuantity(line, line.quantity - 1)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="px-4 py-1.5 border-x border-gray-300 min-w-[2.5rem] text-center text-sm">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={updatingLineId === line.id}
                          onClick={() => updateQuantity(line, line.quantity + 1)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={updatingLineId === line.id}
                        onClick={() => removeLine(line.id)}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">
                      ${(parseFloat(line.price) * line.quantity).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {showVolumeSchedulePaused ? (
              <div
                className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                role="status"
              >
                <p className="font-semibold">Bulk promo is not active right now</p>
                <p className="mt-1 text-amber-900/90">
                  This store&apos;s volume discount is outside its scheduled start or end time. Your cart still works;
                  check back when the promotion is running.
                </p>
              </div>
            ) : null}

            {showVolumeProgress ? (
              <div
                className="mb-4 rounded-xl border border-mint/25 bg-gradient-to-r from-mint/10 to-white px-4 py-3 text-sm text-gray-800"
                role="status"
              >
                <p className="font-semibold text-mint-dark">
                  Spend ${remainingForVolume!.toFixed(2)} more for {volumePromo!.percent}% off
                </p>
                <p className="mt-1 text-gray-600">
                  Orders of ${parseFloat(volumePromo!.min_subtotal).toFixed(2)} or more save{' '}
                  {volumePromo!.percent}% on this purchase (stacks with valid coupon codes).
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Discount code</p>
              {cart?.coupon_code ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-gray-800">
                    Applied: <span className="font-mono font-semibold">{cart.coupon_code}</span>
                  </p>
                  <button
                    type="button"
                    disabled={couponBusy || storeId == null}
                    onClick={async () => {
                      if (storeId == null) return;
                      setCouponBusy(true);
                      setCouponError(null);
                      try {
                        const updated = await removeStorefrontCoupon(storeId);
                        setCart(updated);
                      } catch (e) {
                        setCouponError(e instanceof Error ? e.message : 'Could not remove coupon');
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    disabled={couponBusy}
                  />
                  <button
                    type="button"
                    disabled={couponBusy || !couponInput.trim() || storeId == null}
                    onClick={async () => {
                      if (storeId == null) return;
                      setCouponBusy(true);
                      setCouponError(null);
                      try {
                        const updated = await applyStorefrontCoupon(storeId, couponInput);
                        setCart(updated);
                        setCouponInput('');
                      } catch (e) {
                        setCouponError(e instanceof Error ? e.message : 'Invalid coupon');
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
                  >
                    {couponBusy ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError ? <p className="text-sm text-red-600">{couponError}</p> : null}
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-2">
              <div className="flex justify-between items-center text-gray-700">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal}</span>
              </div>
              {couponDiscountNum > 0 && cart?.coupon_code ? (
                <div className="flex justify-between items-center text-green-700 text-sm">
                  <span>Coupon ({cart.coupon_code})</span>
                  <span className="font-medium">−${couponDiscountNum.toFixed(2)}</span>
                </div>
              ) : null}
              {volumeDiscountNum > 0 ? (
                <div className="flex justify-between items-center text-green-700 text-sm">
                  <span>
                    Volume promo ({volumePromo?.percent}% on ${parseFloat(volumePromo?.min_subtotal ?? '0').toFixed(2)}+ orders)
                  </span>
                  <span className="font-medium">−${volumeDiscountNum.toFixed(2)}</span>
                </div>
              ) : null}
              {discountTotal > 0 && couponDiscountNum === 0 && volumeDiscountNum === 0 ? (
                <div className="flex justify-between items-center text-green-700">
                  <span>Discount</span>
                  <span className="font-medium">−${discountTotal.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <p className="text-lg font-semibold text-gray-900">Total</p>
                <p className="text-xl font-bold text-mint">${total}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="inline-flex justify-center px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continue shopping
              </Link>
              <Link
                href={checkoutHref}
                className="inline-flex justify-center px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
              >
                {status === 'authenticated' ? 'Proceed to checkout' : 'Sign in to checkout'}
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-32 bg-gray-100 rounded" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <CartPageInner />
    </Suspense>
  );
}
