import Link from 'next/link';
import { auth } from '@/auth';
import { getSystemStores } from '@/lib/api';
import { formatRevenueCompact } from '@/lib/formatSystemRevenue';
import { getSystemStatusSnapshot } from '@/lib/systemStatus';

function pct(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export default async function SystemOverviewPage() {
  const [status, session] = await Promise.all([getSystemStatusSnapshot(), auth()]);

  let storesPayload: Awaited<ReturnType<typeof getSystemStores>> | null = null;
  let storesError: string | null = null;
  const token = session?.access_token;
  if (token && session?.isSuperAdmin) {
    try {
      storesPayload = await getSystemStores({
        token,
        page: 1,
        per_page: 8,
        sort: '-created',
      });
    } catch (e) {
      storesError = e instanceof Error ? e.message : 'Could not load platform data from the API';
    }
  }

  const summary = storesPayload?.summary;
  const nominal =
    status.authSecretConfigured &&
    (!status.keycloakIssuerConfigured || status.idpWellKnownOk === true) &&
    status.apiBaseConfigured;

  const totalStores = summary?.total_stores_count ?? 0;
  const activeStores = summary?.active_stores_count ?? 0;
  const inactiveStores = summary?.inactive_stores_count ?? Math.max(0, totalStores - activeStores);
  const activePct = pct(activeStores, totalStores);
  const platformRev = summary?.platform_revenue_total ?? 0;
  const platformOrders = summary?.platform_orders_count ?? 0;
  const platformAov = platformOrders > 0 ? platformRev / platformOrders : 0;
  const top = summary?.top_store_by_revenue;
  const recentStores = storesPayload?.data ?? [];

  const updatedUtc = new Date(status.at).toISOString().slice(11, 19);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Platform overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Live Mint commerce metrics and integration health for operators. Data comes from the backoffice API
            (super-admin) and this app&apos;s configuration — not simulated telemetry.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 text-right sm:items-end">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className={`h-2 w-2 rounded-full ${nominal ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className={nominal ? 'text-emerald-700' : 'text-amber-700'}>
              {nominal ? 'Core checks OK' : 'Check configuration'}
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Snapshot: {updatedUtc} UTC
          </span>
        </div>
      </div>

      {storesError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Stores API: </span>
          {storesError}
          <p className="mt-1 text-xs text-amber-800/90">
            Confirm <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_API_URL</code> and that your Keycloak user
            has the super-admin role expected by the API.
          </p>
        </div>
      ) : null}

      {/* Platform KPIs */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Commerce (all tenants)</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Stores" value={String(totalStores)} hint="Registered storefronts" />
          <KpiCard label="Active" value={String(activeStores)} hint={`${inactiveStores} inactive`} />
          <KpiCard
            label="Platform revenue"
            value={formatRevenueCompact(platformRev)}
            hint={summary?.revenue_definition ?? 'Excl. cancelled & refunded'}
          />
          <KpiCard
            label="Qualifying orders"
            value={platformOrders.toLocaleString()}
            hint={platformOrders > 0 ? `AOV ${formatRevenueCompact(platformAov)}` : 'No qualifying orders yet'}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Store activation mix */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <h2 className="text-lg font-bold text-gray-900">Store activation</h2>
          <p className="mt-1 text-xs text-gray-500">Active vs inactive stores on the platform.</p>
          {totalStores === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No stores yet. Tenants appear here once created.</p>
          ) : (
            <>
              <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-mint transition-all"
                  style={{ width: `${activePct}%` }}
                  title={`${activePct}% active`}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm font-medium text-gray-700">
                <span>
                  <span className="text-mint-dark">{activeStores}</span> active
                </span>
                <span className="text-gray-500">
                  <span className="tabular-nums text-gray-800">{inactiveStores}</span> inactive
                </span>
              </div>
            </>
          )}
        </section>

        {/* Top store */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="text-lg font-bold text-gray-900">Top store by revenue</h2>
          <p className="mt-1 text-xs text-gray-500">Highest lifetime qualifying revenue (same rules as store list).</p>
          {!top || top.revenue_total <= 0 ? (
            <p className="mt-6 text-sm text-gray-500">No qualifying revenue recorded yet.</p>
          ) : (
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="font-semibold text-gray-900">{top.name ?? 'Store'}</p>
              <p className="mt-0.5 text-xs text-gray-500">{top.slug ? `${top.slug}` : `ID ${top.id}`}</p>
              <p className="mt-3 text-xl font-bold tabular-nums text-mint-dark">
                {formatRevenueCompact(top.revenue_total)}
              </p>
              <Link
                href={`/system/stores/${top.id}`}
                className="mt-4 inline-flex text-sm font-semibold text-mint-dark hover:underline"
              >
                Open store dashboard →
              </Link>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-3">
          <h2 className="text-lg font-bold text-gray-900">Console</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/system/stores" className="font-semibold text-mint-dark hover:underline">
                All stores
              </Link>
              <p className="text-xs text-gray-500">Search, sort, revenue, activate/deactivate</p>
            </li>
            <li>
              <Link href="/system/sites" className="font-semibold text-mint-dark hover:underline">
                Manage Site
              </Link>
              <p className="text-xs text-gray-500">Tenant sites, domains, API keys, and quick actions</p>
            </li>
            <li>
              <Link href="/system/billing" className="font-semibold text-mint-dark hover:underline">
                Billing &amp; subscriptions
              </Link>
              <p className="text-xs text-gray-500">Plans, tenant subscriptions, invoices, refunds, gateway readiness</p>
            </li>
            <li>
              <Link href="/system/content" className="font-semibold text-mint-dark hover:underline">
                Content (CMS)
              </Link>
              <p className="text-xs text-gray-500">Pages, metaobjects, files, menus, and blog for any store</p>
            </li>
            <li>
              <Link href="/system/marketplace-theme" className="font-semibold text-mint-dark hover:underline">
                Marketplace home theme
              </Link>
              <p className="text-xs text-gray-500">
                Edit sections &amp; colors for the public apex home (e.g. mint-shop.pro). Set{' '}
                <code className="text-[10px] text-gray-600">NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG</code> to apply on{' '}
                <code className="text-[10px] text-gray-600">/</code>.
              </p>
            </li>
            <li>
              <Link href="/system/campaigns" className="font-semibold text-mint-dark hover:underline">
                Campaigns
              </Link>
              <p className="text-xs text-gray-500">Outbound SMS log, delivery progress, and new campaign records</p>
            </li>
            <li>
              <Link href="/system/observability" className="font-semibold text-mint-dark hover:underline">
                Observability
              </Link>
              <p className="text-xs text-gray-500">Status endpoint and signals</p>
            </li>
            <li>
              <Link href="/system/access" className="font-semibold text-mint-dark hover:underline">
                Identity
              </Link>
              <p className="text-xs text-gray-500">Access and IdP context</p>
            </li>
            <li>
              <Link href="/system/security" className="font-semibold text-mint-dark hover:underline">
                Security
              </Link>
              <p className="text-xs text-gray-500">Policies and posture notes</p>
            </li>
          </ul>
        </section>

        {/* Recent stores */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recently created stores</h2>
              <p className="mt-1 text-xs text-gray-500">Newest tenants (same ordering as default store list).</p>
            </div>
            <Link href="/system/stores" className="text-sm font-semibold text-mint-dark hover:underline">
              View full directory →
            </Link>
          </div>
          {recentStores.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              {storesPayload ? 'No stores returned.' : 'Sign in with a super-admin token to load store data.'}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-2 pr-3">Store</th>
                    <th className="pb-2 pr-3">Slug</th>
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2 pr-3">State</th>
                    <th className="pb-2 pr-3 text-right">Revenue</th>
                    <th className="pb-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentStores.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/80">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/system/stores/${row.id}`}
                          className="font-semibold text-gray-900 hover:text-mint-dark hover:underline"
                        >
                          {row.name}
                        </Link>
                        <p className="text-xs text-gray-500">{row.email ?? '—'}</p>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-mint-dark">{row.slug}</td>
                      <td className="py-2.5 pr-3 capitalize text-gray-700">{row.plan}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                            row.is_active
                              ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
                              : 'bg-gray-100 text-gray-600 ring-gray-200'
                          }`}
                        >
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-xs font-semibold tabular-nums text-gray-900">
                        {formatRevenueCompact(row.revenue_total ?? 0)}
                      </td>
                      <td className="py-2.5 text-right text-xs tabular-nums text-gray-600">
                        {row.qualifying_orders_count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Integration & app health */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-12">
          <h2 className="text-lg font-bold text-gray-900">This app &amp; integrations</h2>
          <p className="mt-1 text-xs text-gray-500">
            Read from <code className="rounded bg-gray-100 px-1">getSystemStatusSnapshot()</code> and your environment —
            useful when debugging sign-in or API calls from the operator UI.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CheckRow
              ok={status.apiBaseConfigured}
              label="Backoffice API URL"
              detail={status.apiBaseConfigured ? 'NEXT_PUBLIC_API_URL (or MINT_API_URL) is set' : 'Missing — UI cannot call Laravel'}
            />
            <CheckRow
              ok={status.keycloakIssuerConfigured}
              label="Keycloak issuer"
              detail={
                status.keycloakIssuerConfigured
                  ? 'KEYCLOAK_ISSUER is set'
                  : 'KEYCLOAK_ISSUER not set — OIDC will not work'
              }
            />
            <CheckRow
              ok={status.idpWellKnownOk === true}
              label="IdP discovery"
              detail={
                status.idpWellKnownOk === true
                  ? '.well-known/openid-configuration reachable'
                  : status.idpWellKnownOk === false
                    ? 'Could not reach IdP metadata URL'
                    : 'Skipped (issuer not configured)'
              }
            />
            <CheckRow
              ok={status.authSecretConfigured}
              label="Session signing"
              detail={status.authSecretConfigured ? 'AUTH_SECRET / NEXTAUTH_SECRET set' : 'Required for NextAuth session'}
            />
            <CheckRow
              ok={!status.marketplaceMaintenance.active}
              label="Marketplace maintenance"
              detail={
                status.marketplaceMaintenance.active
                  ? `Active (${status.marketplaceMaintenance.scope})${
                      status.marketplaceMaintenance.forcedByEnv ? ' — MAINTENANCE_MODE env' : ''
                    }`
                  : 'Public apex home/browse not in maintenance'
              }
            />
            <CheckRow
              ok={!status.registrationPaused}
              label="Apex registration"
              detail={
                status.registrationPaused ? 'Paused — configure in Platform' : 'Signup open on marketplace apex'
              }
            />
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-400">NODE_ENV</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{status.environment}</dd>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-400">Stores API data</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {storesPayload ? (
                  <span className="text-emerald-700">Loaded ({storesPayload.total.toLocaleString()} stores)</span>
                ) : storesError ? (
                  <span className="text-amber-700">Error</span>
                ) : (
                  <span className="text-gray-500">Not loaded</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-400">
            Raw JSON for automation:{' '}
            <code className="rounded bg-gray-100 px-1">GET /api/system/status</code> (super-admin session required).
          </p>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
      <span
        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-600">{detail}</p>
      </div>
    </div>
  );
}
