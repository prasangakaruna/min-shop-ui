'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  getSystemStores,
  patchSystemStoreStatus,
  type SystemStoreListRow,
  type SystemStoresListResponse,
} from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type FilterActive = 'all' | 'active' | 'inactive';

const PER_PAGE_OPTIONS = [10, 25, 50] as const;

function storefrontPublicUrl(domain: string | null): string {
  const host = (domain ?? '').trim();
  if (!host) return '';
  const isLocal = host.includes('localhost') || host.endsWith('.local') || /^127\./.test(host);
  return `${isLocal ? 'http' : 'https'}://${host}/`;
}

function formatShortUsDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' });
}

export function ManageSiteSection() {
  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [filter, setFilter] = useState<FilterActive>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement | null>(null);

  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SystemStoresListResponse | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchParams = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch.trim() || undefined,
      is_active: filter === 'all' ? undefined : filter === 'active',
      sort: '-created' as const,
    }),
    [page, perPage, debouncedSearch, filter]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemStores({ token, ...fetchParams });
      setPayload(res);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, [token, fetchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) {
      setLoading(false);
      return;
    }
    void load();
  }, [status, token, load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, perPage]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = filterWrapRef.current;
      if (el && !el.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  const setActive = async (row: SystemStoreListRow, next: boolean) => {
    if (!token) return;
    if (!next) {
      const ok = window.confirm(
        `Deactivate “${row.name}”? Shoppers will not reach this storefront until it is reactivated.`
      );
      if (!ok) return;
    }
    setBusyId(row.id);
    try {
      await patchSystemStoreStatus({ token, storeId: row.id, is_active: next });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not update site');
    } finally {
      setBusyId(null);
    }
  };

  const copySiteSummary = async (row: SystemStoreListRow) => {
    const url = storefrontPublicUrl(row.domain);
    const text = [row.name, `slug: ${row.slug}`, url ? `url: ${url}` : null].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.alert('Could not copy to clipboard');
    }
  };

  if (status === 'unauthenticated') {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Manage Site</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in as a super-admin to manage storefront sites.</p>
      </section>
    );
  }

  return (
    <section id="manage-site" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manage Site</h2>
          <p className="mt-1 text-xs text-gray-500">
            Each site is a tenant storefront (same records as <span className="font-medium">All stores</span>). Search,
            filter, open details, or manage API keys from the store dashboard.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              aria-label="Search sites"
            />
          </div>
          <div className="relative shrink-0" ref={filterWrapRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border text-gray-600 hover:bg-gray-50 ${
                filter !== 'all' ? 'border-red-300 bg-red-50 text-red-800' : 'border-gray-200 bg-white'
              }`}
              aria-expanded={filterOpen}
              aria-haspopup="true"
              title="Filter by status"
            >
              <IconFunnel className="h-4 w-4" />
            </button>
            {filterOpen ? (
              <div
                className="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg sm:left-auto sm:right-0"
                role="menu"
              >
                {(
                  [
                    ['all', 'All sites'],
                    ['active', 'Active only'],
                    ['inactive', 'Inactive only'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setFilter(value);
                      setFilterOpen(false);
                    }}
                    className={`flex w-full px-3 py-2 text-left text-sm ${
                      filter === value ? 'bg-red-50 font-semibold text-red-900' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <Link
          href="/signup"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-red-600 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          <span className="text-lg leading-none">+</span>
          Add New Site
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90 text-xs font-bold text-gray-700">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Site Name</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">API Keys</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      Loading sites…
                    </span>
                  </td>
                </tr>
              ) : null}
              {!loading &&
                (payload?.data ?? []).map((row) => (
                  <ManageSiteRow
                    key={row.id}
                    row={row}
                    busy={busyId === row.id}
                    onDeactivate={() => void setActive(row, false)}
                    onActivate={() => void setActive(row, true)}
                    onCopy={() => void copySiteSummary(row)}
                  />
                ))}
              {!loading && payload && payload.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No sites match your search or filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {payload && payload.total > 0 ? (
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={payload.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-sm font-semibold tabular-nums text-gray-900">
              {payload.current_page}
            </span>
            <button
              type="button"
              disabled={payload.current_page >= payload.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
            <label className="ml-2 flex items-center gap-2 text-sm text-gray-600">
              <span className="sr-only">Rows per page</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number])}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-right text-xs text-gray-400">
        <Link href="/system/stores" className="font-semibold text-mint-dark hover:underline">
          Open full store directory →
        </Link>
      </p>
    </section>
  );
}

function ManageSiteRow({
  row,
  busy,
  onDeactivate,
  onActivate,
  onCopy,
}: {
  row: SystemStoreListRow;
  busy: boolean;
  onDeactivate: () => void;
  onActivate: () => void;
  onCopy: () => void;
}) {
  const href = `/system/stores/${row.id}`;
  const keys = row.counts.api_keys ?? 0;
  const publicUrl = storefrontPublicUrl(row.domain);

  return (
    <tr className="hover:bg-gray-50/80">
      <td className="px-4 py-4 tabular-nums text-gray-600">{row.id}</td>
      <td className="px-4 py-4">
        <Link href={href} className="font-semibold text-gray-900 hover:text-red-700 hover:underline">
          {row.name}
        </Link>
      </td>
      <td className="px-4 py-4">
        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-blue-600 hover:underline"
          >
            {publicUrl}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-4">
        <span className={`text-sm font-semibold ${row.is_active ? 'text-emerald-600' : 'text-gray-500'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums text-gray-700">{keys}</span>
          <Link
            href={`${href}#tenant-api-keys`}
            className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
          >
            + Manage
          </Link>
        </div>
      </td>
      <td className="px-4 py-4 tabular-nums text-gray-700">{formatShortUsDate(row.created_at)}</td>
      <td className="px-4 py-4 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          <Link
            href={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100"
            title="Edit"
            aria-label={`Edit ${row.name}`}
          >
            <IconPencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Copy summary"
            aria-label={`Copy details for ${row.name}`}
          >
            <IconDuplicate className="h-4 w-4" />
          </button>
          {row.is_active ? (
            <button
              type="button"
              disabled={busy}
              onClick={onDeactivate}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              title="Deactivate site"
              aria-label={`Deactivate ${row.name}`}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onActivate}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              title="Activate site"
              aria-label={`Activate ${row.name}`}
            >
              <IconCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconFunnel({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function IconDuplicate({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
