'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MintShopLoader from '@/components/MintShopLoader';
import {
  getMyAddresses,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  type MyAddress,
  type CreateMyAddressBody,
} from '@/lib/api';
import { resolveStorefrontStoreSlug } from '@/lib/storeSlug';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
];

type FormState = {
  store_slug: string;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
  is_default: boolean;
};

const emptyForm = (): FormState => ({
  store_slug: '',
  first_name: '',
  last_name: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  province: '',
  zip: '',
  country: 'US',
  phone: '',
  is_default: false,
});

function addressToForm(a: MyAddress): FormState {
  return {
    store_slug: a.store?.slug ?? '',
    first_name: a.first_name ?? '',
    last_name: a.last_name ?? '',
    company: a.company ?? '',
    address1: a.address1 ?? '',
    address2: a.address2 ?? '',
    city: a.city ?? '',
    province: a.province ?? '',
    zip: a.zip ?? '',
    country: (a.country ?? 'US').toUpperCase().slice(0, 2) || 'US',
    phone: a.phone ?? '',
    is_default: a.is_default,
  };
}

function addressLines(a: MyAddress): string[] {
  const lines: string[] = [];
  if (a.address1) lines.push(a.address1);
  if (a.address2) lines.push(a.address2);
  const cityLine = [a.city, a.province, a.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  return lines;
}

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<MyAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const token = session?.access_token as string | undefined;

  const knownSlugs = useMemo(() => {
    const s = new Set<string>();
    for (const a of list) {
      if (a.store?.slug) s.add(a.store.slug);
    }
    return Array.from(s).sort();
  }, [list]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAddresses(token);
      setList(res.data ?? []);
    } catch (e) {
      setList([]);
      setError(e instanceof Error ? e.message : 'Could not load addresses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/profile/addresses'));
      return;
    }
    void load();
  }, [session, status, router, load]);

  const openAdd = () => {
    setEditingId(null);
    const fromHost = typeof window !== 'undefined' ? resolveStorefrontStoreSlug() ?? '' : '';
    setForm({ ...emptyForm(), store_slug: fromHost || knownSlugs[0] || '' });
    setPanelOpen(true);
  };

  const openEdit = (a: MyAddress) => {
    setEditingId(a.id);
    setForm(addressToForm(a));
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId != null) {
        await updateMyAddress(token, editingId, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          company: form.company.trim() || null,
          address1: form.address1.trim(),
          address2: form.address2.trim() || null,
          city: form.city.trim(),
          province: form.province.trim(),
          zip: form.zip.trim(),
          country: form.country.trim().toUpperCase().slice(0, 2),
          phone: form.phone.trim() || null,
          is_default: form.is_default,
        });
      } else {
        const slug = form.store_slug.trim();
        if (!slug) {
          setError('Store slug is required (the part before . in your store URL).');
          setSaving(false);
          return;
        }
        const body: CreateMyAddressBody = {
          store_slug: slug,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          company: form.company.trim() || undefined,
          address1: form.address1.trim(),
          address2: form.address2.trim() || undefined,
          city: form.city.trim(),
          province: form.province.trim(),
          zip: form.zip.trim(),
          country: form.country.trim().toUpperCase().slice(0, 2),
          phone: form.phone.trim() || undefined,
          is_default: form.is_default,
        };
        await createMyAddress(token, body);
      }
      closePanel();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save address.');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: number) => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyAddress(token, id, { is_default: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update default.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !window.confirm('Remove this saved address?')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteMyAddress(token, id);
      if (editingId === id) closePanel();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (loading && list.length === 0 && !error)) {
    return <MintShopLoader label="Loading addresses…" />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/dashboard" className="hover:text-mint-dark">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="font-medium text-gray-900">Addresses</li>
          </ol>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Saved addresses</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Addresses are stored per Mint store (same account can shop multiple stores). Use the store&apos;s URL slug when
              adding your first address for that store.
            </p>
          </div>
          {!panelOpen ? (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-mint-dark"
            >
              Add address
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {panelOpen ? (
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId != null ? 'Edit address' : 'New address'}
            </h2>
            <form onSubmit={(ev) => void handleSubmit(ev)} className="mt-6 space-y-5">
              {editingId == null ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Store slug</label>
                  <input
                    type="text"
                    list="known-store-slugs"
                    value={form.store_slug}
                    onChange={(e) => setForm((f) => ({ ...f, store_slug: e.target.value }))}
                    placeholder="e.g. istanbulfoodpazar"
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                  <datalist id="known-store-slugs">
                    {knownSlugs.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-xs text-gray-500">
                    From <span className="font-mono">https://your-slug.mint-shop.pro</span> — only the slug part.
                  </p>
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <span className="font-semibold">Store:</span> {form.store_slug ? `${form.store_slug} (${list.find((x) => x.id === editingId)?.store?.name ?? '—'})` : '—'}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">First name</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Last name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Label (optional)</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Home, Work, Parents…"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Street address</label>
                <input
                  value={form.address1}
                  onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
                  required
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Apt, suite (optional)</label>
                <input
                  value={form.address2}
                  onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">State / Province</label>
                  <input
                    value={form.province}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Postal code</label>
                  <input
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint"
                />
                <span className="text-sm text-gray-700">Default for this store</span>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId != null ? 'Save changes' : 'Save address'}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-mint/20 hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {a.company ? (
                  <span className="rounded-full bg-mint/10 px-3 py-0.5 text-xs font-semibold text-mint-dark">{a.company}</span>
                ) : null}
                {a.is_default ? (
                  <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-800">Default</span>
                ) : null}
                {a.store?.slug ? (
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700">{a.store.name}</span>
                ) : null}
              </div>
              <p className="font-semibold text-gray-900">
                {[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}
              </p>
              {a.phone ? <p className="text-sm text-gray-600">{a.phone}</p> : null}
              <div className="mt-3 text-sm leading-relaxed text-gray-700">
                {addressLines(a).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {COUNTRIES.find((c) => c.code === (a.country ?? '').toUpperCase())?.name ?? a.country}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                {!a.is_default ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void setDefault(a.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Set default
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="rounded-lg border border-mint/40 px-3 py-1.5 text-sm font-medium text-mint-dark hover:bg-mint/5"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(a.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        {!panelOpen && list.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint/10">
              <svg className="h-8 w-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">No saved addresses</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Add one for each store you shop with Mint. You&apos;ll need that store&apos;s slug (from its web address).
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-6 inline-flex rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-white hover:bg-mint-dark"
            >
              Add your first address
            </button>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
