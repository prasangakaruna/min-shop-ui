'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { signIn } from 'next-auth/react';

const USER_TYPE_COOKIE = 'USER_TYPE_TO_REGISTER';
const COOKIE_MAX_AGE = 600; // 10 minutes

function setRegisterTypeCookie(userType: 'customer' | 'store_admin') {
  if (typeof document === 'undefined') return;
  document.cookie = `${USER_TYPE_COOKIE}=${userType}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function SignUpPage() {
  const handleChoose = (userType: 'customer' | 'store_admin') => {
    setRegisterTypeCookie(userType);
    signIn('keycloak', { callbackUrl: '/auth/after-login', redirect: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-mint">Home</Link></li>
              <li>/</li>
              <li className="text-gray-800">Create account</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <Image src="/logo.webp" alt="Mint Hub" width={48} height={48} className="object-contain" priority />
              <span className="text-xl font-bold text-gray-800">Mint</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create account</h1>
            <p className="text-gray-600">Choose how you want to use Mint. You’ll sign up with Keycloak (one account for both).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => handleChoose('customer')}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 text-left hover:border-mint hover:bg-mint/5 transition-all shadow-sm"
            >
              <div className="w-12 h-12 rounded-lg bg-mint/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">I’m a customer</h2>
              <p className="text-sm text-gray-600">Shop on the marketplace, track orders, and manage your profile.</p>
            </button>

            <button
              type="button"
              onClick={() => handleChoose('store_admin')}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 text-left hover:border-mint hover:bg-mint/5 transition-all shadow-sm"
            >
              <div className="w-12 h-12 rounded-lg bg-mint/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">I’m a store owner</h2>
              <p className="text-sm text-gray-600">Sell products, manage orders, and run your store (admin).</p>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-mint font-medium hover:text-mint-dark">Sign in</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
