'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { StoreSummary } from '@/lib/api';
import { apiRequest } from '@/lib/api';

type CustomerAccountsSettings = {
  authentication_enabled?: boolean;
  authentication_mode?: string;
  sign_in_links_enabled?: boolean;
  self_serve_returns_enabled?: boolean;
  store_credit_enabled?: boolean;
  url?: string;
};

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

function cardRowClass() {
  return 'flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3';
}

export function AdminCustomerAccountsSection(props: {
  token: string | null;
  store: StoreSummary | null;
  storeId: number;
}) {
  const { token, store, storeId } = props;
  const storeDomain = store?.domain ?? null;

  const defaultUrl = useMemo(() => {
    if (!storeDomain) return 'https://example.com/account';
    const base = storeDomain.startsWith('http') ? storeDomain : `https://${storeDomain}`;
    return `${base}/account`;
  }, [storeDomain]);

  const initial = useMemo<CustomerAccountsSettings>(() => {
    const raw = (store?.settings as any)?.customer_accounts as CustomerAccountsSettings | undefined;
    return {
      authentication_enabled: raw?.authentication_enabled ?? true,
      authentication_mode: raw?.authentication_mode ?? 'email_link',
      sign_in_links_enabled: raw?.sign_in_links_enabled ?? false,
      self_serve_returns_enabled: raw?.self_serve_returns_enabled ?? false,
      store_credit_enabled: raw?.store_credit_enabled ?? false,
      url: raw?.url ?? defaultUrl,
    };
  }, [store, defaultUrl]);

  const [settings, setSettings] = useState<CustomerAccountsSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep local form state in sync after store load / store switch.
  useEffect(() => {
    setSettings(initial);
  }, [initial]);

  async function persist(next: CustomerAccountsSettings) {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId,
        body: {
          settings: {
            customer_accounts: next,
          },
        },
      });

      const updatedRaw = (updated.settings as any)?.customer_accounts as CustomerAccountsSettings | undefined;
      setSettings({
        authentication_enabled: updatedRaw?.authentication_enabled ?? next.authentication_enabled,
        authentication_mode: updatedRaw?.authentication_mode ?? next.authentication_mode,
        sign_in_links_enabled: updatedRaw?.sign_in_links_enabled ?? next.sign_in_links_enabled,
        self_serve_returns_enabled: updatedRaw?.self_serve_returns_enabled ?? next.self_serve_returns_enabled,
        store_credit_enabled: updatedRaw?.store_credit_enabled ?? next.store_credit_enabled,
        url: updatedRaw?.url ?? next.url,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update customer accounts');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200">
            !
          </span>
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">Customer accounts</h2>
        <p className="mt-1 text-sm text-gray-500">Configure authentication, returns, store credit, and the customer account URL.</p>

        <div className="mt-4 space-y-4">
          {/* Sign-in links */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sign-in links</p>
            <div className={cardRowClass()}>
              <div>
                <p className="text-sm font-medium text-gray-900">Show sign-in links</p>
                <p className="mt-1 text-xs text-gray-500">Show sign-in links in the header of online store and at checkout</p>
              </div>
              <Toggle
                checked={Boolean(settings.sign_in_links_enabled)}
                disabled={saving || !token}
                onChange={(next) => persist({ ...settings, sign_in_links_enabled: next })}
              />
            </div>
          </div>

          {/* Authentication */}
          <div className={cardRowClass()}>
            <div>
              <p className="text-sm font-medium text-gray-900">Authentication</p>
              <p className="mt-1 text-xs text-gray-500">Manage sign-in methods and account access</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">Mode</span>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                  value={settings.authentication_mode ?? 'email_link'}
                  disabled={saving || !token}
                  onChange={(e) => persist({ ...settings, authentication_mode: e.target.value })}
                >
                  <option value="email_link">Email link</option>
                  <option value="password">Password</option>
                  <option value="oauth">OAuth</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {settings.authentication_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                disabled={saving || !token}
                onClick={() => persist({ ...settings, authentication_enabled: !settings.authentication_enabled })}
              >
                {settings.authentication_enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Self-serve returns */}
          <div className={cardRowClass()}>
            <div>
              <p className="text-sm font-medium text-gray-900">Self-serve returns</p>
              <p className="mt-1 text-xs text-gray-500">Allow customers to request and manage returns.</p>
              <p className="mt-1 text-xs text-gray-500">Customize what your customers can return with return rules</p>
            </div>
            <Toggle
              checked={Boolean(settings.self_serve_returns_enabled)}
              disabled={saving || !token}
              onChange={(next) => persist({ ...settings, self_serve_returns_enabled: next })}
            />
          </div>

          {/* Store credit */}
          <div className={cardRowClass()}>
            <div>
              <p className="text-sm font-medium text-gray-900">Store credit</p>
              <p className="mt-1 text-xs text-gray-500">Allow customers to see and spend store credit</p>
            </div>
            <Toggle
              checked={Boolean(settings.store_credit_enabled)}
              disabled={saving || !token}
              onChange={(next) => persist({ ...settings, store_credit_enabled: next })}
            />
          </div>

          {/* URL */}
          <div className={cardRowClass()}>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">URL</p>
              <p className="mt-1 text-xs text-gray-500">Use this URL anywhere you&apos;d like customers to access customer accounts</p>
              <div className="mt-3 rounded-xl bg-gray-100 px-3 py-2 font-mono text-xs text-gray-700">
                {settings.url ?? defaultUrl}
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700">Custom URL</label>
                <input
                  type="text"
                  value={settings.url ?? defaultUrl}
                  disabled={saving || !token}
                  onChange={(e) => setSettings((s) => ({ ...s, url: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                disabled={saving || !token}
                onClick={() => persist({ ...settings, url: settings.url ?? defaultUrl })}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

