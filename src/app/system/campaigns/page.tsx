'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createSystemCampaign,
  getSystemCampaigns,
  getSystemStores,
  type SystemSmsCampaignRow,
  type SystemSmsCampaignsListResponse,
  type SystemStoreListRow,
} from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PER_PAGE_OPTIONS = [10, 25, 50] as const;
const STATUS_OPTIONS = ['', 'processing', 'failed', 'sent', 'scheduled', 'completed'] as const;

function previewMessage(text: string, max = 52): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatCreated(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function statusLabel(status: string): string {
  return status.replace(/-/g, ' ').toUpperCase();
}

function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'failed') return 'bg-gray-100 text-gray-900 ring-gray-200';
  if (s === 'processing' || s === 'scheduled') return 'bg-amber-50 text-amber-950 ring-amber-200';
  if (s === 'sent' || s === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200';
  return 'bg-gray-50 text-gray-700 ring-gray-200';
}

function recipientTooltip(row: SystemSmsCampaignRow): string {
  return [
    `Delivered / audience: ${row.delivered_count}/${row.total_recipients}`,
    `Send attempts: ${row.attempted_count}`,
    `Failed: ${row.failed_count}`,
    `Queued: ${row.queued_count}`,
  ].join(' · ');
}

export default function SystemCampaignsPage() {
  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('');
  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SystemSmsCampaignsListResponse | null>(null);
  const [detailRow, setDetailRow] = useState<SystemSmsCampaignRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [stores, setStores] = useState<SystemStoreListRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formTotal, setFormTotal] = useState('1');
  const [formPhone, setFormPhone] = useState('');
  const [formStoreId, setFormStoreId] = useState<string>('');

  const fetchParams = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [page, perPage, debouncedSearch, statusFilter]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemCampaigns({ token, ...fetchParams });
      setPayload(res);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
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
  }, [debouncedSearch, statusFilter, perPage]);

  useEffect(() => {
    if (!token || status !== 'authenticated') return;
    let cancelled = false;
    void getSystemStores({ token, page: 1, per_page: 50, sort: 'name' }).then((res) => {
      if (!cancelled) setStores(res.data ?? []);
    }).catch(() => {
      if (!cancelled) setStores([]);
    });
    return () => {
      cancelled = true;
    };
  }, [token, status]);

  const resetForm = () => {
    setFormName('');
    setFormMessage('');
    setFormTotal('1');
    setFormPhone('');
    setFormStoreId('');
  };

  const submitCreate = async () => {
    if (!token) return;
    const total = Number.parseInt(formTotal, 10);
    if (!Number.isFinite(total) || total < 1) {
      window.alert('Total recipients must be at least 1.');
      return;
    }
    if (!formMessage.trim()) {
      window.alert('Message is required.');
      return;
    }
    setSubmitting(true);
    try {
      await createSystemCampaign({
        token,
        body: {
          name: formName.trim() || undefined,
          message: formMessage.trim(),
          total_recipients: total,
          recipient_phone: formPhone.trim() || undefined,
          store_id: formStoreId ? Number.parseInt(formStoreId, 10) : undefined,
        },
      });
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'unauthenticated') {
    return <p className="text-sm text-gray-600">Sign in to manage campaigns.</p>;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mint-dark">System console</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Outbound SMS campaigns: delivery progress, status, and message preview. Rows are stored in the API and can
            be extended to your SMS provider webhooks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-50"
          disabled={!token}
        >
          New campaign
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="campaign-search" className="mb-1 block text-[11px] font-bold uppercase text-gray-400">
            Search
          </label>
          <input
            id="campaign-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Campaign name, message, or phone…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm focus:border-mint focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint/25"
          />
        </div>
        <div>
          <label htmlFor="campaign-status" className="mb-1 block text-[11px] font-bold uppercase text-gray-400">
            Status
          </label>
          <select
            id="campaign-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
          >
            <option value="">All</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="sent">Sent</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="campaign-per" className="mb-1 block text-[11px] font-bold uppercase text-gray-400">
            Rows
          </label>
          <select
            id="campaign-per"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number])}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !token}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-mint hover:text-mint-dark disabled:opacity-50 sm:mb-0.5"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-800">
                <th className="px-4 py-3">Campaign name</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3 text-center">Total recipients</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                      Loading campaigns…
                    </span>
                  </td>
                </tr>
              ) : null}
              {!loading &&
                (payload?.data ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="text-left font-semibold text-gray-900 hover:text-mint-dark hover:underline"
                      >
                        {row.name}
                      </button>
                      {row.store_name ? (
                        <p className="mt-0.5 text-xs text-gray-500">Store: {row.store_name}</p>
                      ) : null}
                    </td>
                    <td className="max-w-[280px] px-4 py-3 align-top text-gray-700">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="text-left hover:text-mint-dark"
                        title="View full message"
                      >
                        {previewMessage(row.message)}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums text-gray-800">
                      <span className="inline-flex items-center gap-1">
                        {row.delivered_count}/{row.total_recipients}
                        <span
                          className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] font-bold text-gray-500"
                          title={recipientTooltip(row)}
                        >
                          i
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-top tabular-nums text-gray-800">{row.total_recipients}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${statusPillClass(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums text-gray-700">{formatCreated(row.created_at)}</td>
                  </tr>
                ))}
              {!loading && payload && payload.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-500">
                    No campaigns yet. Run{' '}
                    <code className="rounded bg-gray-100 px-1 text-xs">php artisan migrate --seed</code> to load demo
                    rows, or create one with <span className="font-semibold">New campaign</span>.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {payload && payload.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-gray-900">{payload.total.toLocaleString()}</span> campaigns
            {payload.last_page > 1 ? (
              <>
                {' '}
                · page <span className="font-mono font-semibold">{payload.current_page}</span> of{' '}
                <span className="font-mono font-semibold">{payload.last_page}</span>
              </>
            ) : null}
          </p>
          {payload.last_page > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={payload.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={payload.current_page >= payload.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {detailRow ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            aria-labelledby="campaign-detail-title"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2 id="campaign-detail-title" className="text-lg font-bold text-gray-900">
              {detailRow.name}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-semibold text-gray-900">{statusLabel(detailRow.status)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Recipients</dt>
                <dd className="tabular-nums font-medium text-gray-900">
                  {detailRow.delivered_count}/{detailRow.total_recipients}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Total recipients</dt>
                <dd className="tabular-nums font-medium text-gray-900">{detailRow.total_recipients}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-mono text-gray-900">{formatCreated(detailRow.created_at)}</dd>
              </div>
              {detailRow.recipient_phone ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-mono text-gray-900">{detailRow.recipient_phone}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase text-gray-400">Message</p>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-sm text-gray-800">
                {detailRow.message}
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-500" title={recipientTooltip(detailRow)}>
              {recipientTooltip(detailRow)}
            </p>
            <button
              type="button"
              onClick={() => setDetailRow(null)}
              className="mt-6 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            aria-labelledby="campaign-create-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2 id="campaign-create-title" className="text-lg font-bold text-gray-900">
              New SMS campaign
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Creates a campaign record (status processing). Wire your SMS worker to PATCH delivery fields when sends
              complete.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400">Campaign name (optional)</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Leave blank to use Direct SMS - phone"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400">Recipient phone (optional)</label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+32415124515"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400">Store (optional)</label>
                <select
                  value={formStoreId}
                  onChange={(e) => setFormStoreId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
                >
                  <option value="">— None —</option>
                  {stores.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400">Message *</label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={4}
                  placeholder="TGI Tours: Your tour is confirmed…"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400">Total recipients *</label>
                <input
                  type="number"
                  min={1}
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitCreate()}
                className="rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-white hover:bg-mint-dark disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Create campaign'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
                className="rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
