'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  apiRequest,
  getSystemStores,
  type StoreSummary,
  type StoreThemeResource,
  type SystemStoreListRow,
} from '@/lib/api';
import { mintMarketplaceHomeStoreSlug } from '@/lib/mintMarketplaceHomeSlug';
import { mintPublicApexHttpsUrl } from '@/lib/mintPublicRootDomain';
import StoreThemeEditor from '@/components/admin/StoreThemeEditor';

export function MarketplaceThemeClient() {
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get('storeId');
  const parsedQueryId =
    queryStoreId && /^\d+$/.test(queryStoreId) ? Number.parseInt(queryStoreId, 10) : null;

  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const configuredSlug = useMemo(() => mintMarketplaceHomeStoreSlug(), []);

  const [storeList, setStoreList] = useState<SystemStoreListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(parsedQueryId);
  const [storeDetail, setStoreDetail] = useState<StoreSummary | null>(null);
  const [storeDetailLoading, setStoreDetailLoading] = useState(false);
  const [themeResource, setThemeResource] = useState<StoreThemeResource | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading' || !token) {
      if (status !== 'loading' && !token) setListLoading(false);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    getSystemStores({ token, page: 1, per_page: 100, sort: 'name' })
      .then((res) => {
        if (!cancelled) setStoreList(res.data);
      })
      .catch(() => {
        if (!cancelled) setStoreList([]);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, status]);

  useEffect(() => {
    if (parsedQueryId != null) {
      setSelectedId(parsedQueryId);
      return;
    }
    if (!configuredSlug || storeList.length === 0) return;
    const row = storeList.find((r) => r.slug === configuredSlug);
    if (row) setSelectedId(row.id);
  }, [parsedQueryId, configuredSlug, storeList]);

  useEffect(() => {
    if (!token || !selectedId) {
      setStoreDetail(null);
      setThemeResource(null);
      setStoreDetailLoading(false);
      setThemeLoading(false);
      return;
    }
    let cancelled = false;
    setStoreDetailLoading(true);
    setThemeLoading(true);
    setStoreDetail(null);
    setThemeResource(null);

    apiRequest<StoreSummary>('/store', { token, storeId: selectedId })
      .then((s) => {
        if (!cancelled) setStoreDetail(s);
      })
      .catch(() => {
        if (!cancelled) setStoreDetail(null);
      })
      .finally(() => {
        if (!cancelled) setStoreDetailLoading(false);
      });

    apiRequest<{ data: StoreThemeResource }>('/store/theme', { token, storeId: selectedId })
      .then((res) => {
        if (!cancelled) setThemeResource(res.data);
      })
      .catch(() => {
        if (!cancelled) setThemeResource(null);
      })
      .finally(() => {
        if (!cancelled) setThemeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  const storeForEditor = useMemo((): StoreSummary | null => {
    if (!storeDetail) return null;
    if (!themeResource) return storeDetail;
    return {
      ...storeDetail,
      settings: {
        ...storeDetail.settings,
        storefront_home: themeResource.storefront_home ?? storeDetail.settings?.storefront_home,
        storefront_app_embeds: themeResource.storefront_app_embeds ?? storeDetail.settings?.storefront_app_embeds,
      },
    };
  }, [storeDetail, themeResource]);

  const onThemeSaved = useCallback(
    (s: StoreSummary) => {
      setStoreDetail(s);
      if (!token || !s.id) return;
      apiRequest<{ data: StoreThemeResource }>('/store/theme', { token, storeId: s.id })
        .then((res) => setThemeResource(res.data))
        .catch(() => {});
    },
    [token]
  );

  const apex = mintPublicApexHttpsUrl();

  if (status === 'unauthenticated') {
    return <p className="text-sm text-gray-600">Sign in to edit the marketplace home theme.</p>;
  }

  const selectedRow = storeList.find((r) => r.id === selectedId);

  return (
    <div className="min-h-full text-gray-900">
      <div className="border-b border-gray-200 bg-white px-1 pb-5 pt-1 sm:px-0">
        <Link href="/system" className="text-sm text-mint-dark hover:underline">
          ← Platform overview
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">Marketplace home theme</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Edit the same <strong>storefront home</strong> experience used on the public marketplace. When{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG</code>{' '}
          matches this store&apos;s slug, the apex home (<code className="rounded bg-gray-100 px-1 text-xs">/</code> on
          your production domain) loads this theme, logo, and sections — like{' '}
          <a
            href="https://mint-shop.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-mint-dark hover:underline"
          >
            mint-shop.pro
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {apex ? (
            <a
              href={apex}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
            >
              Open apex home ↗
            </a>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:border-mint hover:text-mint-dark"
          >
            Open local home
          </Link>
        </div>

        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            configuredSlug
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
              : 'border-amber-200 bg-amber-50/90 text-amber-950'
          }`}
        >
          {configuredSlug ? (
            <>
              <span className="font-semibold">Apex binding:</span> <code className="text-xs">{configuredSlug}</code>
              {selectedRow?.slug === configuredSlug ? (
                <span className="ml-1 text-emerald-800">— matches selected store.</span>
              ) : (
                <span className="ml-1 text-amber-900">
                  — select the store with this slug below, or fix the env variable.
                </span>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold">Apex binding not set.</span> Add{' '}
              <code className="rounded bg-white/80 px-1 text-xs">NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG=&lt;slug&gt;</code>{' '}
              in <code className="text-xs">.env</code> and restart Next.js so production <code className="text-xs">/</code>{' '}
              uses a saved theme instead of built-in defaults only.
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400" htmlFor="sys-theme-store">
          Store to edit
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Super-admin listing. The merchant path is <code className="text-[11px]">/admin/theme</code> for the current
          store context.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            id="sys-theme-store"
            className="min-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
            value={selectedId ?? ''}
            disabled={listLoading || !token}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedId(v === '' ? null : Number.parseInt(v, 10));
            }}
          >
            <option value="">Choose a store…</option>
            {storeList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.slug}){r.is_active ? '' : ' — inactive'}
              </option>
            ))}
          </select>
          {listLoading ? <span className="text-xs text-gray-500">Loading stores…</span> : null}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 lg:p-6">
        {!token ? (
          <p className="text-sm text-gray-500">Waiting for session…</p>
        ) : !selectedId ? (
          <p className="text-sm text-gray-600">Select a store to load the theme editor.</p>
        ) : storeDetailLoading || themeLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" />
            Loading store theme…
          </div>
        ) : storeForEditor ? (
          <StoreThemeEditor token={token} store={storeForEditor} onSaved={onThemeSaved} />
        ) : (
          <p className="text-sm text-amber-800">
            Could not load this store (inactive store may block public branding, or API error). Try another store or
            check the Laravel logs.
          </p>
        )}
      </div>
    </div>
  );
}
