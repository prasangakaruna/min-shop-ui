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
  getImageDisplayUrl,
  setCartCount,
} from '@/lib/api';
import type { StorefrontCart, StorefrontCartLine } from '@/lib/api';

const LAST_CART_STORE_KEY = 'mint_cart_store_id';

function getLastCartStoreId(): number | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(LAST_CART_STORE_KEY);
  return id ? parseInt(id, 10) : null;
}

function setLastCartStoreId(storeId: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_CART_STORE_KEY, String(storeId));
}

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
  const subtotal = lines.reduce((sum, l) => sum + parseFloat(l.price) * l.quantity, 0).toFixed(2);

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

            <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-900">Subtotal</p>
              <p className="text-xl font-bold text-mint">${subtotal}</p>
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
