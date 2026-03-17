'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-mint opacity-20">404</h1>
            <h2 className="text-3xl font-bold text-gray-800 mt-4 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-8">
              Looks like you&apos;ve followed a broken link or entered a URL that doesn&apos;t exist on this site.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block bg-mint text-white px-8 py-3 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-md hover:shadow-lg"
            >
              Go Back Home
            </Link>
            
            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-4">Or try these popular pages:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/products"
                  className="text-mint hover:text-mint-dark font-medium text-sm"
                >
                  Products
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/dashboard"
                  className="text-mint hover:text-mint-dark font-medium text-sm"
                >
                  Dashboard
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/admin"
                  className="text-mint hover:text-mint-dark font-medium text-sm"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
