'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getImageDisplayUrl, uploadProductImage, type ProDashboardSettings, type StoreSummary } from '@/lib/api';

const DEFAULTS: Required<
  Pick<
    ProDashboardSettings,
    | 'kpis_scope'
    | 'show_top_kpis'
    | 'show_kpi_total_revenue'
    | 'show_kpi_total_orders'
    | 'show_kpi_store_count'
    | 'show_stores_table'
  >
> = {
  kpis_scope: 'all_stores',
  show_top_kpis: true,
  show_kpi_total_revenue: true,
  show_kpi_total_orders: true,
  show_kpi_store_count: true,
  show_stores_table: true,
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';

export function mergeProDashboard(
  raw: ProDashboardSettings | null | undefined
): ProDashboardSettings & typeof DEFAULTS {
  const merged = { ...DEFAULTS, ...(raw ?? {}) };
  delete (merged as { accent_color?: unknown }).accent_color;
  return merged as ProDashboardSettings & typeof DEFAULTS;
}

type Props = {
  token: string;
  store: StoreSummary;
  onSaved: (updated: StoreSummary) => void;
};

/** Full-page form to edit `store.settings.pro_dashboard` for the selected store. */
export function ProHomeCustomizePanel({ token, store, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProDashboardSettings>(() => mergeProDashboard(store.settings?.pro_dashboard));
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(mergeProDashboard(store.settings?.pro_dashboard));
  }, [store.id, store.settings?.pro_dashboard]);

  const pickAndUpload = async (
    file: File | undefined,
    field: 'header_logo_url' | 'hero_image_url',
    setUploading: (v: boolean) => void
  ) => {
    if (!file || !token) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image must be under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadProductImage(file, { token, storeId: store.id });
      setForm((f) => ({ ...f, [field]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const settings = {
        ...(store.settings ?? {}),
        pro_dashboard: {
          ...form,
          accent_color: null,
        },
      };
      const updated = await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId: store.id,
        body: {
          name: store.name,
          email: store.email ?? null,
          plan: store.plan,
          is_active: store.is_active,
          settings,
        },
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setForm(mergeProDashboard({}));
  };

  const logoUrl = form.header_logo_url?.trim();
  const heroUrl = form.hero_image_url?.trim();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Branding & images</h2>
        <p className="mt-1 text-xs text-gray-500">
          Global colors and storefront styling live in the{' '}
          <Link href="/admin/theme" className="font-medium text-mint hover:text-mint-dark">
            Theme editor
          </Link>
          . Here you only upload images stored on your store (same system as product images).
        </p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Header logo</label>
            <p className="text-[11px] text-gray-500 mb-3">Shown beside the Pro overview title. PNG/SVG recommended.</p>
            <input
              ref={logoInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              className="hidden"
              onChange={(e) => pickAndUpload(e.target.files?.[0], 'header_logo_url', setUploadingLogo)}
            />
            <div className="flex flex-wrap items-center gap-3">
              {logoUrl ? (
                <div className="relative h-16 w-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={getImageDisplayUrl(logoUrl)} alt="" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-40 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[11px] text-gray-400">
                  No logo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={uploadingLogo || !token}
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, header_logo_url: null }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Hero background</label>
            <p className="text-[11px] text-gray-500 mb-3">
              Shown on the Pro dashboard and on your public store home when the{' '}
              <Link href="/admin/theme" className="font-medium text-mint hover:text-mint-dark">
                Theme editor
              </Link>{' '}
              marketplace hero has no custom background. Click <span className="font-medium text-gray-700">Save</span>{' '}
              below after uploading.
            </p>
            <input
              ref={heroInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              className="hidden"
              onChange={(e) => pickAndUpload(e.target.files?.[0], 'hero_image_url', setUploadingHero)}
            />
            <div className="space-y-3">
              {heroUrl ? (
                <div className="relative h-48 w-full max-w-md rounded-xl border border-gray-200 overflow-hidden bg-gray-900">
                  <img src={getImageDisplayUrl(heroUrl)} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-48 w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                  No hero image
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploadingHero || !token}
                  onClick={() => heroInputRef.current?.click()}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingHero ? 'Uploading…' : heroUrl ? 'Replace image' : 'Upload image'}
                </button>
                {heroUrl ? (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, hero_image_url: null }))}
                    className="rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Hero copy</h2>
        <p className="mt-1 text-xs text-gray-500 mb-4">Text shown on the Pro overview hero for this store.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Badge label</label>
            <input
              type="text"
              value={form.badge_label ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, badge_label: e.target.value || null }))}
              placeholder="PRO & ADMIN"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value || null }))}
              placeholder="Platform overview"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
            <textarea
              value={form.subtitle ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value || null }))}
              rows={2}
              placeholder="Short description under the title"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Metrics & layout</h2>
        <p className="mt-1 text-xs text-gray-500 mb-4">Control which KPIs and tables appear on Pro overview.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Metrics scope</label>
            <select
              value={form.kpis_scope ?? DEFAULTS.kpis_scope}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kpis_scope: e.target.value as ProDashboardSettings['kpis_scope'],
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all_stores">All my stores (platform-wide)</option>
              <option value="current_store">Selected store only (e.g. this subdomain&apos;s store)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={form.show_top_kpis ?? DEFAULTS.show_top_kpis}
                onChange={(e) => setForm((f) => ({ ...f, show_top_kpis: e.target.checked }))}
                className="rounded border-gray-300 text-mint focus:ring-mint/40"
              />
              Show KPI row
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={form.show_stores_table ?? DEFAULTS.show_stores_table}
                onChange={(e) => setForm((f) => ({ ...f, show_stores_table: e.target.checked }))}
                className="rounded border-gray-300 text-mint focus:ring-mint/40"
              />
              Show stores table
            </label>
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-4 border-t border-gray-100 pt-3">
            <span className="text-[11px] font-medium text-gray-500 w-full">KPI cards</span>
            {(
              [
                ['show_kpi_total_revenue', 'Total revenue'],
                ['show_kpi_total_orders', 'Total orders'],
                ['show_kpi_store_count', 'Store count'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={form[key] ?? DEFAULTS[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="rounded border-gray-300 text-mint focus:ring-mint/40"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Notes & primary action</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Custom note (plain text)</label>
            <textarea
              value={form.custom_note ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, custom_note: e.target.value || null }))}
              rows={4}
              placeholder="Announcements, reminders, or links as plain text…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Primary button label</label>
            <input
              type="text"
              value={form.primary_action_label ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, primary_action_label: e.target.value || null }))}
              placeholder="Plans & billing"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Primary button URL</label>
            <input
              type="text"
              value={form.primary_action_href ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, primary_action_href: e.target.value || null }))}
              placeholder="/admin/pro/plans"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs text-gray-500 mb-4">
          Settings apply to the store selected in the header:{' '}
          <span className="font-mono text-gray-800">{store.slug}</span>
          {store.domain ? (
            <>
              {' '}
              · storefront <span className="font-mono text-gray-800">{store.domain}</span>
            </>
          ) : null}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="inline-flex items-center rounded-full bg-mint px-4 py-2 text-xs font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save for this store'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={resetToDefaults}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset form to defaults
          </button>
        </div>
      </section>
    </div>
  );
}
