'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import { getMe, type Me, type UserType } from '@/lib/api';
import { fetchActiveSubscription, getPlanDefinition, type ActiveSubscription } from '@/lib/subscription';

function formatBrand(brand: string | null | undefined): string {
  if (!brand) return 'Card';
  const b = brand.trim().toLowerCase();
  if (b === 'amex' || b === 'american express') return 'American Express';
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function subscriptionStatusLabel(s: ActiveSubscription): string {
  switch (s.status) {
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past due';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    default:
      return s.status;
  }
}

function isMerchantish(userType: UserType | null | undefined): boolean {
  return userType === 'store_admin' || userType === 'pro_admin';
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.access_token as string | undefined;

  const [me, setMe] = useState<Me | null>(null);
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const meRes = await getMe(token);
      setMe(meRes);
      try {
        const sub = await fetchActiveSubscription({ token, ownerType: 'user' });
        setSubscription(sub);
      } catch {
        setSubscription(null);
      }
    } catch (e) {
      setMe(null);
      setSubscription(null);
      setLoadError(e instanceof Error ? e.message : 'Could not load account.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/profile/payment-methods'));
      return;
    }
    void load();
  }, [session, status, router, load]);

  if (status === 'loading' || (status === 'authenticated' && loading && !me && !loadError)) {
    return <MintShopLoader label="Loading payment settings…" />;
  }

  if (!session?.user) {
    return null;
  }

  if (loadError && !me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 rounded-xl bg-mint px-6 py-3 font-semibold text-white shadow-md transition hover:bg-mint-dark"
          >
            Try again
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const planName = subscription ? getPlanDefinition(subscription.plan_code).name : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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
            <li>
              <Link href="/profile" className="transition-colors hover:text-mint-dark">
                Profile
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="font-medium text-gray-900">Payment methods</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Payment methods</h1>
          <p className="mt-2 text-gray-600">
            How you pay on Mint shops versus billing for your Mint platform account.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint/10">
                <svg className="h-6 w-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Store purchases</h2>
                <p className="mt-2 text-gray-600">
                  We do not keep a wallet of saved cards for checkout yet. Each order is paid when you complete checkout on the
                  store. In the current demo, payments are simulated so your order can be created—when a real gateway is
                  connected, card data stays with the payment provider, not in this form.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-mint/40 hover:bg-gray-50"
                  >
                    Continue shopping
                  </Link>
                  <Link
                    href="/profile/orders"
                    className="inline-flex items-center justify-center rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
                  >
                    Order history
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <svg className="h-6 w-6 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900">Mint platform subscription</h2>
                <p className="mt-2 text-gray-600">
                  If you subscribe to Mint for your own stores, the card on file for that subscription is managed under Billing
                  &amp; plan—not on this screen for shop checkout.
                </p>

                {subscription ? (
                  <div className="mt-6 rounded-xl border-2 border-gray-100 bg-gray-50/80 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{planName} plan</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'past_due'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {subscriptionStatusLabel(subscription)}
                      </span>
                    </div>
                    {subscription.card_last4 ? (
                      <p className="mt-3 text-gray-700">
                        <span className="font-medium">{formatBrand(subscription.card_brand)}</span>
                        <span className="text-gray-500"> ···· </span>
                        <span className="font-mono tracking-wide">{subscription.card_last4}</span>
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-gray-600">No card details on file yet—add them when you choose a plan.</p>
                    )}
                    {subscription.next_billing_date ? (
                      <p className="mt-2 text-sm text-gray-600">
                        Next billing:{' '}
                        {new Date(subscription.next_billing_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    ) : null}
                    <Link
                      href="/dashboard/billing/plan"
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
                    >
                      Manage plan &amp; payment
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-gray-600">
                    <p>No active Mint subscription on this account.</p>
                    {isMerchantish(me?.user_type) ? (
                      <Link
                        href="/dashboard/billing/plan"
                        className="mt-3 inline-block text-sm font-semibold text-mint hover:text-mint-dark"
                      >
                        View plans &amp; billing →
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">More in your account</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-mint">
              <li>
                <Link href="/profile" className="hover:text-mint-dark">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/profile/addresses" className="hover:text-mint-dark">
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-mint-dark">
                  Orders
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
