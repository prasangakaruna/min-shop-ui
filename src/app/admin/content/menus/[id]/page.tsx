'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import MenuLinkPicker from '@/components/admin/MenuLinkPicker';

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

type DraftItem = { id: string; label: string; url: string; isDraft?: boolean; linkSummary?: string };

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `item_${Math.random().toString(36).slice(2, 12)}`;
}

function DragHandle() {
  return (
    <span className="inline-flex cursor-grab select-none text-gray-400 active:cursor-grabbing" title="Drag to reorder">
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <circle cx="7" cy="5" r="1.5" />
        <circle cx="13" cy="5" r="1.5" />
        <circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="15" r="1.5" />
        <circle cx="13" cy="15" r="1.5" />
      </svg>
    </span>
  );
}

export default function AdminMenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = typeof params.id === 'string' ? params.id : '';

  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuMissing, setMenuMissing] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [rows, setRows] = useState<DraftItem[]>([]);

  const loadMenu = useCallback(async () => {
    if (!token || !currentStore || !menuId) return null;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    const menus = Array.isArray(res.data?.menus) ? res.data.menus : [];
    return menus.find((m) => m.id === menuId) ?? null;
  }, [token, currentStore, menuId]);

  useEffect(() => {
    if (!menuId) {
      setLoading(false);
      setMenuMissing(true);
      return;
    }
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadMenu()
      .then((menu) => {
        if (!menu) {
          setMenuMissing(true);
          setName('');
          setHandle('');
          setRows([]);
          return;
        }
        setMenuMissing(false);
        setName(menu.name);
        setHandle(menu.handle);
        setRows(
          (menu.items ?? []).map((i) => ({
            id: i.id,
            label: i.label,
            url: i.url,
          }))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load menu'))
      .finally(() => setLoading(false));
  }, [token, currentStore, menuId, loadMenu]);

  const persistItems = useMemo(
    () =>
      rows
        .filter((r) => !r.isDraft && (r.label.trim() || r.url.trim()))
        .map((r) => ({ id: r.id, label: r.label.trim() || 'Untitled', url: r.url.trim() || '/' })),
    [rows]
  );

  const save = async () => {
    if (!token || !currentStore || !menuId) return;
    const n = name.trim();
    const h = handle.trim();
    if (!n || !h) {
      setError('Name and handle are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const items = rows
        .filter((r) => !r.isDraft)
        .map((r) => ({
          id: r.id,
          label: r.label.trim() || 'Untitled',
          url: r.url.trim() || '/',
        }));
      await apiRequest(`/store/content/menus/${menuId}`, {
        method: 'PUT',
        token,
        storeId: currentStore.id,
        body: { name: n, handle: h, items },
      });
      await loadMenu().then((menu) => {
        if (menu) {
          setName(menu.name);
          setHandle(menu.handle);
          setRows(
            (menu.items ?? []).map((i) => ({
              id: i.id,
              label: i.label,
              url: i.url,
            }))
          );
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const duplicateMenu = async () => {
    if (!token || !currentStore) return;
    const items = persistItems.map(({ label, url }) => ({ label, url }));
    setDuplicating(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: ContentMenu }>('/store/content/menus', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: {
          name: `Copy of ${name.trim() || 'Menu'}`,
          handle: `${handle.trim() || 'menu'}-copy-${Date.now().toString(36)}`,
          items,
        },
      });
      const newId = res.data?.id;
      if (newId) router.push(`/admin/content/menus/${newId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to duplicate menu');
    } finally {
      setDuplicating(false);
    }
  };

  const addDraftRow = () => {
    setRows((prev) => [...prev, { id: newId(), label: '', url: '', isDraft: true }]);
  };

  const commitDraft = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isDraft: false } : r))
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, patch: Partial<DraftItem>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleRowDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRowDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = Number.parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(from) || from === targetIndex) return;
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to edit menus.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50/60">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  if (!loading && menuMissing) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Menu not found.
        </div>
        <Link href="/admin/content/menus" className="mt-4 inline-block text-sm text-mint hover:underline">
          ← Back to Menus
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100/80 pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/admin/content/menus" className="hover:text-gray-900">
              Menus
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">{name || 'Menu'}</span>
          </div>
          <button
            type="button"
            onClick={() => void duplicateMenu()}
            disabled={duplicating || saving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Menu name"
          />
          <p className="mt-2 text-sm text-gray-500">
            Handle: <span className="font-mono text-gray-700">{handle || '—'}</span>
          </p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">Handle (URL key)</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
            placeholder="main-menu"
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Menu items</h2>
          <div className="mt-4 space-y-2">
            {rows.map((row, index) => (
              <div
                key={row.id}
                draggable
                onDragStart={handleRowDragStart(index)}
                onDragOver={handleRowDragOver}
                onDrop={handleRowDrop(index)}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2 py-2"
              >
                <DragHandle />
                <input
                  value={row.label}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder="e.g., About us"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="sr-only">Link</span>
                  <MenuLinkPicker
                    value={row.url}
                    displayOverride={row.linkSummary}
                    onChange={(url, opts) =>
                      updateRow(index, { url, linkSummary: opts?.display })
                    }
                    token={token}
                    storeId={currentStore?.id ?? null}
                    storeSlug={currentStore?.slug}
                  />
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer select-none hover:text-gray-700">Edit URL directly</summary>
                    <input
                      value={row.url}
                      onChange={(e) => updateRow(index, { url: e.target.value, linkSummary: undefined })}
                      placeholder="/path or https://…"
                      className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1.5 font-mono text-[11px] text-gray-800"
                    />
                  </details>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {row.isDraft ? (
                    <button
                      type="button"
                      title="Add item"
                      onClick={() => commitDraft(index)}
                      className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => removeRow(index)}
                    className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDraftRow}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            Add menu item
          </button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur sm:pl-[calc(16rem+1rem)]">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
