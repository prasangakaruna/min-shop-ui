import { MOCK_QUEUES } from '@/lib/systemConsoleMock';

function queueStyle(status: (typeof MOCK_QUEUES)[number]['status']) {
  switch (status) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700';
    case 'degraded':
      return 'bg-amber-50 text-amber-800';
    case 'stalled':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export default function OperationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Operations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Background processing and throughput. Demo queue depths — replace with real metrics from your broker or worker
          fleet.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Queue</th>
              <th className="px-4 py-3 font-medium">Depth</th>
              <th className="px-4 py-3 font-medium">Oldest wait</th>
              <th className="px-4 py-3 font-medium">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_QUEUES.map((q) => (
              <tr key={q.name}>
                <td className="px-4 py-3 font-mono text-xs font-medium text-mint-dark">{q.name}</td>
                <td className="px-4 py-3 text-gray-900">{q.depth.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{q.oldestSeconds}s</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${queueStyle(q.status)}`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400"
        >
          Pause consumers (stub)
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400"
        >
          Replay DLQ (stub)
        </button>
      </div>
    </div>
  );
}
