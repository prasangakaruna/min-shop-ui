'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiRequest, type StoreListResponse } from '@/lib/api';

type StoreSummaryLite = {
  id: number;
  name: string;
  slug: string;
};

type IntegrationConfig = {
  base_url?: string | null;
  api_key?: string | null;
  enabled?: boolean;
};

export default function ProIntegrationOverviewPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stores, setStores] = useState<StoreSummaryLite[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [integration, setIntegration] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    apiRequest<StoreListResponse>('/me/stores', { token, query: { per_page: 50 } })
      .then(async (res) => {
        const list: StoreSummaryLite[] = (res.data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        }));
        setStores(list);
        const fromQuery = searchParams.get('store');
        const initialId = fromQuery ? Number(fromQuery) : list[0]?.id ?? null;
        if (initialId) {
          setSelectedStoreId(initialId);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stores'))
      .finally(() => setLoading(false));
  }, [token, searchParams]);

  useEffect(() => {
    if (!token || !selectedStoreId) return;
    setLoading(true);
    setError(null);
    apiRequest<IntegrationConfig>('/store/pos-integration', {
      token,
      storeId: selectedStoreId,
    })
      .then((cfg) => setIntegration(cfg ?? {}))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load integration'))
      .finally(() => setLoading(false));
  }, [token, selectedStoreId]);

  const handleStoreChange = (id: number) => {
    setSelectedStoreId(id);
    setImportResult(null);
    setError(null);
    router.replace(`/admin/pro/integration?store=${id}`);
  };

  const handleImport = async () => {
    if (!token || !selectedStoreId) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await apiRequest<{ imported: number; message?: string }>(
        '/store/pos-integration/import-products',
        { method: 'POST', token, storeId: selectedStoreId }
      );
      const successMsg =
        res.imported > 0
          ? `Success: imported ${res.imported} product${res.imported === 1 ? '' : 's'} into this store.`
          : res.message ?? 'No products were imported.';
      setImportResult(successMsg);
      setTimeout(() => messageAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Failed to import products.';
      setError(errMsg);
      setTimeout(() => messageAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } finally {
      setImporting(false);
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  return (
    <div className="min-h-full bg-gray-50">
      <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/pro" className="text-xs font-medium text-gray-500 hover:text-mint">
              ← Back to platform overview
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Integration overview
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              See how each physical store system is connected to Mint and verify their API
              configuration.
            </p>
          </div>
          {stores.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="mr-1 text-gray-400">Store:</span>
              <select
                value={selectedStoreId ?? ''}
                onChange={(e) => handleStoreChange(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-mint focus:ring-2 focus:ring-mint/20"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div ref={messageAreaRef} className="space-y-3">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-800 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>{error}</span>
            </div>
          )}

          {importResult && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-800 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{importResult}</span>
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {loading && (
            <div className="space-y-3">
              <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-gray-50 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-gray-50 animate-pulse" />
            </div>
          )}

          {!loading && selectedStore && (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Store</p>
                <p className="font-semibold text-gray-900">{selectedStore.name}</p>
                <p className="text-xs text-gray-500">{selectedStore.slug}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">API base URL</p>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-mono break-all">
                    {integration?.base_url || 'Not configured'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">API key / token</p>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-mono break-all">
                    {integration?.api_key ? '•••••••••• (saved)' : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                    integration?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {integration?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This configuration is stored securely for this store and will be used by future
                sync jobs (inventory, orders, or customer data) between Mint and your physical
                store system.
              </p>
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-gray-500">
                    Ready to pull in products from your physical system into Mint.
                  </p>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleImport}
                    className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
                  >
                    {importing && (
                      <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    <span>Import products now</span>
                  </button>
                </div>
                {(importResult || error) && (
                  <p
                    className={`text-xs font-medium ${error ? 'text-red-600' : 'text-emerald-600'}`}
                    role={error ? 'alert' : 'status'}
                  >
                    {error ?? importResult}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

