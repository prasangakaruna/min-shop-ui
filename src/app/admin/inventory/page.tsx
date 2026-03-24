'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Product, type ProductsResponse } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';

export default function InventoryPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const query: Record<string, string | number> = { per_page: 100 };
    if (search) query.search = search;
    apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query })
      .then((res) => setProducts((res.data ?? []) as Product[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [token, currentStore, search]);

  const totalStock = (p: Product) =>
    p.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store to view inventory.</p>
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
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500">
              Track stock levels for products and variants.
            </p>
          </div>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Add product
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
          <div className="border-b border-gray-100 px-4 py-3">
            <AdminSearchFilters
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchSubmit={() => setSearch(searchInput.trim())}
              showSearchButton
              searchPlaceholder="Search products"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint border-t-transparent" />
              Loading inventory…
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="font-medium text-gray-700">No products yet</p>
              <p className="mt-1 text-sm text-gray-500">Add a product to start tracking inventory.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Variants
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/edit/${p.id}`}
                        className="font-medium text-gray-900 hover:text-mint"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.variants?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold tabular-nums">
                      {totalStock(p)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

