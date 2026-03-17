'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { Me, UserType } from '@/lib/api';

const USER_TYPE_PERSIST = 'USER_TYPE';

function setCookie(name: string, value: string, maxAge = 86400 * 365): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function ChooseTypePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.access_token) {
      router.replace('/login');
      return;
    }
    // If user already has a type set, send to the right place (e.g. bookmarked this page)
    apiRequest<Me>('/me', { token: session.access_token as string })
      .then((me) => {
        if (me.user_type !== null) {
          setCookie(USER_TYPE_PERSIST, me.user_type);
          router.replace(me.user_type === 'store_admin' ? '/admin' : '/dashboard');
        }
      })
      .catch(() => {});
  }, [session, status, router]);

  const handleChoose = async (userType: UserType) => {
    if (!session?.access_token) {
      router.replace('/login');
      return;
    }
    setLoading(userType);
    setError('');
    try {
      await apiRequest<Me>('/me/sync', {
        method: 'POST',
        token: session.access_token as string,
        body: { user_type: userType },
      });
      setCookie(USER_TYPE_PERSIST, userType);
      if (userType === 'store_admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Try again.');
      setLoading(null);
    }
  };

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-mint border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-gray-600 hover:text-mint">
          <Image src="/logo.webp" alt="Mint" width={40} height={40} className="object-contain" />
          <span className="font-semibold">Mint</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose your account type</h1>
        <p className="text-gray-600 mb-3">
          Tell us how you&apos;ll use Mint. We&apos;ll tailor the experience for you, and you can always browse the marketplace as a shopper.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          This choice controls where we send you after sign in:
          customers go to their personal dashboard, and store owners go to the admin where they manage their store.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleChoose('customer')}
            disabled={!!loading}
            className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-mint hover:bg-mint/5 transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-lg bg-mint/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">I’m a customer</h2>
            <p className="text-sm text-gray-600">
              Best if you want to <span className="font-medium text-gray-800">shop on the marketplace</span>.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li>• Browse all stores and products on Mint.</li>
              <li>• Place orders and track shipping from your dashboard.</li>
              <li>• Manage your profile, addresses, and payment methods.</li>
            </ul>
            {loading === 'customer' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-mint">
                <div className="animate-spin w-4 h-4 border-2 border-mint border-t-transparent rounded-full" />
                <span>Setting up…</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleChoose('store_admin')}
            disabled={!!loading}
            className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-mint hover:bg-mint/5 transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-lg bg-mint/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">I’m a store owner</h2>
            <p className="text-sm text-gray-600">
              Best if you want to <span className="font-medium text-gray-800">sell on the marketplace</span>.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li>• Get access to the Mint Admin to run your store.</li>
              <li>• Create stores, add products, and manage inventory.</li>
              <li>• View orders, customers, and basic analytics.</li>
            </ul>
            {loading === 'store_admin' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-mint">
                <div className="animate-spin w-4 h-4 border-2 border-mint border-t-transparent rounded-full" />
                <span>Setting up…</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
