'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Customer } from '@/lib/api';

export default function NewCustomerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    setSaving(true);
    setError(null);
    try {
      const customer = await apiRequest<Customer>('/store/customers', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: {
          email: form.email.trim(),
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
        },
      });
      router.push(`/admin/customers/${customer.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create customer');
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

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm text-gray-600 hover:text-mint">← Customers</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New customer</h1>
        <p className="text-sm text-gray-500">Add a customer to this store.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First name</label>
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last name</label>
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create customer'}
          </button>
          <Link
            href="/admin/customers"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
