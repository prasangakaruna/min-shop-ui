'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type ProductsResponse, type Product } from '@/lib/api';

export default function CollectionsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Load up to 200 products – enough to build collections overview.
    apiRequest<ProductsResponse>('/store/products', {
      token,
      storeId: currentStore.id,
      query: { per_page: 200 },
    })
      .then((res) => {
        setProducts((res.data ?? []) as Product[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load collections'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  const collections = useMemo(() => {
    const map = new Map<string, { name: string; productCount: number }>();
    for (const p of products) {
      const meta = (p as any).metadata ?? {};
      const list: string[] = Array.isArray(meta.collections) ? meta.collections : [];
      for (const raw of list) {
        const name = String(raw);
        if (!name.trim()) continue;
        const existing = map.get(name) ?? { name, productCount: 0 };
        existing.productCount += 1;
        map.set(name, existing);
      }
    }
    // Always show a "Home page" collection, even if empty.
    if (!map.has('Home page')) {
      map.set('Home page', { name: 'Home page', productCount: 0 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store to manage collections.</p>
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
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Collections</h1>
          </div>
          <Link
            href="/admin/collections/new"
            className="inline-flex items-center rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Add collection
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 bg-white"
              >
                All
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 text-sm"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <span className="sr-only">Search</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <span className="sr-only">More</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-[220px]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                Loading collections…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product conditions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections.map((c) => (
                    <tr key={c.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.productCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Manual selection</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {!loading && (
          <p className="mt-4 text-center text-xs text-gray-500">
            Learn more about collections
          </p>
        )}
      </div>
    </div>
  );
}

