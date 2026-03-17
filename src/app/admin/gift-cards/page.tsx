'use client';

import React from 'react';
import Link from 'next/link';

export default function GiftCardsPage() {
  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Gift cards</h1>
            <p className="text-sm text-gray-500">
              Create digital gift cards that customers can buy and redeem in your store.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 px-6 text-center shadow-sm">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-mint/10">
            <span className="text-4xl">🎁</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Start selling gift cards</h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Add gift card products to sell or create one-off gift cards to send directly to customers.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/gift-cards/create"
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Create gift card
            </Link>
            <Link
              href="/admin/gift-cards/new"
              className="rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
            >
              Add gift card product
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            By using gift cards, you agree to our{' '}
            <Link href="#" className="text-mint hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

