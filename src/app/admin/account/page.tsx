'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { apiRequest, type Me } from '@/lib/api';

export default function AdminAccountPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiRequest<Me>('/me', { token })
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-full">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-mint">← Home</Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">My account</h1>
          <p className="mt-0.5 text-sm text-gray-500">Your profile from the API</p>
        </div>
      </div>

      <div className="p-6 max-w-lg">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        ) : me ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
                <dd className="mt-1 text-gray-900">{me.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                <dd className="mt-1 text-gray-900">{me.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</dt>
                <dd className="mt-1 font-mono text-sm text-gray-600">{me.id}</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-gray-500">
              To change your password or profile in Keycloak, use your organization&apos;s account management or contact your administrator.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Not signed in or could not load profile.</p>
        )}
      </div>
    </div>
  );
}
