'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useContentRoutes } from '@/context/ContentRoutesContext';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';

type MenuItem = { id: string; label: string; url: string };
type ContentMenu = {
  id: string;
  name: string;
  handle: string;
  items: MenuItem[];
  created_at: string;
};

type ContentResponse = {
  data: {
    menus: ContentMenu[];
  };
};

function formatDate(input: string | null | undefined): string {
  if (!input) return '-';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString();
}

function itemsSummary(items: MenuItem[]): string {
  if (!items.length) return '-';
  const first = items.slice(0, 3).map((item) => item.label).join(', ');
  if (items.length <= 3) return first;
  return `${first}, +${items.length - 3} more`;
}

export default function AdminContentMenusPage() {
  const routes = useContentRoutes();
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [menus, setMenus] = useState<ContentMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuHandle, setMenuHandle] = useState('');
  const [menuItemsRaw, setMenuItemsRaw] = useState('');

  const loadMenus = useCallback(async () => {
    if (!token || !currentStore) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    setMenus(Array.isArray(res.data?.menus) ? res.data.menus : []);
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadMenus()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load menus'))
      .finally(() => setLoading(false));
  }, [token, currentStore, loadMenus]);

  const addMenu = async () => {
    const name = menuName.trim();
    const handle = menuHandle.trim();
    if (!name || !handle) {
      setError('Menu name and handle are required.');
      return;
    }

    const items = menuItemsRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split('|').map((v) => v.trim());
        return { label: label || 'Untitled', url: url || '/' };
      });

    setSaving(true);
    setError(null);
    try {
      await apiRequest('/store/content/menus', {
        method: 'POST',
        token,
        storeId: currentStore?.id,
        body: { name, handle, items },
      });
      setMenuName('');
      setMenuHandle('');
      setMenuItemsRaw('');
      setShowCreate(false);
      await loadMenus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create menu');
    } finally {
      setSaving(false);
    }
  };

  const removeMenu = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/menus/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadMenus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete menu');
    } finally {
      setSaving(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMenus = useMemo(() => {
    if (!normalizedSearch) return menus;
    return menus.filter((menu) => {
      const allItems = (menu.items ?? []).map((item) => `${item.label} ${item.url}`).join(' ');
      return `${menu.name} ${menu.handle} ${allItems}`.toLowerCase().includes(normalizedSearch);
    });
  }, [menus, normalizedSearch]);

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to manage menus.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">✎</span>
            <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {showCreate ? 'Close' : 'Create menu'}
          </button>
        </div>
      </header>

      <main className="space-y-4 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {showCreate && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Create menu</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Menu name (e.g. Main menu)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                value={menuHandle}
                onChange={(e) => setMenuHandle(e.target.value)}
                placeholder="Handle (e.g. main-menu)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={menuItemsRaw}
              onChange={(e) => setMenuItemsRaw(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder={'Menu items, one per line: Label|/url\nExample: Home|/\nCatalog|/products'}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void addMenu()}
                disabled={saving}
                className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save menu'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminSearchFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search menus..."
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-sm text-gray-500">Loading menus...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Menu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Menu items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMenus.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        No menus found.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((menu) => (
                      <tr key={menu.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <Link
                            href={routes.menu(menu.id)}
                            className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                          >
                            <div className="font-medium text-gray-900 group-hover:text-mint">{menu.name}</div>
                            <div className="text-xs text-gray-500">{menu.handle}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{itemsSummary(menu.items ?? [])}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(menu.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void removeMenu(menu.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
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
