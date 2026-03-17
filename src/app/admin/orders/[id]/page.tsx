'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Order } from '@/lib/api';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!token || !currentStore || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiRequest<Order>(`/store/orders/${id}`, { token, storeId: currentStore.id })
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [token, currentStore, id]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Select a store</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-mint border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error ?? 'Order not found'}
        </div>
        <Link href="/admin/orders" className="inline-block mt-4 text-mint font-medium">← Back to orders</Link>
      </div>
    );
  }

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (field: 'financial_status' | 'fulfillment_status', value: string) => {
    if (!token || !currentStore || !order) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await apiRequest<Order>(`/store/orders/${id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: { [field]: value },
      });
      setOrder(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: none; padding: 1rem; } .print-area .no-print { display: none !important; } }`}</style>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-mint mb-1 block">← Orders</Link>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.number}</h1>
          <p className="text-gray-500 text-sm">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Print
          </button>
          <label className="text-sm text-gray-600">Financial</label>
          <select
            value={order.financial_status}
            onChange={(e) => handleStatusChange('financial_status', e.target.value)}
            disabled={updatingStatus}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium disabled:opacity-50 focus:border-mint focus:ring-2 focus:ring-mint/20"
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="refunded">refunded</option>
            <option value="cancelled">cancelled</option>
          </select>
          <label className="text-sm text-gray-600 ml-2">Fulfillment</label>
          <select
            value={order.fulfillment_status}
            onChange={(e) => handleStatusChange('fulfillment_status', e.target.value)}
            disabled={updatingStatus}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium disabled:opacity-50 focus:border-mint focus:ring-2 focus:ring-mint/20"
          >
            <option value="unfulfilled">unfulfilled</option>
            <option value="partial">partial</option>
            <option value="fulfilled">fulfilled</option>
          </select>
        </div>
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Order #{order.number}</h2>
          <p className="text-sm text-gray-600 mt-1">{formatDate(order.created_at)}</p>
        </div>
        <div className="p-6 border-b border-gray-200">
          <p className="text-sm text-gray-600">Customer</p>
          <p className="font-medium text-gray-800">{order.email ?? '—'}</p>
        </div>
        <div className="p-6 border-b border-gray-200 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="font-medium">${order.subtotal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-medium">${order.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Financial status</p>
            <p className="font-medium">{order.financial_status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fulfillment</p>
            <p className="font-medium">{order.fulfillment_status}</p>
          </div>
        </div>
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Line items</h2>
          <ul className="space-y-2">
            {(order.line_items ?? []).map((line) => (
              <li key={line.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-800">{line.title} × {line.quantity}</span>
                <span className="text-gray-700">${line.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
