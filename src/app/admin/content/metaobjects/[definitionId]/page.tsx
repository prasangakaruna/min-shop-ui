'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useContentRoutes } from '@/context/ContentRoutesContext';
import { useStore } from '@/context/StoreContext';
import { apiRequest, getImageDisplayUrl } from '@/lib/api';
import {
  METAOBJECT_FIELD_TYPES,
  type MetaobjectDefinition,
  type MetaobjectFieldDefinition,
  type MetaobjectFieldType,
  datetimeLocalToIso,
  isoToDatetimeLocalValue,
  parseMetaobject,
} from '@/lib/metaobjects';

type ContentFile = {
  id: string;
  name: string;
  url: string;
  mime_type: string | null;
};

type ContentResponse = {
  data: {
    metaobjects: unknown[];
    files?: ContentFile[];
  };
};

type FieldRow = MetaobjectFieldDefinition & { _local: string };

function emptyValuesForFields(fds: MetaobjectFieldDefinition[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const f of fds) {
    if (f.type === 'boolean') o[f.key] = false;
    else if (f.type === 'number') o[f.key] = 0;
    else o[f.key] = '';
  }
  return o;
}

function EntryValueFields({
  fields,
  values,
  onChange,
  files,
}: {
  fields: MetaobjectFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  files: ContentFile[];
}) {
  const patch = (key: string, v: unknown) => onChange({ ...values, [key]: v });

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = values[f.key];
        switch (f.type) {
          case 'boolean':
            return (
              <label key={f.key} className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" checked={Boolean(v)} onChange={(e) => patch(f.key, e.target.checked)} />
                {f.label}
                {f.required ? <span className="text-red-500">*</span> : null}
              </label>
            );
          case 'multi_line_text':
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <textarea
                  value={typeof v === 'string' ? v : v == null ? '' : String(v)}
                  onChange={(e) => patch(f.key, e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            );
          case 'number': {
            let display = '';
            if (typeof v === 'number' && !Number.isNaN(v)) display = String(v);
            else if (v !== '' && v != null && String(v).trim() !== '') {
              const parsed = Number(v);
              if (!Number.isNaN(parsed)) display = String(parsed);
            }
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <input
                  type="number"
                  value={display}
                  onChange={(e) => patch(f.key, e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            );
          }
          case 'date':
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <input
                  type="datetime-local"
                  value={isoToDatetimeLocalValue(typeof v === 'string' ? v : '')}
                  onChange={(e) => patch(f.key, datetimeLocalToIso(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            );
          case 'file_reference':
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const url = e.target.value;
                    if (url) patch(f.key, url);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Pick from library…</option>
                  {files.map((file) => (
                    <option key={file.id} value={file.url}>
                      {file.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={typeof v === 'string' ? v : v == null ? '' : String(v)}
                  onChange={(e) => patch(f.key, e.target.value)}
                  placeholder="Or paste image/file URL"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                {typeof v === 'string' && v && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v) ? (
                  <img src={getImageDisplayUrl(v)} alt="" className="mt-2 max-h-24 rounded border border-gray-100 object-contain" />
                ) : null}
              </div>
            );
          case 'url':
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <input
                  type="url"
                  value={typeof v === 'string' ? v : v == null ? '' : String(v)}
                  onChange={(e) => patch(f.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            );
          default:
            return (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </label>
                <input
                  type="text"
                  value={typeof v === 'string' ? v : v == null ? '' : String(v)}
                  onChange={(e) => patch(f.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            );
        }
      })}
    </div>
  );
}

export default function AdminMetaobjectDefinitionPage() {
  const routes = useContentRoutes();
  const params = useParams();
  const definitionId = typeof params?.definitionId === 'string' ? params.definitionId : '';

  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [definition, setDefinition] = useState<MetaobjectDefinition | null>(null);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defName, setDefName] = useState('');
  const [defType, setDefType] = useState('');
  const [fieldRows, setFieldRows] = useState<FieldRow[]>([]);

  const [entryPanel, setEntryPanel] = useState<'new' | string | null>(null);
  const [entryHandle, setEntryHandle] = useState('');
  const [entryValues, setEntryValues] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    if (!token || !currentStore || !definitionId) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    const rawList = Array.isArray(res.data?.metaobjects) ? res.data.metaobjects : [];
    const found = rawList.map(parseMetaobject).find((d) => d?.id === definitionId) ?? null;
    setDefinition(found);
    if (found) {
      setDefName(found.name);
      setDefType(found.type);
      setFieldRows(
        found.field_definitions.map((f) => ({
          ...f,
          _local: f.key,
        }))
      );
    }
    const rawFiles = res.data?.files;
    setFiles(Array.isArray(rawFiles) ? rawFiles : []);
  }, [token, currentStore, definitionId]);

  useEffect(() => {
    if (!token || !currentStore || !definitionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, currentStore, definitionId, load]);

  const openNewEntry = () => {
    if (!definition) return;
    setEntryPanel('new');
    setEntryHandle('');
    setEntryValues(emptyValuesForFields(definition.field_definitions));
  };

  const openEditEntry = (entryId: string) => {
    if (!definition) return;
    const e = definition.entries.find((x) => x.id === entryId);
    if (!e) return;
    setEntryPanel(entryId);
    setEntryHandle(e.handle);
    const base = emptyValuesForFields(definition.field_definitions);
    setEntryValues({ ...base, ...e.values });
  };

  const saveDefinition = async () => {
    if (!definition || !token || !currentStore) return;
    const name = defName.trim();
    const type = defType.trim();
    if (!name || !type) {
      setError('Name and type are required.');
      return;
    }
    const field_definitions = fieldRows
      .map(({ key, label, type: ft, required }) => ({
        key: key.trim(),
        label: label.trim() || key.trim(),
        type: ft,
        required: Boolean(required),
      }))
      .filter((f) => f.key !== '');
    if (field_definitions.length === 0) {
      setError('Keep at least one field with a valid key.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/metaobjects/${definition.id}`, {
        method: 'PUT',
        token,
        storeId: currentStore.id,
        body: { name, type, field_definitions },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save definition');
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!definition || !token || !currentStore) return;
    setSaving(true);
    setError(null);
    try {
      if (entryPanel === 'new') {
        await apiRequest(`/store/content/metaobjects/${definition.id}/entries`, {
          method: 'POST',
          token,
          storeId: currentStore.id,
          body: { handle: entryHandle.trim(), values: entryValues },
        });
      } else if (entryPanel) {
        await apiRequest(`/store/content/metaobjects/${definition.id}/entries/${entryPanel}`, {
          method: 'PUT',
          token,
          storeId: currentStore.id,
          body: { handle: entryHandle.trim(), values: entryValues },
        });
      }
      setEntryPanel(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!definition || !token || !currentStore) return;
    if (!window.confirm('Delete this entry?')) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/metaobjects/${definition.id}/entries/${entryId}`, {
        method: 'DELETE',
        token,
        storeId: currentStore.id,
      });
      if (entryPanel === entryId) setEntryPanel(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete entry');
    } finally {
      setSaving(false);
    }
  };

  const addFieldRow = () => {
    setFieldRows((rows) => [
      ...rows,
      {
        key: '',
        label: '',
        type: 'single_line_text' as MetaobjectFieldType,
        required: false,
        _local: crypto.randomUUID(),
      },
    ]);
  };

  const updateFieldRow = (local: string, patch: Partial<MetaobjectFieldDefinition>) => {
    setFieldRows((rows) => rows.map((r) => (r._local === local ? { ...r, ...patch } : r)));
  };

  const removeFieldRow = (local: string) => {
    setFieldRows((rows) => rows.filter((r) => r._local !== local));
  };

  const storefrontHint = useMemo(() => {
    if (!currentStore?.slug || !defType) return '';
    return `GET /storefront/metaobjects?store=${encodeURIComponent(currentStore.slug)}&type=${encodeURIComponent(defType)}`;
  }, [currentStore?.slug, defType]);

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select a store first.</div>
      </div>
    );
  }

  if (!definitionId) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Invalid definition.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50/60 p-6">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="min-h-full bg-gray-50/60 p-6">
        <Link href={routes.metaobjects} className="text-sm text-mint hover:underline">
          ← Back to metaobjects
        </Link>
        <p className="mt-4 text-sm text-gray-600">Definition not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-6">
          <Link href={routes.metaobjects} className="text-sm text-mint hover:underline">
            ← Metaobjects
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{definition.name}</h1>
          <p className="mt-1 font-mono text-sm text-gray-500">{definition.type}</p>
          {storefrontHint ? (
            <p className="mt-2 text-xs text-gray-500">
              Storefront: <code className="rounded bg-gray-100 px-1 py-0.5">{storefrontHint}</code>
            </p>
          ) : null}
        </div>
      </header>

      <main className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Definition</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-500">Name</label>
              <input
                value={defName}
                onChange={(e) => setDefName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Type</label>
              <input
                value={defType}
                onChange={(e) => setDefType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-amber-700">Changing type updates the storefront query parameter.</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Fields</h3>
              <button type="button" onClick={addFieldRow} className="text-sm font-medium text-mint hover:underline">
                + Add field
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {fieldRows.map((row) => (
                <div key={row._local} className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500">Key</label>
                    <input
                      value={row.key}
                      onChange={(e) => updateFieldRow(row._local, { key: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500">Label</label>
                    <input
                      value={row.label}
                      onChange={(e) => updateFieldRow(row._local, { label: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500">Type</label>
                    <select
                      value={row.type}
                      onChange={(e) => updateFieldRow(row._local, { type: e.target.value as MetaobjectFieldType })}
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
                        onChange={(e) => updateFieldRow(row._local, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                  <div className="flex md:col-span-1 md:justify-end">
                    <button type="button" onClick={() => removeFieldRow(row._local)} className="text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void saveDefinition()}
              disabled={saving}
              className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save definition'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-gray-900">Entries</h2>
            <button
              type="button"
              onClick={openNewEntry}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add entry
            </button>
          </div>

          {entryPanel && (
            <div className="mt-4 rounded-xl border border-mint/30 bg-mint/5 p-4">
              <h3 className="text-sm font-semibold text-gray-900">{entryPanel === 'new' ? 'New entry' : 'Edit entry'}</h3>
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-500">Handle (optional, for stable URLs)</label>
                <input
                  value={entryHandle}
                  onChange={(e) => setEntryHandle(e.target.value)}
                  placeholder="e.g. summer-campaign"
                  className="mt-1 w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4">
                <EntryValueFields
                  fields={definition.field_definitions}
                  values={entryValues}
                  onChange={setEntryValues}
                  files={files}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveEntry()}
                  disabled={saving}
                  className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-70"
                >
                  {saving ? 'Saving…' : 'Save entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setEntryPanel(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Handle</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Preview</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {definition.entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  definition.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{e.handle || '—'}</td>
                      <td className="max-w-md truncate px-3 py-2 text-gray-600">{JSON.stringify(e.values)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => openEditEntry(e.id)} className="mr-3 text-mint hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => void deleteEntry(e.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
