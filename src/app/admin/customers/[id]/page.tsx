'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Customer } from '@/lib/api';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '' });

  useEffect(() => {
    if (!token || !currentStore || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    apiRequest<Customer>(`/store/customers/${id}`, { token, storeId: currentStore.id })
      .then((data) => {
        setCustomer(data);
        setForm({
          email: data.email ?? '',
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Customer not found'))
      .finally(() => setLoading(false));
  }, [token, currentStore, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore || !id) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiRequest<Customer>(`/store/customers/${id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: {
          email: form.email.trim(),
          first_name: form.first_name.trim() || null,
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
        },
      });
      setCustomer(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store</p>
          <Link href="/admin/customers" className="mt-2 inline-block text-sm text-mint">← Customers</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error ?? 'Customer not found'}
        </div>
        <Link href="/admin/customers" className="mt-4 inline-block text-sm text-mint">← Customers</Link>
      </div>
    );
  }

  const displayName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm text-gray-600 hover:text-mint">← Customers</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Customer</h1>
        <p className="text-sm text-gray-500">{displayName}</p>
      </div>

      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="cust-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cust-first" className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  id="cust-first"
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label htmlFor="cust-last" className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  id="cust-last"
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cust-phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="cust-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</p>
                <p className="mt-1 font-medium text-gray-900">{customer.email}</p>
              </div>
              <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Edit
              </button>
            </div>
            {(customer.first_name || customer.last_name) && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Name</p>
                <p className="mt-1 text-gray-900">{[customer.first_name, customer.last_name].filter(Boolean).join(' ')}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Phone</p>
                <p className="mt-1 text-gray-900">{customer.phone}</p>
              </div>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Orders</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{customer.orders_count}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total spent</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">${customer.total_spent}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Marketing</p>
          <p className="mt-1 text-gray-900">{customer.accepts_marketing ? 'Accepts marketing' : 'Does not accept marketing'}</p>
        </div>
      </div>
    </div>
  );
}
