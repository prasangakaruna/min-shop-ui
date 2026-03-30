'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';
import type { StoreContentPage } from '@/lib/storePages';

type ContentResponse = {
  data: {
    pages: StoreContentPage[];
  };
};

function formatDate(input: string | null | undefined): string {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString();
}

export default function AdminContentPagesListPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [pages, setPages] = useState<StoreContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPages = useCallback(async () => {
    if (!token || !currentStore) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    const list = Array.isArray(res.data?.pages) ? res.data.pages : [];
    setPages(list as StoreContentPage[]);
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadPages()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load pages'))
      .finally(() => setLoading(false));
  }, [token, currentStore, loadPages]);

  const removePage = async (id: string) => {
    if (!window.confirm('Move this page to the trash? Menu links will break until you update the menu.')) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/pages/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadPages();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete page');
    } finally {
      setSaving(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedSearch) return pages;
    return pages.filter((p) =>
      `${p.title} ${p.handle} ${p.body ?? ''} ${p.excerpt ?? ''}`.toLowerCase().includes(normalizedSearch)
    );
  }, [pages, normalizedSearch]);

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to manage pages.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f0f0f1]">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="mt-1 text-sm text-gray-500">
              WordPress-style pages: visual editor, draft or published, featured image, excerpt, and parent page. URLs are{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/pages/your-slug</code>. Add links under{' '}
              <strong className="font-medium">Content → Menus</strong>.
            </p>
          </div>
          <Link
            href="/admin/content/pages/new"
            className="inline-flex items-center rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark"
          >
            Add new
          </Link>
        </div>
      </header>

      <main className="space-y-4 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {saving && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">Working…</div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminSearchFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search pages by title or content…"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No pages yet. Click <strong>Add new</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={`/admin/content/pages/${p.id}`}
                              className="font-medium text-gray-900 hover:text-mint"
                            >
                              {p.title}
                            </Link>
                            <span
                              className={`w-fit rounded-full px-2 py-0.5 text-xs ${p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {p.published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">/pages/{p.handle}</td>
                        <td className="px-4 py-3 text-gray-500">—</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(p.updated_at ?? p.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => void removePage(p.id)} className="text-sm text-red-600 hover:underline">
                            Trash
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
