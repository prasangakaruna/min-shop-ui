import { MOCK_ROLES } from '@/lib/systemConsoleMock';

export default function AccessControlPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Identity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Operator roles and scope summaries. This console is gated by Keycloak{' '}
          <code className="rounded bg-gray-100 px-1 text-mint-dark">super_admin</code> (or{' '}
          <code className="rounded bg-gray-100 px-1 text-mint-dark">SUPER_ADMIN_ROLE</code>).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium">Scopes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_ROLES.map((r) => (
              <tr key={r.role}>
                <td className="px-4 py-3 font-medium text-gray-900">{r.role}</td>
                <td className="px-4 py-3 text-gray-600">{r.members}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.scopes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        <p>
          <strong className="text-gray-900">Break-glass:</strong> implement time-boxed elevation with mandatory reason in
          your IdP or API layer; surface active elevations on the command center when available.
        </p>
      </section>
    </div>
  );
}
