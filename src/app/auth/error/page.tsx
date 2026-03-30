import Link from 'next/link';
import { headers } from 'next/headers';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isConfiguration = error === 'Configuration';

  const h = await headers();
  const forwardedHost = h.get('x-forwarded-host');
  const host = (forwardedHost ?? h.get('host') ?? '').split(',')[0].trim();
  const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0].trim();
  const isLocal =
    !host || host.startsWith('localhost') || host.startsWith('127.') || host.includes('localhost:');
  const scheme = forwardedProto || (isLocal ? 'http' : 'https');
  const envBase = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const apexRedirect =
    process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.replace(/\/$/, '') ||
    (process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN.replace(/^\./, '')}`
      : '');
  const origin =
    host && !isLocal ? `${scheme}://${host}` : host && isLocal ? `${scheme}://${host}` : envBase;
  const callbackUrlThisHost = `${origin}/api/auth/callback/keycloak`;
  const callbackUrlApex = apexRedirect ? `${apexRedirect}/api/auth/callback/keycloak` : '';
  const canonicalAuthEnv = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.trim();
  const redirectProxyConfigured = !!(
    process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN?.trim()
  );
  const nextAuthUrlBreaksTenantOAuth = !!(canonicalAuthEnv && redirectProxyConfigured);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in error</h1>
        <p className="text-gray-600 mb-4">
          {isConfiguration
            ? 'There is a problem with the server configuration. This often happens after registering or logging in with Keycloak when the callback fails.'
            : 'An error occurred during sign-in. Please try again.'}
        </p>

        {isConfiguration && nextAuthUrlBreaksTenantOAuth && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="font-semibold text-red-900 mb-1">Likely fix: unset NEXTAUTH_URL (and AUTH_URL)</p>
            <p className="text-sm text-red-800">
              You have <code className="bg-red-100 px-1 rounded">NEXTAUTH_URL</code> or{' '}
              <code className="bg-red-100 px-1 rounded">AUTH_URL</code> set <em>and</em> apex Keycloak redirect (
              <code className="bg-red-100 px-1 rounded">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code> / root domain). NextAuth
              then rewrites every auth request to that apex URL, but the browser still uses your store subdomain for
              cookies—so after Keycloak sends users to <code className="bg-red-100 px-1 rounded">mint-shop.pro</code>,
              the PKCE cookie is missing and sign-in fails.
            </p>
            <p className="text-sm text-red-800 mt-2">
              <strong>Do this:</strong> remove <code className="bg-red-100 px-1 rounded">NEXTAUTH_URL</code> and{' '}
              <code className="bg-red-100 px-1 rounded">AUTH_URL</code> from production env, keep{' '}
              <code className="bg-red-100 px-1 rounded">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code>, add{' '}
              <code className="bg-red-100 px-1 rounded">AUTH_TRUST_HOST=true</code>, redeploy.
            </p>
          </div>
        )}

        {isConfiguration && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <p className="font-medium text-amber-900 mb-2">Check the following in Keycloak and your app:</p>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>
                <strong>Redirect URI</strong> — Path must be exactly{' '}
                <code className="bg-amber-100 px-1 rounded">/api/auth/callback/keycloak</code> (not{' '}
                <code className="bg-amber-100 px-1 rounded">/keyclo</code>). In Keycloak, for client{' '}
                <code className="bg-amber-100 px-1 rounded">mint-ecommerce</code>, add <strong>Valid redirect URIs</strong>:
                {callbackUrlApex ? (
                  <>
                    <span className="block mt-1 text-amber-900/90">
                      With <code className="bg-amber-100 px-1 rounded">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code> (or{' '}
                      <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_MINT_ROOT_DOMAIN</code>), register the{' '}
                      <strong>apex</strong> callback only:
                    </span>
                    <code className="block mt-1 p-2 bg-white rounded text-xs break-all border border-amber-200">
                      {callbackUrlApex}
                    </code>
                    <span className="block mt-1 text-amber-900/90">Plus localhost if you use it:</span>
                    <code className="block mt-1 p-2 bg-white rounded text-xs break-all border border-amber-200">
                      http://localhost:3000/api/auth/callback/keycloak
                    </code>
                  </>
                ) : (
                  <>
                    <span className="block mt-1 text-amber-900/90">
                      Either one URI per host (this request&apos;s host), e.g.:
                    </span>
                    <code className="block mt-1 p-2 bg-white rounded text-xs break-all border border-amber-200">
                      {callbackUrlThisHost}
                    </code>
                    <span className="block mt-1 text-amber-900/90">
                      For <strong>many stores</strong> without listing each subdomain, set{' '}
                      <code className="bg-amber-100 px-1 rounded">AUTH_KEYCLOAK_REDIRECT_ORIGIN=https://your-apex.com</code> in the UI env and
                      register only that apex callback, or use a Keycloak <strong>wildcard</strong> if your version supports it (e.g.{' '}
                      <code className="bg-amber-100 px-1 rounded">https://*.mint-shop.pro/*</code>).
                    </span>
                  </>
                )}
              </li>
              <li>
                <strong>Client type</strong> — If the client is <strong>Public</strong>, leave <code className="bg-amber-100 px-1 rounded">KEYCLOAK_CLIENT_SECRET</code> empty in <code className="bg-amber-100 px-1 rounded">.env</code>. If it is <strong>Confidential</strong>, set the client secret.
              </li>
              <li>
                <strong>NEXTAUTH_URL / AUTH_URL</strong> — For store subdomains with{' '}
                <code className="bg-amber-100 px-1 rounded">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code>, <strong>omit both</strong>{' '}
                in production (they rewrite the host and break PKCE on the apex callback). Use{' '}
                <code className="bg-amber-100 px-1 rounded">AUTH_TRUST_HOST=true</code> behind your reverse proxy. Local dev
                can keep <code className="bg-amber-100 px-1 rounded">NEXTAUTH_URL=http://localhost:3000</code> only if you are
                not using the apex redirect on localhost.
              </li>
              <li>
                <strong>AUTH_SECRET</strong> — Must be set in production (e.g. <code className="bg-amber-100 px-1 rounded">openssl rand -base64 32</code>
                ). Missing secret often surfaces as a configuration error.
              </li>
              <li>Check the server/terminal logs for the exact OAuth or Keycloak error.</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex justify-center items-center px-4 py-2 bg-mint text-white rounded-md hover:opacity-90 transition"
          >
            Back to login
          </Link>
          <Link
            href="/signup"
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Try sign up again
          </Link>
        </div>
      </div>
    </div>
  );
}
