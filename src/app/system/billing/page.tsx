'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getBillingInvoices,
  getBillingOverview,
  getBillingPlans,
  getBillingSubscriptions,
  getSystemStores,
  postBillingAssignSubscription,
  postBillingInvoiceAdjustment,
  postBillingInvoiceMarkPaid,
  postBillingInvoiceVoid,
  postBillingManualInvoice,
  type BillingInvoiceRow,
  type BillingOverview,
  type BillingPlanRow,
  type BillingSubscriptionRow,
  type SystemStoreListRow,
} from '@/lib/api';

function money(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

type Tab = 'overview' | 'plans' | 'subscriptions' | 'invoices';

export default function SystemBillingPage() {
  const { data: session, status } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [subs, setSubs] = useState<BillingSubscriptionRow[]>([]);
  const [subsMeta, setSubsMeta] = useState({ page: 1, last_page: 1, total: 0 });
  const [invoices, setInvoices] = useState<BillingInvoiceRow[]>([]);
  const [invMeta, setInvMeta] = useState({ page: 1, last_page: 1, total: 0 });

  const [assignOpen, setAssignOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeHits, setStoreHits] = useState<SystemStoreListRow[]>([]);
  const [pickStore, setPickStore] = useState<SystemStoreListRow | null>(null);
  const [assignPlan, setAssignPlan] = useState('pro');
  const [assignCycle, setAssignCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [assignBusy, setAssignBusy] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualStoreId, setManualStoreId] = useState('');
  const [manualDesc, setManualDesc] = useState('Custom line');
  const [manualCents, setManualCents] = useState('5000');
  const [manualBusy, setManualBusy] = useState(false);

  const [adjInvoiceId, setAdjInvoiceId] = useState<number | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjBusy, setAdjBusy] = useState(false);

  const loadCore = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, pl, subRes, invRes] = await Promise.all([
        getBillingOverview({ token }),
        getBillingPlans({ token }),
        getBillingSubscriptions({ token, page: 1, per_page: 15 }),
        getBillingInvoices({ token, page: 1, per_page: 15 }),
      ]);
      setOverview(ov.data);
      setPlans(pl.data);
      setSubs(subRes.data);
      setSubsMeta({ page: subRes.current_page, last_page: subRes.last_page, total: subRes.total });
      setInvoices(invRes.data);
      setInvMeta({ page: invRes.current_page, last_page: invRes.last_page, total: invRes.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const searchStores = useCallback(async () => {
    if (!token || storeSearch.trim().length < 2) {
      setStoreHits([]);
      return;
    }
    try {
      const res = await getSystemStores({ token, search: storeSearch.trim(), per_page: 10, page: 1 });
      setStoreHits(res.data);
    } catch {
      setStoreHits([]);
    }
  }, [token, storeSearch]);

  useEffect(() => {
    const t = window.setTimeout(() => void searchStores(), 300);
    return () => window.clearTimeout(t);
  }, [searchStores, storeSearch]);

  const submitAssign = async () => {
    if (!token || !pickStore) return;
    setAssignBusy(true);
    setError(null);
    try {
      await postBillingAssignSubscription({
        token,
        storeId: pickStore.id,
        plan_slug: assignPlan,
        billing_cycle: assignCycle,
        create_opening_invoice: true,
      });
      setAssignOpen(false);
      setPickStore(null);
      setStoreSearch('');
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setAssignBusy(false);
    }
  };

  const submitManual = async () => {
    if (!token) return;
    const sid = parseInt(manualStoreId, 10);
    const cents = parseInt(manualCents, 10);
    if (!Number.isFinite(sid) || sid < 1 || !Number.isFinite(cents) || cents < 0) {
      setError('Enter valid store ID and amount (cents).');
      return;
    }
    setManualBusy(true);
    setError(null);
    try {
      await postBillingManualInvoice({
        token,
        store_id: sid,
        subtotal_cents: cents,
        tax_cents: 0,
        billing_reason: 'manual',
        status: 'open',
        line_items: [
          {
            description: manualDesc || 'Manual charge',
            quantity: 1,
            unit_amount_cents: cents,
            total_cents: cents,
          },
        ],
      });
      setManualOpen(false);
      await loadCore();
      setTab('invoices');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invoice create failed');
    } finally {
      setManualBusy(false);
    }
  };

  const submitAdjustment = async () => {
    if (!token || adjInvoiceId == null) return;
    const cents = parseInt(adjAmount, 10);
    if (!Number.isFinite(cents) || cents < 1) {
      setError('Refund amount (cents) must be a positive integer.');
      return;
    }
    setAdjBusy(true);
    setError(null);
    try {
      await postBillingInvoiceAdjustment({
        token,
        invoiceId: adjInvoiceId,
        type: 'refund',
        amount_cents: cents,
        reason: adjReason || undefined,
      });
      setAdjInvoiceId(null);
      setAdjAmount('');
      setAdjReason('');
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Adjustment failed');
    } finally {
      setAdjBusy(false);
    }
  };

  const tabs = useMemo(
    () =>
      [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'plans' as const, label: 'Plans' },
        { id: 'subscriptions' as const, label: 'Subscriptions' },
        { id: 'invoices' as const, label: 'Invoices & receipts' },
      ] as const,
    []
  );

  if (status === 'loading' || (status === 'authenticated' && !token)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-600">
        <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Billing &amp; subscriptions</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            SaaS plans for tenants, billing cycles, invoices, refunds, and gateway readiness (Stripe / PayPal). Merchant
            checkout is separate — this is platform billing to store owners.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark"
          >
            Assign plan to store
          </button>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            New manual invoice
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" className="ml-3 font-semibold underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id ? 'bg-white text-mint-dark ring-1 ring-gray-200 ring-b-0' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading billing data…</p>
      ) : null}

      {!loading && tab === 'overview' && overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Active subscriptions</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{overview.active_subscriptions}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">MRR estimate</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{money(overview.mrr_estimate_cents)}</p>
            <p className="mt-1 text-xs text-gray-500">Normalized from plan prices &amp; cycles</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Open invoices</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{overview.open_invoices_count}</p>
            <p className="mt-1 text-sm text-gray-600">{money(overview.open_invoices_total_cents)} outstanding</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Usage metering</p>
            <p className="mt-2 text-lg font-bold text-gray-900">{overview.usage_metering_enabled ? 'Enabled' : 'Off'}</p>
            <p className="mt-1 text-xs text-gray-500">Plan limits + overage in API; jobs TBD</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Payment gateways</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                <p className="font-semibold text-gray-900">Stripe</p>
                <p className="mt-1 text-sm text-gray-600">
                  {overview.providers.stripe.configured ? (
                    <span className="text-emerald-700">STRIPE_SECRET present</span>
                  ) : (
                    <span>Add STRIPE_SECRET (see config/billing.php)</span>
                  )}
                  {overview.providers.stripe.enabled_flag ? (
                    <span className="ml-2 text-emerald-600">· billing flag on</span>
                  ) : (
                    <span className="ml-2 text-gray-500">· STRIPE_BILLING_ENABLED=false</span>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                <p className="font-semibold text-gray-900">PayPal</p>
                <p className="mt-1 text-sm text-gray-600">
                  {overview.providers.paypal.configured ? (
                    <span className="text-emerald-700">PayPal client + secret present</span>
                  ) : (
                    <span>Set PAYPAL_CLIENT_ID + PAYPAL_SECRET</span>
                  )}
                  {overview.providers.paypal.enabled_flag ? (
                    <span className="ml-2 text-emerald-600">· billing flag on</span>
                  ) : (
                    <span className="ml-2 text-gray-500">· PAYPAL_BILLING_ENABLED=false</span>
                  )}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Live charges use webhooks + gateway SDKs (not yet wired). Manual invoices support ops today; refunds can
              reference provider IDs when you process them externally.
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-dashed border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold text-gray-900">Stores per plan</h2>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {Object.entries(overview.subscriptions_by_plan_slug).map(([slug, n]) => (
                <li key={slug} className="rounded-full bg-mint/10 px-3 py-1 font-medium text-mint-dark">
                  {slug}: {n}
                </li>
              ))}
              {Object.keys(overview.subscriptions_by_plan_slug).length === 0 ? (
                <li className="text-gray-500">No active subscriptions yet.</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      {!loading && tab === 'plans' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Monthly</th>
                <th className="px-4 py-3">Yearly</th>
                <th className="px-4 py-3">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.description}</p>
                    <p className="mt-1 font-mono text-xs text-mint-dark">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{money(p.price_monthly_cents, p.currency)}</td>
                  <td className="px-4 py-3 tabular-nums">{money(p.price_yearly_cents, p.currency)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {p.usage_limits?.usage_billing ? (
                      <>
                        Metered: included products {String(p.usage_limits.included_products ?? '—')} · overage{' '}
                        {p.usage_limits.overage_cents_per_unit != null
                          ? `${p.usage_limits.overage_cents_per_unit}¢/unit`
                          : '—'}
                      </>
                    ) : (
                      'Included allowance / flat'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === 'subscriptions' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Cycle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    {s.store ? (
                      <Link href={`/system/stores/${s.store.id}`} className="font-semibold text-mint-dark hover:underline">
                        {s.store.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                    <p className="text-xs text-gray-500">{s.store?.slug}</p>
                  </td>
                  <td className="px-4 py-3">{s.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{s.billing_cycle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {s.current_period_start && s.current_period_end ? (
                      <>
                        {s.current_period_start.slice(0, 10)} → {s.current_period_end.slice(0, 10)}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
            Showing {subs.length} of {subsMeta.total} ·{' '}
            <Link href="/system/stores" className="font-semibold text-mint-dark hover:underline">
              Stores directory
            </Link>
          </p>
        </div>
      ) : null}

      {!loading && tab === 'invoices' ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      {inv.store ? (
                        <Link
                          href={`/system/stores/${inv.store.id}`}
                          className="font-medium text-mint-dark hover:underline"
                        >
                          {inv.store.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{money(inv.total_cents, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold">{inv.status}</span>
                      {inv.refunds_cents > 0 ? (
                        <span className="ml-2 text-xs text-amber-700">refunds {money(inv.refunds_cents)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-gray-600">{inv.provider}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {inv.status === 'open' || inv.status === 'draft' ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-mint-dark hover:underline"
                            onClick={async () => {
                              if (!token) return;
                              try {
                                await postBillingInvoiceMarkPaid({ token, invoiceId: inv.id });
                                await loadCore();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : 'Mark paid failed');
                              }
                            }}
                          >
                            Mark paid
                          </button>
                        ) : null}
                        {inv.status !== 'paid' && inv.status !== 'void' && inv.status !== 'refunded' ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-gray-600 hover:underline"
                            onClick={async () => {
                              if (!token) return;
                              try {
                                await postBillingInvoiceVoid({ token, invoiceId: inv.id });
                                await loadCore();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : 'Void failed');
                              }
                            }}
                          >
                            Void
                          </button>
                        ) : null}
                        {inv.status === 'paid' || inv.status === 'partially_refunded' ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-amber-800 hover:underline"
                            onClick={() => {
                              setAdjInvoiceId(inv.id);
                              setAdjAmount(String(Math.min(inv.total_cents - inv.refunds_cents, inv.total_cents)));
                            }}
                          >
                            Refund
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              {invMeta.total} invoice{invMeta.total !== 1 ? 's' : ''} · Receipt URL field ready for Stripe/PayPal hosted
              receipts
            </p>
          </div>
        </div>
      ) : null}

      {assignOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Assign subscription</h2>
            <p className="mt-1 text-sm text-gray-600">Updates store plan, subscription row, and opens a subscription invoice.</p>
            <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Find store</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Search name / slug / email"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
            />
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-100">
              {storeHits.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      pickStore?.id === s.id ? 'bg-mint/10 font-semibold' : ''
                    }`}
                    onClick={() => setPickStore(s)}
                  >
                    {s.name} <span className="text-gray-500">({s.slug})</span>
                  </button>
                </li>
              ))}
            </ul>
            <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Plan</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={assignPlan}
              onChange={(e) => setAssignPlan(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Billing cycle</label>
            <div className="mt-2 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={assignCycle === 'monthly'}
                  onChange={() => setAssignCycle('monthly')}
                />
                Monthly
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={assignCycle === 'yearly'} onChange={() => setAssignCycle('yearly')} />
                Yearly
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAssignOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!pickStore || assignBusy}
                className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void submitAssign()}
              >
                {assignBusy ? 'Saving…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manualOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Manual invoice</h2>
            <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Store ID</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={manualStoreId}
              onChange={(e) => setManualStoreId(e.target.value)}
            />
            <label className="mt-3 block text-xs font-bold uppercase text-gray-500">Amount (cents)</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              value={manualCents}
              onChange={(e) => setManualCents(e.target.value)}
            />
            <label className="mt-3 block text-xs font-bold uppercase text-gray-500">Line description</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setManualOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={manualBusy}
                className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void submitManual()}
              >
                {manualBusy ? 'Creating…' : 'Create open invoice'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {adjInvoiceId != null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Record refund</h2>
            <p className="mt-1 text-sm text-gray-600">Creates a refund adjustment; marks invoice partially_refunded / refunded.</p>
            <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Amount (cents)</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
            />
            <label className="mt-3 block text-xs font-bold uppercase text-gray-500">Reason</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setAdjInvoiceId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjBusy}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void submitAdjustment()}
              >
                {adjBusy ? 'Saving…' : 'Record refund'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
