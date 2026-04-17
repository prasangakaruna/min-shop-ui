import { MOCK_AUDIT } from '@/lib/systemConsoleMock';

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit samples and data-governance placeholders. Ship immutable audit storage and export jobs behind these views.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">Retention (stub)</h2>
          <p className="mt-2 text-sm text-gray-600">
            Configure TTL by data class, preview impact, and schedule legal holds — integrate with your warehouse
            policies.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">Data subject requests (stub)</h2>
          <p className="mt-2 text-sm text-gray-600">
            Intake export/delete workflows with ticket IDs and completion evidence — no PII shown in this demo.
          </p>
        </section>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent audit events</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Demo</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Principal</th>
                <th className="px-4 py-3 font-medium">Verb</th>
                <th className="px-4 py-3 font-medium">Object</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_AUDIT.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.time}</td>
                  <td className="px-4 py-3 text-gray-800">{a.principal}</td>
                  <td className="px-4 py-3 font-medium text-mint-dark">{a.verb}</td>
                  <td className="px-4 py-3 text-gray-600">{a.object}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
