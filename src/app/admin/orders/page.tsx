'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Order } from '@/lib/api';

interface OrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page, per_page: 20 };
    if (statusFilter) query.financial_status = statusFilter;
    apiRequest<OrdersResponse>('/store/orders', { token, storeId: currentStore.id, query })
      .then((res) => {
        const list = (res as OrdersResponse).data ?? [];
        setOrders(list);
        setTotal((res as OrdersResponse).total ?? 0);
        setLastPage((res as OrdersResponse).last_page ?? 1);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [token, currentStore, page, statusFilter]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Select a store</p>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toLocaleDateString();
    } catch {
      return s;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-600 text-sm">View and manage orders</p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark"
        >
          Create order
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'paid', 'refunded', 'cancelled'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === s ? 'bg-mint text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
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
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-gray-600 font-medium">No orders yet</p>
            <p className="text-gray-500 text-sm mt-1">Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-mint hover:underline">
                        #{order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">${order.total}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.financial_status)}`}>
                        {order.financial_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-mint hover:underline text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Page {page} of {lastPage} ({total} total)
            </p>
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
