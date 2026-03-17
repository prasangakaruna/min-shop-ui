'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type CustomersResponse, type Customer } from '@/lib/api';

function generateCode(): string {
  const segments: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    segments.push(Math.random().toString(36).slice(2, 6).toUpperCase());
  }
  return segments.join('-');
}

export default function CreateGiftCardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [code, setCode] = useState(generateCode);
  const [initialValue, setInitialValue] = useState('10.00');
  const [currency] = useState('LKR Rs');
  const [neverExpires, setNeverExpires] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidAmount = useMemo(() => {
    const n = Number(initialValue);
    return !Number.isNaN(n) && n >= 0.01;
  }, [initialValue]);

  const searchCustomers = async (term: string) => {
    if (!token || !currentStore || !term.trim()) {
      setCustomers([]);
      return;
    }
    setCustomersLoading(true);
    try {
      const res = await apiRequest<CustomersResponse>('/store/customers', {
        token,
        storeId: currentStore.id,
        query: { search: term, per_page: 5 },
      });
      setCustomers(res.data ?? []);
    } catch {
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;

    if (!isValidAmount) {
      setError('Enter a valid initial value (at least 0.01).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        code: code.trim() || undefined,
        initial_value: Number(initialValue),
        currency,
        customer_id: selectedCustomer?.id ?? null,
        never_expires: neverExpires,
        expires_at: neverExpires ? null : expiresAt || null,
        note: note.trim() || null,
      };

      await apiRequest('/store/gift-cards', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      router.push('/admin/gift-cards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gift card');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store first</p>
          <Link href="/admin/gift-cards" className="mt-3 inline-block text-sm font-medium text-mint">
            ← Gift cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/admin/gift-cards" className="hover:text-mint">
              Gift cards
            </Link>
            <span>/</span>
            <span>Create</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Create gift card</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            )}
            <span>{loading ? 'Saving…' : 'Save gift card'}</span>
          </button>
          <Link
            href="/admin/gift-cards"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]"
      >
        {/* Left column: gift card details */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Gift card details</h2>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Gift card code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                  <button
                    type="button"
                    onClick={() => setCode(generateCode())}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Initial value
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <span className="text-xs text-gray-500">Rs</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    className="w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Expiration
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setNeverExpires(true)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                      neverExpires
                        ? 'border-mint bg-mint/10 text-mint'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>Doesn&apos;t expire</span>
                  </button>
                  {!neverExpires && (
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  )}
                  <p className="text-xs text-gray-400">
                    Gift card expiration laws can vary by country.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: customer + notes */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="px-4 py-3 text-sm">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerSearch(val);
                    setCustomerDropdownOpen(true);
                    if (val.trim().length >= 2) {
                      void searchCustomers(val);
                    } else {
                      setCustomers([]);
                    }
                  }}
                  onFocus={() => {
                    setCustomerDropdownOpen(true);
                    if (customerSearch.trim().length >= 2) {
                      void searchCustomers(customerSearch);
                    }
                  }}
                  placeholder="Search or create customer"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
                {customerDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="border-t border-gray-100 max-h-48 overflow-auto text-sm">
                      {customersLoading ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-500">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                          <span>Searching customers...</span>
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-gray-500">No customer found</div>
                      ) : (
                        customers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch(
                                c.first_name || c.last_name
                                  ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
                                  : c.email,
                              );
                              setCustomerDropdownOpen(false);
                            }}
                            className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50"
                          >
                            <span className="text-xs font-medium text-gray-800">
                              {c.first_name || c.last_name
                                ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
                                : c.email}
                            </span>
                            <span className="text-xs text-gray-500">{c.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected:{' '}
                  <span className="font-medium text-gray-800">
                    {selectedCustomer.first_name || selectedCustomer.last_name
                      ? `${selectedCustomer.first_name ?? ''} ${
                          selectedCustomer.last_name ?? ''
                        }`.trim()
                      : selectedCustomer.email}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Internal note about this gift card"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

