'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';

interface Checkout {
  id: number;
  store_id: number;
  email: string | null;
  status: string;
  created_at: string | null;
}

interface AbandonedResponse {
  data: Checkout[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AbandonedCheckoutsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiRequest<AbandonedResponse>('/store/abandoned-checkouts', {
      token,
      storeId: currentStore.id,
      query: { per_page: 20 },
    })
      .then((res) => {
        setCheckouts((res.data ?? []) as Checkout[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load abandoned checkouts'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store to view abandoned checkouts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Abandoned checkouts</h1>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Abandoned checkouts will show here</h2>
          <p className="text-sm text-gray-600 max-w-xl">
            See when customers put an item in their cart but do not check out. You can also email customers a link to
            their cart to recover lost sales.
          </p>
          {error && (
            <p className="mt-3 text-xs text-red-600">
              {error}
            </p>
          )}
          {!loading && checkouts.length > 0 && (
            <div className="mt-5 text-sm text-gray-700">
              <p className="font-medium mb-2">Recent abandoned sessions</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {checkouts.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <span className="font-mono text-gray-800">#{c.id}</span>{' '}
                    <span>{c.email ?? 'No email'}</span>{' '}
                    <span className="text-gray-400">· {formatDate(c.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="hidden md:flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50">
          <span className="text-4xl">🛒</span>
        </div>
      </div>

      {checkouts.length === 0 && !loading && (
        <p className="mt-4 text-center text-xs text-gray-500">
          Learn more about how abandoned checkouts work in your store analytics.
        </p>
      )}

      {loading && (
        <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-mint border-t-transparent" />
          Loading abandoned checkouts…
        </div>
      )}
    </div>
  );
}

