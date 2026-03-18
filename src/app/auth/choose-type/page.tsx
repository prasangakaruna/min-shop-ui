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
          if (me.user_type === 'store_admin') {
            router.replace('/admin');
          } else if (me.user_type === 'pro_admin') {
            router.replace('/admin/pro');
          } else {
            router.replace('/dashboard');
          }
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
      } else if (userType === 'pro_admin') {
        router.replace('/admin/pro');
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
    <div className="min-h-screen bg-gradient-to-b from-white via-mint/5 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-gray-700 hover:text-mint">
          <Image src="/logo.webp" alt="Mint" width={40} height={40} className="object-contain" />
          <span className="font-semibold text-lg tracking-tight">Mint</span>
        </Link>
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-[11px] font-semibold border border-mint/20 shadow-sm mb-3">
            <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
            ACCOUNT SETUP
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Choose your account type
          </h1>
          <p className="text-gray-600 mb-2 text-sm md:text-base">
            Tell us how you&apos;ll use Mint. We&apos;ll tailor the experience, dashboards, and tools for your role.
          </p>
          <p className="text-sm text-gray-500">
            This choice controls where we send you after sign in:
            customers go to their personal dashboard, and store owners go to the admin where they manage their store.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => handleChoose('customer')}
            disabled={!!loading}
            className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 text-left hover:border-mint hover:bg-white shadow-sm hover:shadow-xl transition-all disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-mint/10 flex items-center justify-center mb-4">
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
            className="relative rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 text-left hover:border-mint hover:bg-white shadow-sm hover:shadow-xl transition-all disabled:opacity-50"
          >
            <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint border border-mint/20">
              Recommended
            </span>
            <div className="w-11 h-11 rounded-xl bg-mint/10 flex items-center justify-center mb-4">
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

          <button
            type="button"
            onClick={() => handleChoose('pro_admin')}
            disabled={!!loading}
            className="rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-left shadow-xl shadow-slate-900/60 text-left disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2a4 4 0 014-4h6m0 0l-3-3m3 3l-3 3M9 7h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Pro &amp; Admin</h2>
            <p className="text-sm text-slate-300">
              For platform admins who need a <span className="font-medium">cross‑store overview</span> of revenue,
              orders, and store health.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              <li>• Multi‑store overview for revenue and orders.</li>
              <li>• Platform‑wide health across all of your stores.</li>
              <li>• Quick links into each store&apos;s Mint Admin.</li>
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              Best if you also run other systems and need a single login, but want an{' '}
              <span className="font-medium text-slate-100">advanced admin view</span> inside Mint.
            </p>
            {loading === 'pro_admin' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-mint-light">
                <div className="animate-spin w-4 h-4 border-2 border-mint border-t-transparent rounded-full" />
                <span>Setting up Pro &amp; Admin…</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
