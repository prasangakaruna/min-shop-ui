'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';

type DefaultCategoryRow = { id: string; name: string };

type CustomCategoryRow = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  parent_id: number | null;
  parent_default_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CategoriesResponse = {
  defaults: DefaultCategoryRow[];
  custom: CustomCategoryRow[];
};

type SubContext =
  | null
  | { kind: 'default'; defaultId: string; label: string }
  | { kind: 'custom'; parentId: number; label: string };

function categoryPath(c: CustomCategoryRow, custom: CustomCategoryRow[], defaults: DefaultCategoryRow[]): string {
  const names: string[] = [];
  let cur: CustomCategoryRow | undefined = c;
  let guard = 0;
  while (cur && guard++ < 50) {
    names.unshift(cur.name);
    if (cur.parent_id) {
      const parentId: number = cur.parent_id;
      cur = custom.find((x) => x.id === parentId);
    } else if (cur.parent_default_id) {
      const defaultId: string = cur.parent_default_id;
      const d = defaults.find((x) => x.id === defaultId);
      names.unshift(d?.name ?? defaultId);
      break;
    } else {
      break;
    }
  }
  return names.join(' › ');
}

function matchesQuery(text: string, q: string): boolean {
  if (!q.trim()) return true;
  const n = text.toLowerCase();
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return words.every((w) => n.includes(w));
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [defaults, setDefaults] = useState<DefaultCategoryRow[]>([]);
  const [custom, setCustom] = useState<CustomCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [standardQuery, setStandardQuery] = useState('');
  const [yourQuery, setYourQuery] = useState('');
  const [showNewRoot, setShowNewRoot] = useState(false);

  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSort, setNewSort] = useState('0');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSort, setEditSort] = useState('0');

  const [subContext, setSubContext] = useState<SubContext>(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subSort, setSubSort] = useState('0');

  const customSlugSet = useMemo(() => new Set(custom.map((c) => c.slug)), [custom]);

  const sortedCustom = useMemo(() => {
    return [...custom].sort((a, b) =>
      categoryPath(a, custom, defaults).localeCompare(categoryPath(b, custom, defaults), undefined, {
        sensitivity: 'base',
      })
    );
  }, [custom, defaults]);

  const filteredYour = useMemo(() => {
    const q = yourQuery.trim();
    if (!q) return sortedCustom;
    return sortedCustom.filter((row) => {
      const path = categoryPath(row, custom, defaults);
      return matchesQuery(`${path} ${row.slug}`, q);
    });
  }, [sortedCustom, yourQuery, custom, defaults]);

  const subsByDefaultId = useMemo(() => {
    const m = new Map<string, CustomCategoryRow[]>();
    for (const c of custom) {
      if (!c.parent_default_id) continue;
      const k = c.parent_default_id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    }
    return m;
  }, [custom]);

  const filteredDefaults = useMemo(() => {
    return defaults.filter((d) => matchesQuery(`${d.name} ${d.id}`, standardQuery));
  }, [defaults, standardQuery]);

  /** So the left-column search also surfaces custom rows (users often expect one combined list). */
  const customMatchingStandardSearch = useMemo(() => {
    const q = standardQuery.trim();
    if (!q) return [];
    return sortedCustom.filter((row) => {
      const path = categoryPath(row, custom, defaults);
      return matchesQuery(`${path} ${row.slug} ${row.name}`, q);
    });
  }, [sortedCustom, standardQuery, custom, defaults]);

  const load = useCallback(() => {
    if (!token || !currentStore) return;
    setLoading(true);
    setError(null);
    apiRequest<CategoriesResponse>('/store/categories', { token, storeId: currentStore.id })
      .then((r) => {
        setDefaults(r.defaults ?? []);
        setCustom(r.custom ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    load();
  }, [token, currentStore, load]);

  const addFromDefault = async (row: DefaultCategoryRow) => {
    if (!token || !currentStore) return;
    if (customSlugSet.has(row.id)) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<CustomCategoryRow>('/store/categories', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: { name: row.name, slug: row.id, sort_order: 0 },
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add category');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const body: { name: string; sort_order: number; slug?: string } = {
        name,
        sort_order: parseInt(newSort, 10) || 0,
      };
      const s = newSlug.trim();
      if (s) body.slug = s;
      await apiRequest<CustomCategoryRow>('/store/categories', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      setNewName('');
      setNewSlug('');
      setNewSort('0');
      setShowNewRoot(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create category');
    } finally {
      setSaving(false);
    }
  };

  const submitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore || !subContext) return;
    const name = subName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const body: {
        name: string;
        sort_order: number;
        slug?: string;
        parent_id?: number;
        parent_default_id?: string;
      } = {
        name,
        sort_order: parseInt(subSort, 10) || 0,
      };
      const s = subSlug.trim();
      if (s) body.slug = s;
      if (subContext.kind === 'default') {
        body.parent_default_id = subContext.defaultId;
      } else {
        body.parent_id = subContext.parentId;
      }
      await apiRequest<CustomCategoryRow>('/store/categories', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      setSubContext(null);
      setSubName('');
      setSubSlug('');
      setSubSort('0');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create subcategory');
    } finally {
      setSaving(false);
    }
  };

  const cancelSubForm = () => {
    setSubContext(null);
    setSubName('');
    setSubSlug('');
    setSubSort('0');
  };

  const startEdit = (row: CustomCategoryRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditSort(String(row.sort_order ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    if (!token || !currentStore) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<CustomCategoryRow>(`/store/categories/${id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: { name, sort_order: parseInt(editSort, 10) || 0 },
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CustomCategoryRow) => {
    if (!token || !currentStore) return;
    if (
      !confirm(
        `Remove “${row.name}”? Subcategories under it are removed too. You cannot remove if this slug or a subcategory slug is still used on products.`
      )
    )
      return;
    setError(null);
    try {
      await apiRequest(`/store/categories/${row.id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore.id,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-900">Select a store</p>
          <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-mint-dark hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const btnPrimary =
    'inline-flex items-center justify-center rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-mint-dark disabled:pointer-events-none disabled:opacity-40';
  const btnSecondary =
    'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40';
  const btnSmall =
    'inline-flex items-center justify-center rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium transition-colors';
  const btnSub = `${btnSmall} bg-teal-50 text-teal-800 hover:bg-teal-100`;
  const btnUse = `${btnSmall} bg-gray-100 text-gray-800 hover:bg-gray-200`;
  const btnEdit = `${btnSmall} text-gray-700 hover:bg-gray-100`;
  const btnDanger = `${btnSmall} text-red-600 hover:bg-red-50`;

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-gray-100/80">
      <header className="border-b border-gray-200/80 bg-white/90 px-4 py-6 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Products</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
              Organize how products are grouped. Standard types are suggestions; your rows control labels in product
              pickers (<span className="font-mono text-[11px] text-gray-500">Parent › Child</span>).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {custom.length} in your store
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {defaults.length} standard
            </span>
            <Link
              href="/admin/products/add"
              className={`${btnPrimary} !py-2.5 sm:ml-1`}
            >
              Add product
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {subContext ? (
          <section className="overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-md ring-1 ring-teal-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 bg-gradient-to-r from-teal-50/90 to-white px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">New subcategory</h2>
                <p className="mt-0.5 text-xs text-gray-600">
                  Under <span className="font-semibold text-gray-800">{subContext.label}</span>
                </p>
              </div>
              <button type="button" onClick={cancelSubForm} className={btnSecondary}>
                Close
              </button>
            </div>
            <form onSubmit={submitSubcategory} className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="sub-name" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Display name
                </label>
                <input
                  id="sub-name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-mint focus:bg-white focus:ring-2 focus:ring-mint/25"
                  placeholder="e.g. Smartphones"
                  required
                />
              </div>
              <div>
                <label htmlFor="sub-slug" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Slug <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="sub-slug"
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 font-mono text-sm outline-none focus:border-mint focus:bg-white focus:ring-2 focus:ring-mint/25"
                  placeholder="auto from name"
                />
              </div>
              <div>
                <label htmlFor="sub-sort" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Sort order
                </label>
                <input
                  id="sub-sort"
                  type="number"
                  min={0}
                  value={subSort}
                  onChange={(e) => setSubSort(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-mint focus:bg-white focus:ring-2 focus:ring-mint/25"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button type="submit" disabled={saving || !token} className={btnPrimary}>
                  {saving ? 'Saving…' : 'Create subcategory'}
                </button>
                <button type="button" onClick={cancelSubForm} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Standard categories</h2>
                <p className="text-xs text-gray-500">
                  Mint’s default list only — categories <span className="font-medium text-gray-600">you create</span> always
                  live in <span className="font-medium text-gray-600">Your categories</span> (right). The search below also
                  highlights your matches when they fit the same text.
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={standardQuery}
                  onChange={(e) => setStandardQuery(e.target.value)}
                  placeholder="Filter standards (+ your matches)"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition-shadow focus:border-mint focus:ring-2 focus:ring-mint/20"
                  aria-label="Search standard categories and surface matching custom categories"
                />
              </div>
            </div>

            {standardQuery.trim() ? (
              customMatchingStandardSearch.length > 0 ? (
                <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 to-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-bold text-teal-900">
                    Your categories matching &quot;{standardQuery.trim()}&quot;
                  </p>
                  <p className="mt-0.5 text-[11px] text-teal-800/80">
                    These are the same rows as in the right column — shown here so this search feels complete.
                  </p>
                  <ul className="mt-2 space-y-2">
                    {customMatchingStandardSearch.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-1 rounded-lg border border-teal-100 bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {categoryPath(row, custom, defaults)}
                          </p>
                          <p className="font-mono text-[11px] text-gray-500">{row.slug}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          <button type="button" onClick={() => startEdit(row)} className={btnEdit}>
                            Edit
                          </button>
                          <button type="button" onClick={() => remove(row)} className={btnDanger}>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : custom.length > 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  No <strong className="font-medium">custom</strong> category matches &quot;{standardQuery.trim()}&quot;. The
                  list below is standard types only — your own categories are in the right panel.
                </p>
              ) : null
            ) : (
              <p className="text-[11px] leading-relaxed text-gray-500">
                Custom roots (e.g. &quot;test categories&quot;) only appear under <strong className="font-medium text-gray-600">Your categories</strong> →
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
              {loading ? (
                <div className="space-y-0 divide-y divide-gray-100 p-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse px-4 py-4">
                      <div className="h-4 w-48 rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-32 rounded bg-gray-50" />
                    </div>
                  ))}
                </div>
              ) : filteredDefaults.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">No categories match your search.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredDefaults.map((d) => {
                    const has = customSlugSet.has(d.id);
                    const subs = subsByDefaultId.get(d.id) ?? [];
                    return (
                      <li key={d.id} className="bg-white">
                        <details className="group">
                          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3.5 transition-colors marker:hidden hover:bg-gray-50 sm:flex-nowrap sm:px-5 [&::-webkit-details-marker]:hidden">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-transform group-open:rotate-90"
                              aria-hidden
                            >
                              ▸
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">{d.name}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-gray-500">{d.id}</p>
                            </div>
                            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
                              <button
                                type="button"
                                disabled={saving || !token}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSubContext({ kind: 'default', defaultId: d.id, label: d.name });
                                  setSubName('');
                                  setSubSlug('');
                                  setSubSort('0');
                                }}
                                className={btnSub}
                              >
                                + Subcategory
                              </button>
                              {has ? (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
                                  In your store
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving || !token}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void addFromDefault(d);
                                  }}
                                  className={btnUse}
                                >
                                  Use in store
                                </button>
                              )}
                            </div>
                          </summary>
                          <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5 sm:pl-16">
                            {subs.length === 0 ? (
                              <p className="text-xs text-gray-500">No subcategories yet — use &quot;+ Subcategory&quot; above.</p>
                            ) : (
                              <ul className="space-y-2">
                                {subs.map((s) => (
                                  <li
                                    key={s.id}
                                    className="flex flex-col gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                      <p className="font-mono text-[11px] text-gray-500">{s.slug}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      <button
                                        type="button"
                                        disabled={saving || !token}
                                        onClick={() => {
                                          setSubContext({
                                            kind: 'custom',
                                            parentId: s.id,
                                            label: categoryPath(s, custom, defaults),
                                          });
                                          setSubName('');
                                          setSubSlug('');
                                          setSubSort('0');
                                        }}
                                        className={btnSub}
                                      >
                                        + Sub
                                      </button>
                                      <button type="button" onClick={() => startEdit(s)} className={btnEdit}>
                                        Edit
                                      </button>
                                      <button type="button" onClick={() => remove(s)} className={btnDanger}>
                                        Remove
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your categories</h2>
                  <p className="mt-1 text-xs text-gray-500">Everything you created — search, edit, or nest further.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewRoot((v) => !v)}
                  className={`shrink-0 ${btnPrimary}`}
                >
                  {showNewRoot ? '− Hide' : '+ New root'}
                </button>
              </div>

              {showNewRoot ? (
                <form onSubmit={handleCreateCustom} className="mt-5 space-y-4 border-t border-gray-100 pt-5">
                  <p className="text-xs text-gray-600">A root category not tied to a standard type.</p>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Name</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                      placeholder="e.g. Regional specials"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Slug</label>
                      <input
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                        placeholder="optional"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Sort</label>
                      <input
                        type="number"
                        min={0}
                        value={newSort}
                        onChange={(e) => setNewSort(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={saving || !token} className={`w-full ${btnPrimary}`}>
                    {saving ? 'Saving…' : 'Create root category'}
                  </button>
                </form>
              ) : null}

              <div className={showNewRoot ? 'mt-6 border-t border-gray-100 pt-5' : 'mt-5'}>
                <div className="relative mb-3">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={yourQuery}
                    onChange={(e) => setYourQuery(e.target.value)}
                    placeholder="Filter your categories…"
                    className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>

                {loading ? (
                  <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                ) : custom.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                    No custom rows yet. Add a subcategory from the standard list or create a root.
                  </p>
                ) : filteredYour.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">No matches.</p>
                ) : (
                  <ul className="max-h-[min(520px,55vh)] space-y-2 overflow-y-auto pr-1">
                    {filteredYour.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:border-gray-200 hover:bg-white"
                      >
                        {editingId === row.id ? (
                          <div className="space-y-2">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={0}
                                value={editSort}
                                onChange={(e) => setEditSort(e.target.value)}
                                className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                              />
                              <button type="button" disabled={saving} onClick={() => saveEdit(row.id)} className={btnPrimary}>
                                Save
                              </button>
                              <button type="button" onClick={cancelEdit} className={btnSecondary}>
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400">{categoryPath({ ...row, name: editName }, custom, defaults)}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold leading-snug text-gray-900">
                              {categoryPath(row, custom, defaults)}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-gray-500">{row.slug}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSubContext({
                                    kind: 'custom',
                                    parentId: row.id,
                                    label: categoryPath(row, custom, defaults),
                                  });
                                  setSubName('');
                                  setSubSlug('');
                                  setSubSort('0');
                                }}
                                className={btnSub}
                              >
                                + Sub
                              </button>
                              <button type="button" onClick={() => startEdit(row)} className={btnEdit}>
                                Edit
                              </button>
                              <button type="button" onClick={() => remove(row)} className={btnDanger}>
                                Remove
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
