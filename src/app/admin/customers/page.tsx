'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Customer, type CustomersResponse } from '@/lib/api';

export default function AdminCustomersPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page, per_page: 20 };
    if (search.trim()) query.search = search.trim();
    apiRequest<CustomersResponse>('/store/customers', {
      token,
      storeId: currentStore.id,
      query,
    })
      .then((res) => {
        setCustomers((res as CustomersResponse).data ?? []);
        setTotal((res as CustomersResponse).total ?? 0);
        setLastPage((res as CustomersResponse).last_page ?? 1);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, currentStore, page, search]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Select a store</p>
        </div>
      </div>
    );
  }

  const displayName = (c: Customer) =>
    [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-600 text-sm">Customers who have ordered or signed up</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark"
          >
            New customer
          </Link>
          <input
          type="search"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-mint focus:ring-2 focus:ring-mint/20"
        />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-mint border-t-transparent rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-gray-600 font-medium">No customers yet</p>
            <p className="text-gray-500 text-sm mt-1">Customers will appear here when they place orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="font-medium text-gray-800 hover:text-mint">
                        {displayName(c)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.email}</td>
                    <td className="px-4 py-3 text-gray-700">{c.orders_count}</td>
                    <td className="px-4 py-3 text-gray-700">${c.total_spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Page {page} of {lastPage} ({total} total)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
