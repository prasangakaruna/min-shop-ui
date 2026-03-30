'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type AdminGiftCard, type GiftCardsListResponse } from '@/lib/api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function GiftCardsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [rows, setRows] = useState<AdminGiftCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token || !currentStore) return;
    setLoading(true);
    setError(null);
    apiRequest<GiftCardsListResponse>('/store/gift-cards', {
      token,
      storeId: currentStore.id,
      query: { per_page: 100 },
    })
      .then((res) => {
        setRows(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load gift cards'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      setRows([]);
      setTotal(0);
      return;
    }
    load();
  }, [token, currentStore, load]);

  if (!currentStore) {
    return (
      <div className="min-h-full bg-gray-50/60 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store in the header to view gift cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Gift cards</h1>
            <p className="text-sm text-gray-500">
              One-off codes issued from the admin API — balance and redemption can be extended later.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              For cart discount codes, use{' '}
              <Link href="/admin/coupons" className="font-medium text-mint hover:underline">
                Coupons
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
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
        </div>
      </div>

      <div className="p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <p className="mt-2 text-xs text-red-600">
              Check that the API is running and <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_API_URL</code> in{' '}
              <code className="rounded bg-red-100 px-1">.env.local</code> points to it (e.g.{' '}
              <code className="rounded bg-red-100 px-1">http://localhost:8000/api</code>).
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading gift cards…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 px-6 text-center shadow-sm">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-mint/10">
              <span className="text-4xl">🎁</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">No gift cards yet</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Create a code customers can redeem, or add a sellable gift card product with fixed denominations.
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
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                All gift cards
                <span className="ml-2 font-normal text-gray-500">({total})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Balance</th>
                    <th className="px-4 py-2">Initial</th>
                    <th className="px-4 py-2">Expires</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2.5 font-mono font-medium text-gray-900">{g.code}</td>
                      <td className="px-4 py-2.5 text-gray-800">
                        {g.currency} {g.balance}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {g.currency} {g.initial_value}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{formatDate(g.expires_at)}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(g.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
