'use client';

import React from 'react';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Purchase orders</h1>
            <p className="text-sm text-gray-500">
              Track and receive inventory ordered from suppliers.
            </p>
          </div>
          <Link
            href="/admin/purchase-orders/new"
            className="inline-flex items-center rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Create purchase order
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 px-6 text-center shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-mint/10">
            <span className="text-3xl">📄</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Manage your purchase orders</h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Track inventory you order from suppliers and mark items as received so your on-hand stock stays accurate.
          </p>
          <Link
            href="/admin/purchase-orders/new"
            className="mt-6 inline-flex items-center rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Create purchase order
          </Link>
        </div>
      </div>
    </div>
  );
}

