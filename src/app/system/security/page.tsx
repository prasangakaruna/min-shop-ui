import { MOCK_SECURITY_SIGNALS } from '@/lib/systemConsoleMock';

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Security</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consolidated risk and authentication posture. Figures below are placeholders; connect SIEM or IdP analytics for
          production.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MOCK_SECURITY_SIGNALS.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="mt-2 text-xs text-gray-500">{s.hint}</p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Trend: {s.trend}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Response playbooks</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-600">
          <li>Bulk session revoke — wire to your IdP admin API from this screen.</li>
          <li>Emergency read-only — pair with feature flag or edge config (see Platform).</li>
          <li>IP allowlist for operator login — enforce at gateway or IdP policy.</li>
        </ul>
      </section>
    </div>
  );
}
