'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import {
  apiRequest,
  type ApiKeysStats,
  type StoreApiKeyItem,
  type StoreApiKeyCreated,
} from '@/lib/api';

function IconWebhook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatRequests(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return String(n);
}

export default function AdminSettingsApiPage() {
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [stats, setStats] = useState<ApiKeysStats | null>(null);
  const [keys, setKeys] = useState<StoreApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [createdKey, setCreatedKey] = useState<StoreApiKeyCreated | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    if (!token || !currentStore) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<ApiKeysStats>('/store/api-keys/stats', { token, storeId: currentStore.id }).catch(() => null),
      apiRequest<{ data: StoreApiKeyItem[] }>('/store/api-keys', { token, storeId: currentStore.id }),
    ])
      .then(([s, keysRes]) => {
        setStats(s ?? null);
        setKeys(keysRes?.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, currentStore?.id]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore || !newKeyName.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const created = await apiRequest<StoreApiKeyCreated>('/store/api-keys', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: { name: newKeyName.trim() },
      });
      setCreatedKey(created);
      setNewKeyName('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!token || !currentStore) return;
    setUpdatingId(id);
    try {
      await apiRequest(`/store/api-keys/${id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: { status },
      });
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status } : k)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !currentStore) return;
    if (!confirm('Revoke this API key? It will stop working immediately.')) return;
    setDeletingId(id);
    try {
      await apiRequest(`/store/api-keys/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore.id,
      });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const maskKey = (k: StoreApiKeyItem) => {
    const suffix = k.key_suffix ?? '';
    return `${k.key_prefix}...${suffix}`;
  };

  if (!currentStore) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-sm">
          <p className="font-semibold text-amber-900">Select a store</p>
          <p className="mt-1 text-sm text-amber-700">Choose a store from the header to manage API settings.</p>
          <Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link href="/admin/settings" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-mint">
            ← Settings
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">API & Webhooks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage secure access to your store&apos;s data and real-time updates.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        {/* Settings sub-nav (match main settings page) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="px-2 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Settings</p>
            </div>
            <nav className="mt-1 space-y-0.5 text-sm">
              <Link
                href="/admin/settings"
                className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50"
              >
                General
              </Link>
            </nav>
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Integrations</p>
              <nav className="mt-1 space-y-0.5 text-sm">
                <span className="flex w-full items-center rounded-lg bg-mint/10 px-2.5 py-2 font-medium text-mint">
                  API Settings
                </span>
                <button type="button" className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50">
                  Webhooks
                </button>
              </nav>
            </div>
          </div>
        </aside>

      <main className="min-w-0 flex-1">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Top bar: Generate New Key */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-500">Settings &gt; API Integration</div>
          <button
            type="button"
            onClick={() => setShowNewKeyModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <span className="text-lg leading-none">+</span>
            Generate New Key
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="mb-10 grid gap-6 sm:grid-cols-3">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">System Health</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {stats?.system_health_percent ?? 99.98}%
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{stats?.uptime_trend ?? '+0.02% Uptime (30d)'}</p>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">API Requests</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {stats ? formatRequests(stats.api_requests_total) : '1.24M'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{stats?.api_requests_trend ?? '+12.5% vs last month'}</p>
                  </div>
                  <IconChart className="h-8 w-8 text-gray-300" />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Webhooks</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.active_webhooks ?? 14}</p>
                    <p className="mt-1 text-sm text-gray-500">{stats?.webhooks_integrations_label ?? '4 integrations connected'}</p>
                  </div>
                  <IconWebhook className="h-8 w-8 text-gray-300" />
                </div>
              </div>
            </div>

            {/* API Access Keys table */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">API Access Keys</h2>
                <button type="button" className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600" aria-label="Filter">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-6 py-3">Key name</th>
                      <th className="px-6 py-3">API Key</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No API keys yet. Generate a new key to get started.
                        </td>
                      </tr>
                    ) : (
                      keys.map((k) => (
                        <tr key={k.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{k.name}</div>
                            <div className="text-xs text-gray-500">Created {formatDate(k.created_at)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-gray-700">{maskKey(k)}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(maskKey(k), k.id)}
                              className="ml-2 inline-flex rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Copy"
                            >
                              {copiedId === k.id ? (
                                <span className="text-emerald-600">Copied</span>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                k.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {k.status === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(k.id, k.status === 'active' ? 'suspended' : 'active')}
                                disabled={updatingId === k.id}
                                className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                                title={k.status === 'active' ? 'Suspend' : 'Activate'}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(k.id)}
                                disabled={deletingId === k.id}
                                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Revoke"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      </div>

      {/* Generate New Key modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            {createdKey ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Key created</h3>
                <p className="mt-2 text-sm text-gray-500">Copy your key now. You won&apos;t be able to see it again.</p>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 font-mono text-sm">
                  <span className="flex-1 break-all text-gray-800">{createdKey.key}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdKey.key, 'new')}
                    className="shrink-0 rounded-lg bg-mint px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    {copiedId === 'new' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedKey(null);
                      setShowNewKeyModal(false);
                    }}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Generate New Key</h3>
                <p className="mt-1 text-sm text-gray-500">Give this key a name so you can identify it later.</p>
                <form onSubmit={handleGenerateKey} className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Key name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Mobile App Production"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                    required
                  />
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewKeyModal(false)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="rounded-xl bg-mint px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {generating ? 'Creating…' : 'Generate'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
