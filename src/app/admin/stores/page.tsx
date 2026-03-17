'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import type { StoreSummary } from '@/lib/api';

export default function StoresListPage() {
  const { data: session } = useSession();
  const { stores, currentStore, setCurrentStore, loading, error, refreshStores } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const [deletingStore, setDeletingStore] = useState<StoreSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteStore = async (store: StoreSummary) => {
    if (!token) return;
    setDeleteError(null);
    try {
      await apiRequest(`/me/stores/${store.id}`, { method: 'DELETE', token });
      await refreshStores();
      setDeletingStore(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete store');
    }
  };

  return (
    <div className="min-h-full">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-mint">← Home</Link>
            <h1 className="mt-2 text-xl font-semibold text-gray-900">Stores</h1>
            <p className="mt-0.5 text-sm text-gray-500">Your stores. Select one to manage in the header.</p>
          </div>
          <Link
            href="/admin/stores/new"
            className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            Create store
          </Link>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <p className="font-medium text-gray-900">No stores yet</p>
            <p className="mt-1 text-sm text-gray-500">Create your first store to get started.</p>
            <Link
              href="/admin/stores/new"
              className="mt-6 inline-block rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark"
            >
              Create store
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition ${
                  currentStore?.id === store.id ? 'border-mint ring-2 ring-mint/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{store.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">{store.slug}</p>
                    {store.domain && (
                      <p className="mt-1 text-xs text-gray-500 truncate" title={store.domain}>{store.domain}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                        {store.plan}
                      </span>
                      {store.is_active !== false ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStore(store)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {currentStore?.id === store.id ? 'Selected' : 'Select'}
                  </button>
                  <Link
                    href="/admin/settings"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setCurrentStore(store)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingStore(store)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete store
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {deletingStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Delete store?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Permanently delete &quot;{deletingStore.name}&quot;? This action cannot be undone.
              </p>
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setDeletingStore(null); setDeleteError(null); }}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStore(deletingStore)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
