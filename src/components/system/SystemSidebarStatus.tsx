'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Snapshot = {
  at: string;
  environment: string;
  apiBaseConfigured: boolean;
  keycloakIssuerConfigured: boolean;
  idpWellKnownOk: boolean | null;
  authSecretConfigured: boolean;
};

function nominal(s: Snapshot): boolean {
  return (
    s.authSecretConfigured &&
    s.apiBaseConfigured &&
    (!s.keycloakIssuerConfigured || s.idpWellKnownOk === true)
  );
}

export function SystemSidebarStatus() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/system/status')
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((data: Snapshot) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-2 mt-4 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50/90 to-white px-3 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live status</p>
      {failed ? (
        <p className="mt-2 text-xs text-amber-700">Could not load status (session?)</p>
      ) : !snapshot ? (
        <p className="mt-2 text-xs text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${nominal(snapshot) ? 'bg-emerald-500' : 'bg-amber-500'}`}
              aria-hidden
            />
            <span className="text-xs font-semibold text-gray-800">
              {nominal(snapshot) ? 'Core integrations OK' : 'Needs attention'}
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-gray-600">
            <li className="flex justify-between gap-2">
              <span>API URL</span>
              <span className={snapshot.apiBaseConfigured ? 'text-emerald-600' : 'text-amber-600'}>
                {snapshot.apiBaseConfigured ? 'Set' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>IdP</span>
              <span
                className={
                  !snapshot.keycloakIssuerConfigured
                    ? 'text-gray-400'
                    : snapshot.idpWellKnownOk
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                }
              >
                {!snapshot.keycloakIssuerConfigured
                  ? '—'
                  : snapshot.idpWellKnownOk
                    ? 'Reachable'
                    : 'Check'}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Session</span>
              <span className={snapshot.authSecretConfigured ? 'text-emerald-600' : 'text-amber-600'}>
                {snapshot.authSecretConfigured ? 'Secret set' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-t border-gray-100 pt-1.5 text-gray-500">
              <span>Env</span>
              <span className="font-mono text-gray-700">{snapshot.environment}</span>
            </li>
          </ul>
        </>
      )}
      <Link
        href="/system/observability"
        className="mt-3 block text-center text-[11px] font-bold uppercase tracking-wide text-mint-dark hover:underline"
      >
        Full checks →
      </Link>
    </div>
  );
}
