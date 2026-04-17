'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useContentRoutes } from '@/context/ContentRoutesContext';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';
import {
  METAOBJECT_FIELD_TYPES,
  type MetaobjectDefinition,
  type MetaobjectFieldDefinition,
  type MetaobjectFieldType,
  parseMetaobject,
} from '@/lib/metaobjects';

type ContentResponse = {
  data: {
    metaobjects: MetaobjectDefinition[];
  };
};

function formatDate(input: string | null | undefined): string {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString();
}

/** Suggested API type string from a human-readable name (e.g. "Hero slides" → "hero.slides"). */
function suggestMetaobjectType(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');
}

type DraftField = MetaobjectFieldDefinition & { _local?: string };

export default function AdminContentMetaobjectsPage() {
  const routes = useContentRoutes();
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [definitions, setDefinitions] = useState<MetaobjectDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [draftFields, setDraftFields] = useState<DraftField[]>([]);

  const loadDefinitions = useCallback(async () => {
    if (!token || !currentStore) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    const raw = Array.isArray(res.data?.metaobjects) ? res.data.metaobjects : [];
    setDefinitions(raw.map(parseMetaobject).filter(Boolean) as MetaobjectDefinition[]);
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadDefinitions()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load metaobjects'))
      .finally(() => setLoading(false));
  }, [token, currentStore, loadDefinitions]);

  const addDraftField = () => {
    setDraftFields((rows) => [
      ...rows,
      {
        key: '',
        label: '',
        type: 'single_line_text',
        required: false,
        _local: crypto.randomUUID(),
      },
    ]);
  };

  const updateDraftField = (local: string, patch: Partial<DraftField>) => {
    setDraftFields((rows) => rows.map((r) => (r._local === local ? { ...r, ...patch } : r)));
  };

  const removeDraftField = (local: string) => {
    setDraftFields((rows) => rows.filter((r) => r._local !== local));
  };

  const createDefinition = async () => {
    const name = newName.trim();
    const type = newType.trim();
    if (!name || !type) {
      setError('Add a display name and a type. The type is a short ID (e.g. contact.page); it is filled automatically from the name if you leave the type field empty and tab out of the name field.');
      return;
    }
    const field_definitions = draftFields
      .map(({ key, label, type: ft, required }) => ({
        key: key.trim(),
        label: label.trim() || key.trim(),
        type: ft,
        required: Boolean(required),
      }))
      .filter((f) => f.key !== '');
    if (field_definitions.length === 0) {
      setError('Add at least one field with a machine key (e.g. title, headline).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest('/store/content/metaobjects', {
        method: 'POST',
        token,
        storeId: currentStore?.id,
        body: { name, type, field_definitions },
      });
      setNewName('');
      setNewType('');
      setDraftFields([]);
      setShowCreate(false);
      await loadDefinitions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create definition');
    } finally {
      setSaving(false);
    }
  };

  const removeDefinition = async (id: string) => {
    if (!window.confirm('Delete this definition and all of its entries?')) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/metaobjects/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadDefinitions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedSearch) return definitions;
    return definitions.filter((d) => {
      const fields = d.field_definitions.map((f) => `${f.key} ${f.label}`).join(' ');
      const entries = d.entries.map((e) => `${e.handle} ${JSON.stringify(e.values)}`).join(' ');
      return `${d.name} ${d.type} ${fields} ${entries}`.toLowerCase().includes(normalizedSearch);
    });
  }, [definitions, normalizedSearch]);

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to manage metaobjects.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metaobjects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Define structured content types, add entries, and load them on the storefront with{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">GET /storefront/metaobjects?store=…&amp;type=…</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {showCreate ? 'Close' : 'New definition'}
          </button>
        </div>
      </header>

      <main className="space-y-4 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {showCreate && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Create definition</h2>
            <p className="mt-1 text-sm text-gray-500">
              Type is a unique identifier (e.g. <code className="text-xs">hero.slide</code>). Field keys must start with a letter and use letters, numbers, and underscores.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={(e) => {
                  const nameVal = e.target.value;
                  setNewType((prev) => (prev.trim() ? prev : suggestMetaobjectType(nameVal) || prev));
                }}
                placeholder="Name (e.g. Hero slides)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Type (e.g. hero.slide)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Fields</h3>
                <button type="button" onClick={addDraftField} className="text-sm font-medium text-mint hover:underline">
                  + Add field
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {draftFields.length === 0 ? (
                  <p className="text-sm text-gray-500">No fields yet. Add at least one.</p>
                ) : (
                  draftFields.map((row) => (
                    <div key={row._local} className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 md:grid-cols-12 md:items-end">
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-gray-500">Key</label>
                        <input
                          value={row.key}
                          onChange={(e) => updateDraftField(row._local!, { key: e.target.value })}
                          placeholder="headline"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-gray-500">Label</label>
                        <input
                          value={row.label}
                          onChange={(e) => updateDraftField(row._local!, { label: e.target.value })}
                          placeholder="Headline"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-gray-500">Type</label>
                        <select
                          value={row.type}
                          onChange={(e) => updateDraftField(row._local!, { type: e.target.value as MetaobjectFieldType })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        >
                          {METAOBJECT_FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(row.required)}
                            onChange={(e) => updateDraftField(row._local!, { required: e.target.checked })}
                          />
                          Required
                        </label>
                      </div>
                      <div className="flex md:col-span-1 md:justify-end">
                        <button type="button" onClick={() => removeDraftField(row._local!)} className="text-sm text-red-600 hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void createDefinition()}
                disabled={saving}
                className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-70"
              >
                {saving ? 'Saving…' : 'Create definition'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminSearchFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search definitions and entries..."
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Definition</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fields</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Entries</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No metaobject definitions yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <Link
                            href={routes.metaobject(d.id)}
                            className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                          >
                            <div className="font-medium text-gray-900 group-hover:text-mint">{d.name}</div>
                            <div className="font-mono text-xs text-gray-500">{d.type}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.field_definitions.length}</td>
                        <td className="px-4 py-3 text-gray-600">{d.entries.length}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(d.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => void removeDefinition(d.id)} className="text-sm text-red-600 hover:underline">
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
