'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';

type StoreCouponRow = {
  id: number;
  code: string;
  discount_type: string;
  discount_value: string;
  min_subtotal: string | null;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

type CouponsListResponse = { data: StoreCouponRow[] };

export default function AdminCouponsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [rows, setRows] = useState<StoreCouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const load = useCallback(() => {
    if (!token || !currentStore) return;
    setLoading(true);
    setError(null);
    apiRequest<CouponsListResponse>('/store/coupons', { token, storeId: currentStore.id })
      .then((r) => setRows(r.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load coupons'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    load();
  }, [token, currentStore, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<StoreCouponRow>('/store/coupons', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: {
          code: code.trim(),
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          min_subtotal: minSubtotal.trim() ? parseFloat(minSubtotal) : null,
          max_uses: maxUses.trim() ? parseInt(maxUses, 10) : null,
          starts_at: startsAt.trim() || null,
          ends_at: endsAt.trim() || null,
          is_active: true,
        },
      });
      setCode('');
      setDiscountValue('');
      setMinSubtotal('');
      setMaxUses('');
      setStartsAt('');
      setEndsAt('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: StoreCouponRow) => {
    if (!token || !currentStore) return;
    setError(null);
    try {
      await apiRequest(`/store/coupons/${row.id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: { is_active: !row.is_active },
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (id: number) => {
    if (!token || !currentStore) return;
    if (!confirm('Delete this coupon?')) return;
    setError(null);
    try {
      await apiRequest(`/store/coupons/${id}`, { method: 'DELETE', token, storeId: currentStore.id });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6 text-sm text-gray-600">Select a store to manage coupons.</div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <p className="text-xs text-gray-500">Products</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">Discount coupons</h1>
        <p className="text-sm text-gray-500">Customers enter these codes in the cart to reduce order totals.</p>
      </div>

      <div className="p-6 space-y-8">
        <form onSubmit={handleCreate} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
          <h2 className="text-sm font-semibold text-gray-900">New coupon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                placeholder="SUMMER10"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {discountType === 'percent' ? 'Percent (0–100)' : 'Amount'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min. subtotal (optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max uses (optional)</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Starts (optional)</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ends (optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !token}
            className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create coupon'}
          </button>
        </form>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">Active coupons</h2>
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No coupons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Discount</th>
                    <th className="px-4 py-2">Uses</th>
                    <th className="px-4 py-2">Active</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-mono font-medium">{r.code}</td>
                      <td className="px-4 py-2">
                        {r.discount_type === 'percent' ? `${r.discount_value}%` : `$${r.discount_value}`}
                        {r.min_subtotal ? ` · min $${r.min_subtotal}` : ''}
                      </td>
                      <td className="px-4 py-2">
                        {r.uses_count}
                        {r.max_uses != null ? ` / ${r.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(r)}
                          className={r.is_active ? 'text-green-700' : 'text-gray-400'}
                        >
                          {r.is_active ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => remove(r.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
