'use client';

import { useCallback, useEffect, useState } from 'react';
import { MAINTENANCE_BYPASS_QUERY, type MaintenanceScope, type PlatformConfigClientDTO } from '@/lib/platformConfigShared';
import { MOCK_FLAGS } from '@/lib/systemConsoleMock';

type LoadState = 'idle' | 'loading' | 'error';

function scopeLabel(s: MaintenanceScope): string {
  return s === 'marketplace_home' ? 'Home only (/)' : 'Home + browse (/products, /search)';
}

export function PlatformConfigConsole() {
  const [load, setLoad] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [cfg, setCfg] = useState<PlatformConfigClientDTO | null>(null);
  const [bypassInput, setBypassInput] = useState('');
  const [bypassClear, setBypassClear] = useState(false);

  const refresh = useCallback(async () => {
    setLoad('loading');
    setLoadError(null);
    try {
      const r = await fetch('/api/system/platform-config', { method: 'GET' });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? r.statusText);
      }
      const data = (await r.json()) as { config: PlatformConfigClientDTO };
      setCfg(data.config);
      setBypassInput('');
      setBypassClear(false);
      setLoad('idle');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load');
      setLoad('error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setSaveError(null);
    try {
      const patch: Record<string, unknown> = {
        maintenanceMode: cfg.maintenanceMode,
        maintenanceTitle: cfg.maintenanceTitle,
        maintenanceMessage: cfg.maintenanceMessage,
        maintenanceEta: cfg.maintenanceEta,
        maintenanceWindowEnd: cfg.maintenanceWindowEnd,
        maintenanceScope: cfg.maintenanceScope,
        registrationPaused: cfg.registrationPaused,
        registrationMessage: cfg.registrationMessage,
      };
      if (bypassClear) {
        patch.maintenanceBypassSecret = '';
      } else if (bypassInput.trim() !== '') {
        patch.maintenanceBypassSecret = bypassInput.trim();
      }

      const r = await fetch('/api/system/platform-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? r.statusText);
      }
      const data = (await r.json()) as { config: PlatformConfigClientDTO };
      setCfg(data.config);
      setBypassInput('');
      setBypassClear(false);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2400);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (load === 'loading' || (load === 'idle' && !cfg)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
          Loading platform config…
        </div>
      </div>
    );
  }

  if (load === 'error' || !cfg) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
        {loadError ?? 'Could not load config.'}{' '}
        <button type="button" className="font-semibold text-mint-dark underline" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }

  const set = <K extends keyof PlatformConfigClientDTO>(key: K, value: PlatformConfigClientDTO[K]) => {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Control marketplace-wide behavior: maintenance for the public apex, registration pauses, and bypass links
            for stakeholders. Settings persist in <code className="rounded bg-gray-100 px-1 text-xs">data/platform-config.json</code>{' '}
            on this host.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedFlash ? (
            <span className="text-sm font-medium text-emerald-700" role="status">
              Saved
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {saveError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{saveError}</div>
      ) : null}

      {cfg.maintenanceForcedByEnv ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong className="font-semibold">MAINTENANCE_MODE</strong> is set in the environment — the marketplace is
          forced into maintenance until that variable is cleared or set to <code className="rounded bg-white/80 px-1">0</code> /{' '}
          <code className="rounded bg-white/80 px-1">false</code>. The toggle below still updates the saved file for when
          the env override is removed.
        </div>
      ) : null}

      {/* Maintenance */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Marketplace maintenance</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Applies only when there is <strong>no</strong> tenant store context (apex host without <code className="text-[11px]">?store=</code>).
            Subdomain storefronts keep working. Super admins always see the real site.
          </p>
        </div>
        <div className="space-y-5 p-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint"
              checked={cfg.maintenanceMode}
              onChange={(e) => set('maintenanceMode', e.target.checked)}
            />
            <span>
              <span className="font-semibold text-gray-900">Enable maintenance mode</span>
              <span className="mt-0.5 block text-sm text-gray-600">
                Visitors see a branded maintenance page instead of the marketplace home (and optionally browse routes).
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Headline</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={cfg.maintenanceTitle}
                onChange={(e) => set('maintenanceTitle', e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Scope</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={cfg.maintenanceScope}
                onChange={(e) => set('maintenanceScope', e.target.value as MaintenanceScope)}
              >
                <option value="marketplace_home">{scopeLabel('marketplace_home')}</option>
                <option value="marketplace_browse">{scopeLabel('marketplace_browse')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Message</label>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={cfg.maintenanceMessage}
              onChange={(e) => set('maintenanceMessage', e.target.value)}
              maxLength={4000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">ETA note</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="e.g. We expect to be back within 2 hours"
                value={cfg.maintenanceEta}
                onChange={(e) => set('maintenanceEta', e.target.value)}
                maxLength={240}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Window end (display)</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-xs"
                placeholder="e.g. 2026-04-09T18:00:00Z or free text"
                value={cfg.maintenanceWindowEnd}
                onChange={(e) => set('maintenanceWindowEnd', e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Stakeholder bypass</p>
            <p className="mt-1 text-sm text-gray-600">
              Optional secret: append{' '}
              <code className="rounded bg-white px-1 py-0.5 text-xs">
                ?{MAINTENANCE_BYPASS_QUERY}=…
              </code>{' '}
              to skip maintenance for that page load (e.g. for QA or a partner preview). You can also set{' '}
              <code className="rounded bg-white px-1 text-[11px]">MAINTENANCE_BYPASS_SECRET</code> in env instead of storing
              here.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Status:{' '}
              <strong>{cfg.maintenanceBypassSecretSet ? 'Secret configured' : 'No secret (bypass disabled)'}</strong>
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:max-w-md"
                placeholder={cfg.maintenanceBypassSecretSet ? 'New secret (leave blank to keep)' : 'Set bypass secret'}
                value={bypassInput}
                onChange={(e) => {
                  setBypassInput(e.target.value);
                  setBypassClear(false);
                }}
              />
              {cfg.maintenanceBypassSecretSet ? (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={bypassClear}
                    onChange={(e) => {
                      setBypassClear(e.target.checked);
                      if (e.target.checked) setBypassInput('');
                    }}
                  />
                  Remove secret
                </label>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Support email on the maintenance page comes from <code className="rounded bg-gray-100 px-1">PLATFORM_SUPPORT_EMAIL</code>
            {cfg.updatedAt ? (
              <>
                {' '}
                · Last file write {cfg.updatedAt} {cfg.updatedBy ? `by ${cfg.updatedBy}` : ''}
              </>
            ) : null}
          </p>
        </div>
      </section>

      {/* Registration */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Marketplace registration</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            When paused, the public <code className="text-[11px]">/signup</code> flow on the marketplace apex shows a
            hold message. Customer signup on tenant subdomains is unchanged.
          </p>
        </div>
        <div className="space-y-4 p-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint"
              checked={cfg.registrationPaused}
              onChange={(e) => set('registrationPaused', e.target.checked)}
            />
            <span>
              <span className="font-semibold text-gray-900">Pause new registrations on the marketplace</span>
              <span className="mt-0.5 block text-sm text-gray-600">Use during incidents or policy windows.</span>
            </span>
          </label>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Message</label>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={cfg.registrationMessage}
              onChange={(e) => set('registrationMessage', e.target.value)}
              maxLength={2000}
            />
          </div>
        </div>
      </section>

      {/* Feature flags (illustrative) */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Feature flags (reference)</h2>
        <p className="mt-1 text-xs text-gray-500">
          Illustrative rows — wire to LaunchDarkly, Unleash, or your config service when ready. Maintenance above is live
          on this deployment.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Flag</th>
                <th className="px-4 py-3 font-medium">On</th>
                <th className="px-4 py-3 font-medium">Rollout</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_FLAGS.map((f) => (
                <tr key={f.key}>
                  <td className="px-4 py-3 font-mono text-xs text-mint-dark">{f.key}</td>
                  <td className="px-4 py-3 text-gray-900">{f.enabled ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-gray-600">{f.rollout}</td>
                  <td className="px-4 py-3 text-gray-600">{f.owner}</td>
                  <td className="px-4 py-3 text-gray-500">{f.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
