"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [callbackUrl, setCallbackUrl] = useState('/auth/after-login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const cb = url.searchParams.get('callbackUrl');
      if (cb) setCallbackUrl(cb);
    } catch {
      // ignore parse errors and keep default
    }
  }, []);

  const handleKeycloakLogin = () => {
    setIsLoading(true);
    setError('');
    signIn('keycloak', { callbackUrl, redirect: true }).finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-mint">Home</Link></li>
              <li>/</li>
              <li className="text-gray-800">Sign in</li>
            </ol>
          </nav>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="text-center mb-6">
              <Link href="/" className="inline-flex items-center space-x-2 mb-4">
                <Image src="/logo.webp" alt="Mint Hub" width={48} height={48} className="object-contain" priority />
                <span className="text-xl font-bold text-gray-800">Mint</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h1>
              <p className="text-gray-600">Sign in with your account. You’ll be redirected to your dashboard or profile based on your account type.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleKeycloakLogin}
              disabled={isLoading}
              className="w-full bg-mint text-white py-3 rounded-lg font-semibold hover:bg-mint-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Redirecting to sign in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign in with Keycloak</span>
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don’t have an account?{' '}
              <Link href="/signup" className="text-mint font-medium hover:text-mint-dark">Create account</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
