'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import MintShopLoader from '@/components/MintShopLoader';
import {
  getMe,
  patchMe,
  getMyOrders,
  getMyOrdersSummary,
  getMyAddresses,
  type Me,
  type MyOrderListItem,
  type MyOrdersSummary,
  type MyAddress,
} from '@/lib/api';
import {
  customerOrderStatusPresentation,
  formatOrderDate,
  formatMoneyAmount,
} from '@/lib/customerOrderUi';

function addressPreviewLines(a: MyAddress): string[] {
  const lines: string[] = [];
  const name = [a.first_name, a.last_name].filter(Boolean).join(' ');
  if (name) lines.push(name);
  if (a.address1) lines.push(a.address1);
  if (a.address2) lines.push(a.address2);
  const cityLine = [a.city, a.province, a.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  if (a.phone) lines.push(a.phone);
  return lines;
}

function orderItemCount(o: MyOrderListItem): number {
  return o.line_items.reduce((sum, li) => sum + li.quantity, 0);
}

export default function ProfilePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.access_token as string | undefined;

  const [me, setMe] = useState<Me | null>(null);
  const [summary, setSummary] = useState<MyOrdersSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<MyOrderListItem[]>([]);
  const [addresses, setAddresses] = useState<MyAddress[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const defaultAddress = useMemo(() => {
    const def = addresses.find((a) => a.is_default);
    return def ?? addresses[0] ?? null;
  }, [addresses]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [meRes, summaryRes, ordersRes, addrRes] = await Promise.all([
        getMe(token),
        getMyOrdersSummary(token),
        getMyOrders({ token, page: 1, perPage: 5 }),
        getMyAddresses(token),
      ]);
      setMe(meRes);
      setSummary(summaryRes);
      setRecentOrders(ordersRes.data ?? []);
      setAddresses(addrRes.data ?? []);
    } catch (e) {
      setMe(null);
      setSummary(null);
      setRecentOrders([]);
      setAddresses([]);
      setLoadError(e instanceof Error ? e.message : 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/profile'));
      return;
    }
    void load();
  }, [session, status, router, load]);

  useEffect(() => {
    if (me && !isEditing) {
      setDraftName(me.name ?? '');
    }
  }, [me, isEditing]);

  const handleSave = async () => {
    if (!token || !me) return;
    const name = draftName.trim();
    if (!name) {
      setToastMessage('Please enter a display name.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await patchMe({ token, name });
      setMe(updated);
      setIsEditing(false);
      setToastMessage('Profile updated successfully.');
      setToastType('success');
      setShowToast(true);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : 'Could not save profile.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const navLinks = [
    { href: '/profile/orders', label: 'My Orders', icon: '📦' },
    { href: '/profile/track-order', label: 'Track Order', icon: '🚚' },
    { href: '/profile/wishlist', label: 'Wishlist', icon: '❤️' },
    { href: '/profile/addresses', label: 'Addresses', icon: '📍' },
    { href: '/profile/payment-methods', label: 'Payment Methods', icon: '💳' },
    { href: '/profile/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (status === 'loading' || (status === 'authenticated' && loading && !me && !loadError)) {
    return <MintShopLoader label="Loading your profile…" />;
  }

  if (!session?.user) {
    return <MintShopLoader label="Redirecting…" />;
  }

  if (loadError && !me) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 rounded-lg bg-mint px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-mint-dark"
          >
            Try again
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = (me?.name ?? '').trim() || 'Your account';
  const totalOrders = summary?.total ?? 0;
  const addressCount = addresses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 animate-fade-in">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-mint">
                Dashboard
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-gray-800">Profile</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="animate-slide-up lg:col-span-1">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <div className="bg-gradient-to-br from-mint to-mint-dark p-6 text-white">
                <div className="text-center">
                  <div className="relative mx-auto mb-4 h-32 w-32">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm">
                      <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="mb-1 text-2xl font-bold">{displayName}</h2>
                  <p className="text-sm text-white/90">{me?.email ?? ''}</p>
                </div>
              </div>

              <div className="space-y-3 p-6">
                <div className="flex items-center justify-between rounded-xl border border-mint/20 bg-gradient-to-r from-mint/10 to-mint/5 p-4 transition-all hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/20">
                      <svg className="h-5 w-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Total orders</span>
                  </div>
                  <span className="text-xl font-bold text-mint">{totalOrders}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/80 p-4 transition-all hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15">
                      <svg className="h-5 w-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Saved addresses</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{addressCount}</span>
                </div>
              </div>

              <div className="space-y-1 px-6 pb-6">
                <Link
                  href="/profile"
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 font-medium transition-all ${
                    pathname === '/profile'
                      ? 'bg-mint text-white shadow-md'
                      : 'text-gray-700 hover:bg-mint/10 hover:text-mint'
                  }`}
                >
                  <span className="text-lg">👤</span>
                  <span>Profile</span>
                </Link>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all ${
                        isActive ? 'bg-mint text-white shadow-md' : 'text-gray-700 hover:bg-mint/10 hover:text-mint'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="animate-slide-up space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="mb-2 text-3xl font-bold text-gray-800">Personal information</h3>
                  <p className="text-gray-600">Your display name is stored in your Mint account. Email matches your sign-in.</p>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftName(me?.name ?? '');
                      setIsEditing(true);
                    }}
                    className="flex items-center space-x-2 rounded-lg bg-mint px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-mint-dark hover:shadow-lg"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Edit name</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(me?.name ?? '');
                        setIsEditing(false);
                      }}
                      className="rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                      className="flex items-center space-x-2 rounded-lg bg-mint px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-mint-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Display name</label>
                  <input
                    type="text"
                    value={isEditing ? draftName : me?.name ?? ''}
                    onChange={(e) => setDraftName(e.target.value)}
                    disabled={!isEditing}
                    autoComplete="name"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-mint focus:ring-2 focus:ring-mint disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={me?.email ?? ''}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border-2 border-gray-100 bg-gray-50 px-4 py-3 text-gray-600"
                  />
                  <p className="mt-2 text-sm text-gray-500">To change your email, update it in your identity provider (same account you use to sign in).</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="mb-2 text-3xl font-bold text-gray-800">Addresses</h3>
                  <p className="text-gray-600">Manage shipping addresses for each store you shop.</p>
                </div>
                <Link
                  href="/profile/addresses"
                  className="font-semibold text-mint transition-colors hover:text-mint-dark"
                >
                  Manage addresses →
                </Link>
              </div>
              {defaultAddress ? (
                <div className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-5">
                  {defaultAddress.is_default && (
                    <span className="mb-3 inline-block rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">
                      Default preview
                    </span>
                  )}
                  <ul className="space-y-1 text-gray-700">
                    {addressPreviewLines(defaultAddress).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  {defaultAddress.store?.name && (
                    <p className="mt-3 text-sm text-gray-500">Store: {defaultAddress.store.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">
                  You have no saved addresses yet.{' '}
                  <Link href="/profile/addresses" className="font-semibold text-mint hover:text-mint-dark">
                    Add one
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-3xl font-bold text-gray-800">Recent orders</h3>
                  <p className="text-gray-600">Latest activity across your linked stores</p>
                </div>
                <Link
                  href="/profile/orders"
                  className="flex items-center space-x-1 font-semibold text-mint transition-colors hover:text-mint-dark"
                >
                  <span>View all</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-gray-600">
                  No orders yet.{' '}
                  <Link href="/" className="font-semibold text-mint hover:text-mint-dark">
                    Continue shopping
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const pres = customerOrderStatusPresentation(order);
                    const n = orderItemCount(order);
                    return (
                      <Link
                        key={order.id}
                        href={`/order/${order.id}`}
                        className="group block rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-mint hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <p className="font-bold text-gray-800 transition-colors group-hover:text-mint">
                                {order.number}
                              </p>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pres.chipClass}`}>
                                {pres.label}
                              </span>
                              {order.store?.name && (
                                <span className="text-xs text-gray-500">{order.store.name}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>{formatOrderDate(order.created_at)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                  />
                                </svg>
                                <span>
                                  {n} {n === 1 ? 'item' : 'items'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="mb-1 text-xl font-bold text-mint">{formatMoneyAmount(order.total)}</p>
                            <span className="flex items-center justify-end space-x-1 text-sm text-gray-500 transition-colors group-hover:text-mint">
                              <span>Details</span>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
