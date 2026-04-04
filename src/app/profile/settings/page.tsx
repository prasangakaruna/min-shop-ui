'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import Toast from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getMe, patchMyPreferences, type Me, type UserPreferences } from '@/lib/api';

function defaultPreferences(): UserPreferences {
  return {
    locale: 'en',
    currency: 'USD',
    notifications: {
      email_orders: true,
      email_marketing: false,
      sms_orders: false,
    },
    privacy: {
      product_recommendations: true,
      share_anonymous_usage: false,
    },
  };
}

function normalizePreferences(p: UserPreferences | undefined | null): UserPreferences {
  const d = defaultPreferences();
  if (!p) return d;
  return {
    locale: p.locale ?? d.locale,
    currency: p.currency ?? d.currency,
    notifications: {
      email_orders: p.notifications?.email_orders ?? d.notifications.email_orders,
      email_marketing: p.notifications?.email_marketing ?? d.notifications.email_marketing,
      sms_orders: p.notifications?.sms_orders ?? d.notifications.sms_orders,
    },
    privacy: {
      product_recommendations: p.privacy?.product_recommendations ?? d.privacy.product_recommendations,
      share_anonymous_usage: p.privacy?.share_anonymous_usage ?? d.privacy.share_anonymous_usage,
    },
  };
}

function prefsEqual(a: UserPreferences, b: UserPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mint/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-mint peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.access_token as string | undefined;

  const [me, setMe] = useState<Me | null>(null);
  const [savedPrefs, setSavedPrefs] = useState<UserPreferences>(defaultPreferences);
  const [draft, setDraft] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const m = await getMe(token);
      setMe(m);
      const p = normalizePreferences(m.preferences);
      setSavedPrefs(p);
      setDraft(p);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = p.locale;
      }
    } catch (e) {
      setMe(null);
      setLoadError(e instanceof Error ? e.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/profile/settings'));
      return;
    }
    void load();
  }, [session, status, router, load]);

  const dirty = useMemo(() => !prefsEqual(draft, savedPrefs), [draft, savedPrefs]);

  const showToastMsg = (message: string, type: typeof toastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const savePreferences = async () => {
    if (!token || !dirty) return;
    setSaving(true);
    try {
      const updated = await patchMyPreferences({
        token,
        body: {
          locale: draft.locale,
          currency: draft.currency,
          notifications: { ...draft.notifications },
          privacy: { ...draft.privacy },
        },
      });
      setMe(updated);
      const p = normalizePreferences(updated.preferences);
      setSavedPrefs(p);
      setDraft(p);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = p.locale;
      }
      showToastMsg('Preferences saved.');
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : 'Could not save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => setDraft(savedPrefs);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: '/' });
    } finally {
      setSigningOut(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading && !me && !loadError)) {
    return <MintShopLoader label="Loading settings…" />;
  }

  if (!session?.user) {
    return null;
  }

  if (loadError && !me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 rounded-xl bg-mint px-6 py-3 font-semibold text-white shadow-md transition hover:bg-mint-dark"
          >
            Try again
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const keycloakUrl = me?.keycloak_account_url?.trim() || null;
  const isKeycloakPassword = me?.password_managed_by === 'keycloak';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-mint-dark">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li>
              <Link href="/profile" className="transition-colors hover:text-mint-dark">
                Profile
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="font-medium text-gray-900">Settings</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Settings</h1>
          <p className="mt-2 text-gray-600">
            Account preferences are saved to your Mint profile and apply wherever you sign in with this account.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Email and display name come from your Mint account. Email matches your sign-in provider.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  readOnly
                  value={me?.email ?? ''}
                  className="w-full cursor-not-allowed rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-gray-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Display name</label>
                <input
                  type="text"
                  readOnly
                  value={me?.name ?? ''}
                  className="w-full cursor-not-allowed rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-gray-700"
                />
              </div>
              <Link
                href="/profile"
                className="inline-flex text-sm font-semibold text-mint hover:text-mint-dark"
              >
                Edit name on Profile →
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Regional</h2>
            <p className="mt-2 text-sm text-gray-600">Language for this browser session and default currency preference.</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Language</label>
                <select
                  value={draft.locale}
                  onChange={(e) => setDraft((d) => ({ ...d, locale: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Currency</label>
                <select
                  value={draft.currency}
                  onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="TRY">TRY (₺)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Password &amp; security</h2>
            {isKeycloakPassword ? (
              <div className="mt-4 text-gray-600">
                <p>
                  Your password is managed by your sign-in provider (Keycloak). Use the account console to change it, enable
                  two-factor authentication, and review active sessions.
                </p>
                {keycloakUrl ? (
                  <a
                    href={keycloakUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
                  >
                    Open account security
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-amber-800">
                    Keycloak account URL is not configured on the API (set <code className="rounded bg-amber-100 px-1">KEYCLOAK_ISSUER</code>
                    ).
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-gray-600">
                This account uses a password stored in Mint. Password changes are not exposed in this app yet—contact support if
                you need to reset it.
              </p>
            )}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900">Sign out</h3>
              <p className="mt-1 text-sm text-gray-600">End this session on this device.</p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {signingOut ? <LoadingSpinner size="sm" /> : null}
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="mt-2 text-sm text-gray-600">
              Order emails are recommended for receipts and shipping updates. Marketing preference also updates your customer
              records at stores where you shop with this email.
            </p>
            <div className="mt-2 divide-y divide-gray-100">
              <ToggleRow
                label="Order & account email"
                description="Transactional messages about orders, shipping, and account activity."
                checked={draft.notifications.email_orders}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, notifications: { ...d.notifications, email_orders: v } }))}
              />
              <ToggleRow
                label="Marketing email"
                description="Promotions and news from stores you buy from. Syncs accepts_marketing on your store customer profiles."
                checked={draft.notifications.email_marketing}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, notifications: { ...d.notifications, email_marketing: v } }))}
              />
              <ToggleRow
                label="SMS for orders"
                description="Optional text updates; standard message rates may apply when this channel is enabled by the platform."
                checked={draft.notifications.sms_orders}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, notifications: { ...d.notifications, sms_orders: v } }))}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Privacy</h2>
            <p className="mt-2 text-sm text-gray-600">Control how we use data to improve your experience.</p>
            <div className="mt-2 divide-y divide-gray-100">
              <ToggleRow
                label="Personalized recommendations"
                description="Allow Mint to tailor product suggestions using your activity on Mint shops."
                checked={draft.privacy.product_recommendations}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, product_recommendations: v } }))}
              />
              <ToggleRow
                label="Share anonymous usage"
                description="Send anonymized product and feature usage to help improve Mint. Does not include order totals or payment data."
                checked={draft.privacy.share_anonymous_usage}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, share_anonymous_usage: v } }))}
              />
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-mint/20 bg-white/95 p-4 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={resetDraft}
              disabled={!dirty || saving}
              className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => void savePreferences()}
              disabled={!dirty || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" /> : null}
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>

          <section className="rounded-2xl border-2 border-red-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-red-900">Danger zone</h2>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Delete account</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Permanent deletion is not self-serve yet. Contact support to close your account and remove personal data under
                  applicable law.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
              >
                Request deletion
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Quick links</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-mint">
              <li>
                <Link href="/profile" className="hover:text-mint-dark">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/profile/addresses" className="hover:text-mint-dark">
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-mint-dark">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/profile/payment-methods" className="hover:text-mint-dark">
                  Payment methods
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Delete your account</h3>
            <p className="mt-3 text-sm text-gray-600">
              We don&apos;t offer automated account deletion in the app yet. Please email your store or platform support with
              the email address on this account so they can verify and process your request.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
