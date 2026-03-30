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
  const origin =
    host && !isLocal ? `${scheme}://${host}` : host && isLocal ? `${scheme}://${host}` : envBase;
  const callbackUrl = `${origin}/api/auth/callback/keycloak`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in error</h1>
        <p className="text-gray-600 mb-4">
          {isConfiguration
            ? 'There is a problem with the server configuration. This often happens after registering or logging in with Keycloak when the callback fails.'
            : 'An error occurred during sign-in. Please try again.'}
        </p>

        {isConfiguration && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <p className="font-medium text-amber-900 mb-2">Check the following in Keycloak and your app:</p>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>
                <strong>Redirect URI</strong> — In Keycloak, for client <code className="bg-amber-100 px-1 rounded">mint-ecommerce</code>, add{' '}
                <strong>Valid redirect URIs</strong> for <em>every</em> host users sign in from (apex + each store subdomain), e.g.:
                <code className="block mt-1 p-2 bg-white rounded text-xs break-all border border-amber-200">{callbackUrl}</code>
                <span className="block mt-1 text-amber-900/90">
                  For <strong>many stores</strong> on <code className="bg-amber-100 px-1 rounded">{'{slug}'}.yourdomain.com</code>, either add each
                  callback URI or configure a <strong>wildcard</strong> redirect in Keycloak (e.g.{' '}
                  <code className="bg-amber-100 px-1 rounded">https://*.mint-shop.pro/*</code>) if your Keycloak version supports it.
                </span>
              </li>
              <li>
                <strong>Client type</strong> — If the client is <strong>Public</strong>, leave <code className="bg-amber-100 px-1 rounded">KEYCLOAK_CLIENT_SECRET</code> empty in <code className="bg-amber-100 px-1 rounded">.env</code>. If it is <strong>Confidential</strong>, set the client secret.
              </li>
              <li>
                <strong>AUTH_URL / NEXTAUTH_URL</strong> — Set to your primary site URL with no trailing slash (e.g.{' '}
                <code className="bg-amber-100 px-1 rounded">https://mint-shop.pro</code>). With{' '}
                <code className="bg-amber-100 px-1 rounded">trustHost</code> enabled, sign-in still requires each origin&apos;s callback URI in
                Keycloak.
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
