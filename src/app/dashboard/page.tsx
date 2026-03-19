'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const USER_TYPE_COOKIE = 'USER_TYPE';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const shortcuts = [
  { href: '/profile/orders', label: 'My Orders', icon: '📦', description: 'View and track your orders' },
  { href: '/profile/track-order', label: 'Track Order', icon: '🚚', description: 'Track a shipment' },
  { href: '/profile/wishlist', label: 'Wishlist', icon: '❤️', description: 'Your saved items' },
  { href: '/profile/addresses', label: 'Addresses', icon: '📍', description: 'Shipping & billing addresses' },
  { href: '/profile/payment-methods', label: 'Payment Methods', icon: '💳', description: 'Cards and payment options' },
  { href: '/dashboard/billing/plan', label: 'Billing & Plan', icon: '💎', description: 'Manage your subscription and renewals' },
  { href: '/profile', label: 'Profile', icon: '👤', description: 'Personal information' },
  { href: '/profile/settings', label: 'Settings', icon: '⚙️', description: 'Privacy and preferences' },
];

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login');
      return;
    }
    const userType = getCookie(USER_TYPE_COOKIE);
    if (userType === 'store_admin') {
      router.replace('/admin');
      return;
    }
    if (userType === 'pro_admin') {
      router.replace('/admin/pro');
      return;
    }
    setChecked(true);
  }, [session, status, router]);

  if (status === 'loading' || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-2 border-mint border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? 'Customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-mint transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Dashboard</li>
          </ol>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}</h1>
          <p className="mt-1 text-gray-600">Manage your orders, addresses, and account from one place.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-mint/30 transition-all"
            >
              <span className="text-3xl" aria-hidden>{item.icon}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 group-hover:text-mint transition-colors">
                  {item.label}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-mint flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-mint/5 border border-mint/20 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-900">Need something?</h2>
          <p className="mt-1 text-gray-600 text-sm">
            Shop the marketplace to discover products from our stores, or use the links above to manage your account.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-mint font-medium hover:underline"
          >
            Browse marketplace
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
