import Link from 'next/link';
import { headers } from 'next/headers';
import { mintPublicApexHttpsUrl, mintPublicRootHostname } from '@/lib/mintPublicRootDomain';
import { normalizeHostHeaderForPublicHttps } from '@/lib/proxyPublicOrigin';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isConfiguration = error === 'Configuration';

  const h = await headers();
  const forwardedHost = h.get('x-forwarded-host');
  const hostRaw = (forwardedHost ?? h.get('host') ?? '').split(',')[0].trim();
  const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0].trim().replace(/:$/, '') ?? '';
  const isLocal =
    !hostRaw ||
    hostRaw.startsWith('localhost') ||
    hostRaw.startsWith('127.') ||
    hostRaw.includes('localhost:');
  const scheme = forwardedProto || (isLocal ? 'http' : 'https');
  const isHttps = scheme === 'https';
  const host = normalizeHostHeaderForPublicHttps(hostRaw, isHttps);
  const envBase = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const apexRedirect =
    process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.replace(/\/$/, '') || mintPublicApexHttpsUrl() || '';
  const origin = hostRaw && host ? `${scheme}://${host}` : envBase;
  const callbackUrlThisHost = `${origin}/api/auth/callback/keycloak`;
  const callbackUrlApex = apexRedirect ? `${apexRedirect}/api/auth/callback/keycloak` : '';
  const canonicalAuthEnv = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.trim();
  const redirectProxyConfigured = !!(
    process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.trim() || mintPublicRootHostname()
  );
  const nextAuthUrlBreaksTenantOAuth = !!(canonicalAuthEnv && redirectProxyConfigured);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in error</h1>
        <p className="text-gray-600 mb-4">
          {isConfiguration
            ? 'Sign-in could not finish after Keycloak. The browser only shows a generic code; the actual reason is recorded on the server.'
            : 'An error occurred during sign-in. Please try again.'}
        </p>

        {isConfiguration && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold text-emerald-900">What to do next</p>
            <ol className="mt-2 list-decimal list-inside space-y-1.5">
              <li>
                Reproduce sign-in once, then search the Next.js server logs for{' '}
                <code className="rounded bg-white/80 px-1 py-0.5 text-xs ring-1 ring-emerald-200">[mint-shop-auth]</code>. That line includes
                Keycloak&apos;s HTTP status and response body (for example <code className="text-xs">invalid_client</code> or{' '}
                <code className="text-xs">invalid_grant</code>).
              </li>
              <li>
                Production: <code className="text-xs">pm2 logs</code>, Docker logs, or journalctl for the Node process. Local: the terminal
                running <code className="text-xs">next dev</code>.
              </li>
            </ol>
          </div>
        )}

        {isConfiguration && (
          <details className="mb-3 rounded-md border border-gray-200 bg-white text-sm text-gray-700 open:shadow-sm">
            <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-gray-900 hover:bg-gray-50">
              Why it says &quot;Configuration&quot; and extra logging
            </summary>
            <div className="border-t border-gray-100 px-3 py-3 space-y-2 text-gray-600">
              <p>
                Auth.js does not put provider errors in the URL, so many OAuth failures look the same. For more detail you can set{' '}
                <code className="rounded bg-gray-100 px-1">AUTH_DEBUG=1</code>, restart once, reproduce, then turn it off.
              </p>
              <p>
                Optional: set <code className="rounded bg-gray-100 px-1">AUTH_DIAG_SECRET</code> on the server, then open{' '}
                <code className="rounded bg-gray-100 px-1 text-xs">/api/internal/auth-health?key=…</code> to confirm the app can reach Keycloak
                OpenID metadata from that environment.
              </p>
            </div>
          </details>
        )}

        {isConfiguration && isLocal && (
          <details className="mb-3 rounded-md border border-sky-200 bg-sky-50/80 text-sm text-sky-950">
            <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-sky-900 hover:bg-sky-100/80">
              Local development (localhost)
            </summary>
            <ul className="list-disc list-inside space-y-1.5 border-t border-sky-200/80 px-3 py-3 text-sky-900">
              <li>
                <strong>Keycloak must match KEYCLOAK_ISSUER</strong> — e.g. if it is{' '}
                <code className="rounded bg-sky-100 px-1 text-xs">http://localhost:9091/realms/...</code>, that host must be reachable from your
                machine.
              </li>
              <li>
                In the Keycloak client, add{' '}
                <code className="rounded bg-sky-100 px-1 text-xs">http://localhost:3000/api/auth/callback/keycloak</code> under Valid redirect
                URIs.
              </li>
              <li>
                If <code className="rounded bg-sky-100 px-1 text-xs">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code> points at production, the browser will
                return to production after login, not localhost — remove it for local Keycloak or add the production callback in Keycloak.
              </li>
              <li>
                Confidential client: <code className="rounded bg-sky-100 px-1 text-xs">KEYCLOAK_CLIENT_SECRET</code> in <code className="text-xs">.env</code>{' '}
                must match Keycloak.
              </li>
            </ul>
          </details>
        )}

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
          <details className="mb-6 rounded-md border border-amber-200 bg-amber-50/90 text-left text-sm text-amber-950 open:shadow-sm">
            <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-amber-900 hover:bg-amber-100/80">
              Keycloak checklist (redirect URI, client type, AUTH_SECRET)
            </summary>
            <ul className="list-disc list-inside space-y-2 border-t border-amber-200/80 px-3 py-3 text-amber-900">
              <li>
                <strong>Redirect URI</strong> — Path must be exactly{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">/api/auth/callback/keycloak</code>. In Keycloak for client{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">mint-ecommerce</code>, valid redirect URIs:
                {callbackUrlApex ? (
                  <>
                    <span className="mt-1 block opacity-90">
                      With apex redirect, register the <strong>apex</strong> callback:
                    </span>
                    <code className="mt-1 block break-all rounded border border-amber-200 bg-white p-2 text-xs">{callbackUrlApex}</code>
                    <span className="mt-1 block opacity-90">Plus localhost if needed:</span>
                    <code className="mt-1 block break-all rounded border border-amber-200 bg-white p-2 text-xs">
                      http://localhost:3000/api/auth/callback/keycloak
                    </code>
                  </>
                ) : (
                  <>
                    <span className="mt-1 block opacity-90">For this host, e.g.:</span>
                    <code className="mt-1 block break-all rounded border border-amber-200 bg-white p-2 text-xs">{callbackUrlThisHost}</code>
                    <span className="mt-1 block opacity-90">
                      For many subdomains, set <code className="rounded bg-amber-100 px-1 text-xs">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code> and register
                      only the apex callback (or a supported wildcard in Keycloak).
                    </span>
                  </>
                )}
              </li>
              <li>
                <strong>Client type</strong> — Public client: leave <code className="rounded bg-amber-100 px-1 text-xs">KEYCLOAK_CLIENT_SECRET</code>{' '}
                empty. Confidential: set the secret to match Keycloak.
              </li>
              <li>
                <strong>NEXTAUTH_URL / AUTH_URL</strong> — With <code className="rounded bg-amber-100 px-1 text-xs">AUTH_KEYCLOAK_REDIRECT_ORIGIN</code>{' '}
                and store subdomains, omit both in production; use <code className="rounded bg-amber-100 px-1 text-xs">AUTH_TRUST_HOST=true</code>{' '}
                behind the proxy.
              </li>
              <li>
                <strong>AUTH_SECRET</strong> — Required in production (e.g. <code className="text-xs">openssl rand -base64 32</code>).
              </li>
            </ul>
          </details>
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
