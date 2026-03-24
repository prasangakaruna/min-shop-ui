'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiRequest, type StoreSummary } from '@/lib/api';

type LocationStatus = 'all' | 'active' | 'inactive' | 'physical';

type StoreLocation = {
  id: string;
  name?: string;
  is_active?: boolean;
  is_physical_storefront?: boolean;
};

type PosIntegrationConfig = {
  enabled?: boolean;
  base_url?: string | null;
  api_key?: string | null;
  auto_sync?: boolean;
};

function StatusPill({ status }: { status: 'Active' | 'Inactive' }) {
  const cls = status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function AdminLocationsSection(props: { token: string | null; store: StoreSummary | null; storeId: number }) {
  const { token, store, storeId } = props;
  const router = useRouter();
  const { data: session } = useSession();

  // Use token from props (preferred). Fall back to session token in case props change.
  const effectiveToken = token ?? (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [posIntegration, setPosIntegration] = useState<PosIntegrationConfig | null>(null);

  const [tab, setTab] = useState<LocationStatus>('all');
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: 'Shop location',
    is_active: true,
    is_physical_storefront: false,
  });

  async function loadAll() {
    if (!effectiveToken) return;
    setError(null);
    setLoading(true);
    try {
      const locRes = await apiRequest<{ data: StoreLocation[] }>('/store/locations', {
        token: effectiveToken,
        storeId,
      });
      setLocations(locRes.data ?? []);
    } catch (e) {
      setLocations([]);
      setError(e instanceof Error ? e.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveToken, storeId]);

  useEffect(() => {
    if (!effectiveToken) return;
    let cancelled = false;
    apiRequest<PosIntegrationConfig>('/store/pos-integration', { token: effectiveToken, storeId })
      .then((cfg) => {
        if (cancelled) return;
        setPosIntegration(cfg ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setPosIntegration(null);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveToken, storeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((l) => {
      const name = (l.name ?? '').toLowerCase();
      const matchesSearch = q ? name.includes(q) : true;
      if (!matchesSearch) return false;

      if (tab === 'active') return Boolean(l.is_active);
      if (tab === 'inactive') return !Boolean(l.is_active);
      if (tab === 'physical') return Boolean(l.is_physical_storefront);
      return true;
    });
  }, [locations, tab, search]);

  const posInstalled = useMemo(() => {
    if (!posIntegration) return false;
    // Backend returns [] when no POS integration config exists.
    if (Array.isArray(posIntegration)) return false;
    const enabled = (posIntegration as any).enabled;
    const baseUrl = (posIntegration as any).base_url;
    return Boolean(enabled ?? false) || Boolean(baseUrl);
  }, [posIntegration]);

  const handleCreate = async () => {
    if (!effectiveToken) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<{ data: StoreLocation }>(
        '/store/locations',
        { method: 'POST', token: effectiveToken, storeId, body: newLocation as any }
      );
      setShowAdd(false);
      setNewLocation({
        name: 'Shop location',
        is_active: true,
        is_physical_storefront: false,
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
          {error}
        </div>
      )}

      {/* Locations card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
            <p className="mt-1 text-sm text-gray-500">Manage where you sell and fulfill orders.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={!effectiveToken || saving}
          >
            Add location
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1 text-xs font-medium text-gray-600">
            {(['all', 'active', 'inactive', 'physical'] as LocationStatus[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1 transition ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'all' ? 'All locations' : t === 'active' ? 'Active' : t === 'inactive' ? 'Inactive' : 'Physical storefront'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-[420px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pl-9 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-sm text-gray-500">
                        No locations found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((l) => {
                      const status = Boolean(l.is_active) ? 'Active' : 'Inactive';
                      return (
                        <tr key={l.id}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{l.name ?? '—'}</div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {l.is_physical_storefront ? 'Physical storefront' : 'Online store only'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusPill status={status as 'Active' | 'Inactive'} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* POS subscriptions card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Point of Sale subscriptions
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Start selling in person from any location with the in-person selling features included in your plan
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint/15">
                <span className="text-mint">
                  $
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Point of Sale</p>
                <p className="mt-0.5 text-xs text-gray-500">{posInstalled ? 'Installed' : 'Not installed'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/admin/pro/integration?store=${storeId}`)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Open
            </button>
          </div>
        </div>
      </section>

      {/* Add location modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
            <h3 className="text-base font-semibold text-gray-900">Add location</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new location and set its status.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location name</label>
                <input
                  value={newLocation.name}
                  onChange={(e) => setNewLocation((s) => ({ ...s, name: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="mt-0.5 text-xs text-gray-500">Location can receive orders.</p>
                </div>
                <Toggle
                  checked={newLocation.is_active}
                  onChange={(next) => setNewLocation((s) => ({ ...s, is_active: next }))}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Physical storefront</p>
                  <p className="mt-0.5 text-xs text-gray-500">Show as an in-person location.</p>
                </div>
                <Toggle
                  checked={newLocation.is_physical_storefront}
                  onChange={(next) => setNewLocation((s) => ({ ...s, is_physical_storefront: next }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="flex-1 rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60"
                disabled={saving || !effectiveToken}
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 ${
        checked ? 'bg-mint/20' : 'bg-gray-100'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

