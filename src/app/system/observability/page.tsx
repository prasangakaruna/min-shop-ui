import { getSystemStatusSnapshot } from '@/lib/systemStatus';

export default async function ObservabilityPage() {
  const status = await getSystemStatusSnapshot();

  const m = status.marketplaceMaintenance;
  const maintDetail = m.active
    ? `ON · scope ${m.scope}${m.forcedByEnv ? ' · forced by MAINTENANCE_MODE env' : ''}${m.bypassSecretConfigured ? ' · bypass secret set' : ''}`
    : `Off · scope ${m.scope}${m.bypassSecretConfigured ? ' · bypass secret ready' : ''}`;

  const rows = [
    { name: 'Application process', detail: 'Next.js server responding', ok: true },
    {
      name: 'OpenID well-known',
      detail: status.keycloakIssuerConfigured ? 'Fetched from KEYCLOAK_ISSUER' : 'Issuer not configured',
      ok: status.keycloakIssuerConfigured && status.idpWellKnownOk === true,
    },
    { name: 'Session signing secret', detail: 'Required for /api/auth/session', ok: status.authSecretConfigured },
    {
      name: 'Backend API URL (env)',
      detail: status.apiBaseConfigured
        ? 'NEXT_PUBLIC_API_URL (or MINT_API_URL fallback) set — value not shown'
        : 'Not set — /system cannot load live store metrics',
      ok: status.apiBaseConfigured,
    },
    {
      name: 'Marketplace maintenance',
      detail: maintDetail,
      /** Informational: deliberate maintenance is not a failing check. */
      ok: true,
    },
    {
      name: 'Marketplace registration',
      detail: status.registrationPaused
        ? 'Paused — new signups on apex /signup see a hold screen'
        : 'Open — apex /signup works normally',
      ok: true,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Observability</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lightweight reachability checks from the app process. Extend with your APM, logs, and traces here.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Check</th>
              <th className="px-4 py-3 font-medium">Detail</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.detail}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {r.ok ? 'Pass' : 'Fail'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-dashed border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">JSON snapshot API</h2>
        <p className="mt-2 text-sm text-gray-600">
          Super-admins can call{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-mint-dark">GET /api/system/status</code> for the same
          payload (useful for monitoring).
        </p>
      </section>
    </div>
  );
}
