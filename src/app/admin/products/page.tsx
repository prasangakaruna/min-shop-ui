'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Product, type ProductsResponse } from '@/lib/api';
import Toast from '@/components/Toast';

type PosIntegrationConfig = {
  enabled?: boolean;
  auto_sync?: boolean;
};

function ProductRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="w-10 px-5 py-4"><div className="h-4 w-4 animate-pulse rounded bg-gray-100" /></td>
      <td className="px-5 py-4">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-5 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" /></td>
      <td className="px-5 py-4"><div className="h-4 w-14 animate-pulse rounded bg-gray-100" /></td>
      <td className="px-5 py-4"><div className="h-4 w-10 animate-pulse rounded bg-gray-100" /></td>
      <td className="px-5 py-4 text-right"><div className="h-8 w-12 animate-pulse rounded bg-gray-100 ml-auto" /></td>
    </tr>
  );
}

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [pos, setPos] = useState<PosIntegrationConfig | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleDuplicate = async (p: Product) => {
    if (!token || !currentStore) return;
    setDuplicatingId(p.id);
    setError(null);
    try {
      const created = await apiRequest<Product>('/store/products', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: {
          title: `Copy of ${p.title}`,
          description: p.description ?? undefined,
          category: p.category ?? undefined,
          status: p.status || 'draft',
        },
      });
      setProducts((prev) => [created as Product, ...prev]);
      setTotal((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to duplicate');
    } finally {
      setDuplicatingId(null);
    }
  };

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page, per_page: 20 };
    if (search) query.search = search;
    if (statusFilter) query.status = statusFilter;
    apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query })
      .then((res) => {
        const data = (res as ProductsResponse).data ?? [];
        setProducts(data);
        setTotal((res as ProductsResponse).total ?? 0);
        setLastPage((res as ProductsResponse).last_page ?? 1);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [token, currentStore, page, search, statusFilter]);

  // Load POS integration config for this store
  useEffect(() => {
    if (!token || !currentStore) return;
    apiRequest<PosIntegrationConfig>('/store/pos-integration', { token, storeId: currentStore.id })
      .then((cfg) => setPos(cfg ?? {}))
      .catch(() => setPos(null));
  }, [token, currentStore?.id]);

  // Auto-sync integrated products when enabled
  useEffect(() => {
    if (!token || !currentStore) return;
    if (!pos?.enabled || !pos?.auto_sync) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const runSync = async () => {
      if (syncing) return;
      setSyncing(true);
      try {
        const res = await apiRequest<{ imported: number; created?: number; updated?: number; message?: string }>(
          '/store/pos-integration/import-products',
          { method: 'POST', token, storeId: currentStore.id }
        );
        if (cancelled) return;
        if ((res.updated ?? 0) > 0 || (res.created ?? 0) > 0) {
          setToast({
            type: 'success',
            message: `Synced POS products (created ${res.created ?? 0}, updated ${res.updated ?? 0}).`,
          });
          // Refresh current table page
          const query: Record<string, string | number> = { page, per_page: 20 };
          if (search) query.search = search;
          if (statusFilter) query.status = statusFilter;
          const refreshed = await apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query });
          if (!cancelled) {
            setProducts((refreshed as ProductsResponse).data ?? []);
            setTotal((refreshed as ProductsResponse).total ?? 0);
            setLastPage((refreshed as ProductsResponse).last_page ?? 1);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setToast({ type: 'warning', message: e instanceof Error ? e.message : 'Auto sync failed' });
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    // Initial sync on entry
    void runSync();
    // Periodic sync every 2 minutes
    timer = setInterval(runSync, 2 * 60 * 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token, currentStore?.id, pos?.enabled, pos?.auto_sync, page, search, statusFilter, syncing]);

  const runSearch = () => { setSearch(searchInput); setPage(1); };

  // Live search: debounce input so API is called automatically while typing
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  };

  const handleBulkStatus = async () => {
    if (!token || !currentStore || !bulkStatus || selectedIds.size === 0) return;
    setBulkActionLoading(true);
    setError(null);
    try {
      await apiRequest<{ updated: number }>('/store/products/bulk', {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: { product_ids: Array.from(selectedIds), status: bulkStatus },
      });
      setSelectedIds(new Set());
      setBulkStatus('');
      const query: Record<string, string | number> = { page, per_page: 20 };
      if (search) query.search = search;
      if (statusFilter) query.status = statusFilter;
      const res = await apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query });
      setProducts((res as ProductsResponse).data ?? []);
      setTotal((res as ProductsResponse).total ?? 0);
      setLastPage((res as ProductsResponse).last_page ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk update failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!token || !currentStore || selectedIds.size === 0) return;
    setBulkActionLoading(true);
    setError(null);
    try {
      await apiRequest<{ deleted: number }>('/store/products/bulk', {
        method: 'DELETE',
        token,
        storeId: currentStore.id,
        body: { product_ids: Array.from(selectedIds) },
      });
      setShowBulkDeleteConfirm(false);
      setSelectedIds(new Set());
      const query: Record<string, string | number> = { page, per_page: 20 };
      if (search) query.search = search;
      if (statusFilter) query.status = statusFilter;
      const res = await apiRequest<ProductsResponse>('/store/products', { token, storeId: currentStore.id, query });
      setProducts((res as ProductsResponse).data ?? []);
      setTotal((res as ProductsResponse).total ?? 0);
      setLastPage((res as ProductsResponse).last_page ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk delete failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store</p>
          <Link href="/admin" className="mt-2 inline-block text-sm text-mint">Back to Home</Link>
        </div>
      </div>
    );
  }

  const primaryPrice = (p: Product) => {
    const v = p.variants?.[0];
    return v ? `$${v.price}` : '—';
  };
  const totalStock = (p: Product) =>
    p.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;
  const isLowStock = (p: Product) => totalStock(p) > 0 && totalStock(p) < 10;
  const variantCount = (p: Product) => p.variants?.length ?? 0;

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-gray-100 text-gray-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Products</h1>
            <p className="mt-0.5 text-sm text-gray-500">Manage your catalog</p>
          </div>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add product
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search by product name..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Search
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">{selectedIds.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            >
              <option value="">Change status to…</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="button"
              onClick={handleBulkStatus}
              disabled={!bulkStatus || bulkActionLoading}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {bulkActionLoading ? '…' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkActionLoading}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-10 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-mint focus:ring-mint/20"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Price</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Stock</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <ProductRowSkeleton key={i} />)
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="mt-4 font-medium text-gray-900">No products yet</p>
                      <p className="mt-1 text-sm text-gray-500">Add your first product to start selling.</p>
                      <Link
                        href="/admin/products/add"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark"
                      >
                        <span>+</span> Add product
                      </Link>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50">
                      <td className="w-10 px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300 text-mint focus:ring-mint/20"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/admin/products/edit/${p.id}`} className="block">
                          <p className="font-medium text-gray-900 hover:text-mint">{p.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {variantCount(p)} variant{variantCount(p) !== 1 ? 's' : ''}
                            {p.variants?.[0]?.sku && ` · ${p.variants[0].sku}`}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm tabular-nums text-gray-700">{primaryPrice(p)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-medium tabular-nums ${totalStock(p) === 0 ? 'text-red-600' : isLowStock(p) ? 'text-amber-600' : 'text-gray-700'}`}>
                          {totalStock(p)}
                        </span>
                        {isLowStock(p) && <span className="ml-1 text-xs text-amber-600">Low</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            disabled={duplicatingId === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {duplicatingId === p.id ? '…' : 'Duplicate'}
                          </button>
                          <Link
                            href={`/admin/products/edit/${p.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && !loading && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Delete {selectedIds.size} product(s)?</h3>
              <p className="mt-2 text-sm text-gray-600">This cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={bulkActionLoading}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkActionLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
