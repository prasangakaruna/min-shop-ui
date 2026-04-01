import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { mintDeployRootHostname, normalizeHostHeaderForPublicHttps } from '@/lib/proxyPublicOrigin';

declare module 'next-auth' {
  interface Session {
    access_token?: string | null;
    isSuperAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    access_token_expires?: number;
    isSuperAdmin?: boolean;
  }
}

/** Decode JWT payload without verification (we trust Keycloak). Returns payload or {}. */
function decodeJwtPayload(accessToken: string | undefined): Record<string, unknown> {
  if (!accessToken || typeof accessToken !== 'string') return {};
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function hasSuperAdminRole(payload: Record<string, unknown>): boolean {
  const role = process.env.SUPER_ADMIN_ROLE ?? 'super_admin';
  const realmRoles = (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  if (realmRoles.includes(role)) return true;
  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  if (resourceAccess) {
    for (const client of Object.values(resourceAccess)) {
      if (client?.roles?.includes(role)) return true;
    }
  }
  return false;
}

// NextAuth requires AUTH_SECRET or NEXTAUTH_SECRET for session signing. Without it, /api/auth/session returns 500.
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

/** Session + encoded JWT cookie lifetime (seconds). Default 1 year; override with AUTH_SESSION_MAX_AGE. Keycloak SSO must allow refresh for that long — see Mint e-commerce-api/docs/KEYCLOAK.md */
const DEFAULT_SESSION_MAX_AGE = 365 * 24 * 60 * 60;
function sessionMaxAgeSeconds(): number {
  const raw = process.env.AUTH_SESSION_MAX_AGE?.trim();
  if (!raw) return DEFAULT_SESSION_MAX_AGE;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 300 ? n : DEFAULT_SESSION_MAX_AGE;
}

/**
 * OAuth redirect_uri sent to Keycloak (single URI for all store subdomains).
 * Use the marketplace apex only, e.g. https://mint-shop.pro — do NOT use AUTH_URL for this:
 * next-auth rewrites requests to AUTH_URL, which breaks storing the real host in OAuth state.
 * Auth.js forwards Keycloak's callback to the store host automatically (redirect proxy).
 */
function resolveKeycloakRedirectOrigin(): string {
  const explicit = process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.replace(/\/$/, '').trim();
  if (explicit) return explicit;
  // Avoid forcing production apex OAuth when developing on localhost with NEXT_PUBLIC_MINT_ROOT_DOMAIN set.
  if (process.env.NODE_ENV !== 'production') return '';
  const root = mintDeployRootHostname();
  if (root) return `https://${root}`;
  return '';
}
const keycloakRedirectOrigin = resolveKeycloakRedirectOrigin();
const keycloakRedirectProxyBase =
  keycloakRedirectOrigin.length > 0 ? `${keycloakRedirectOrigin}/api/auth` : undefined;

if (typeof window === 'undefined' && keycloakRedirectProxyBase && !process.env.AUTH_COOKIE_DOMAIN?.trim()) {
  console.warn(
    '[auth] AUTH_KEYCLOAK_REDIRECT_ORIGIN (or production root domain) is set but AUTH_COOKIE_DOMAIN is not. ' +
      'Sign-in from store subdomains will fail PKCE unless OAuth cookies are shared. Set AUTH_COOKIE_DOMAIN=.yourroot.com ' +
      '(leading dot) to match NEXT_PUBLIC_MINT_ROOT_DOMAIN, or sign in only from the apex host.'
  );
}

const canonicalAuthEnv = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.trim();
function authEnvOriginSameAsKeycloakApex(): boolean {
  if (!canonicalAuthEnv || !keycloakRedirectOrigin) return false;
  try {
    const a = new URL(canonicalAuthEnv.startsWith('http') ? canonicalAuthEnv : `https://${canonicalAuthEnv}`).origin;
    const b = new URL(keycloakRedirectOrigin).origin;
    return a === b;
  } catch {
    return false;
  }
}
if (
  process.env.NODE_ENV === 'production' &&
  canonicalAuthEnv &&
  keycloakRedirectProxyBase &&
  !authEnvOriginSameAsKeycloakApex()
) {
  console.warn(
    '[auth] AUTH_URL / NEXTAUTH_URL differs from AUTH_KEYCLOAK_REDIRECT_ORIGIN — ' +
      'next-auth rewrites the request host; PKCE cookies on a store subdomain can break the apex Keycloak callback. ' +
      'Either unset AUTH_URL and rely on proxy headers + src/lib/authProxyRequest.ts, or set AUTH_URL to the same origin as AUTH_KEYCLOAK_REDIRECT_ORIGIN (e.g. https://mint-shop.pro).'
  );
}

/** Optional e.g. .mint-shop.pro — share session across *.mint-shop.pro (requires __Secure- CSRF name, not __Host-). */
const authCookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

function mintRootDomain(): string | undefined {
  const fromCookie = authCookieDomain?.replace(/^\./, '').trim();
  const fromPublic = process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN?.replace(/^\./, '').trim();
  return fromCookie || fromPublic || undefined;
}

function hostnameUnderMintRoot(hostname: string, root: string): boolean {
  return hostname === root || hostname.endsWith(`.${root}`);
}

/** Allow post-login redirects between apex and store subdomains when NEXT_PUBLIC_MINT_ROOT_DOMAIN (or AUTH_COOKIE_DOMAIN) is set. */
function hostAllowedForRedirect(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url);
    const b = new URL(baseUrl);
    if (u.origin === b.origin) return true;
    const root = mintRootDomain();
    if (!root) return false;
    return hostnameUnderMintRoot(u.hostname, root) && hostnameUnderMintRoot(b.hostname, root);
  } catch {
    return false;
  }
}

/** Browser on https://localhost:3000 while NextAuth infers http://localhost:3000 → origins differ; default redirect would send users to `/` instead of `/auth/after-login`. */
function localhostSameHostIgnoreScheme(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url);
    const b = new URL(baseUrl);
    const local = (h: string) => h === 'localhost' || h === '127.0.0.1';
    if (!local(u.hostname) || !local(b.hostname)) return false;
    return u.hostname === b.hostname && u.port === b.port;
  } catch {
    return false;
  }
}

/** Real browser host behind nginx (avoids NEXTAUTH_URL=http(s)://localhost:3000 leaking into OAuth redirects). */
async function getTrustedRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const hostRaw = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim();
    if (!hostRaw) {
      const root = mintDeployRootHostname();
      if (root) return `https://${root}`;
      const apex = process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.replace(/\/$/, '').trim();
      if (apex) return apex;
      return 'http://localhost:3000';
    }
    let proto = (h.get('x-forwarded-proto') ?? (hostRaw.includes('localhost') ? 'http' : 'https'))
      .split(',')[0]
      .trim()
      .replace(/:$/, '');
    const isHttps = proto === 'https';
    const host = normalizeHostHeaderForPublicHttps(hostRaw, isHttps);
    let origin = `${proto}://${host}`;
    if (process.env.NODE_ENV === 'production' && isHttps) {
      try {
        const u = new URL(origin);
        if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
          u.port = '';
          origin = u.origin;
        }
      } catch {
        /* keep origin */
      }
    }
    return origin;
  } catch {
    const root = mintDeployRootHostname();
    if (root) return `https://${root}`;
    return 'http://localhost:3000';
  }
}

function rewriteLocalhostTargetToOrigin(target: string, requestOrigin: string): string {
  try {
    const u = new URL(target);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return target;
    const ro = new URL(requestOrigin);
    return `${ro.origin}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return target;
  }
}

function crossSubdomainCookieOptions(): Record<
  string,
  { name?: string; options: { domain: string; path: string; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' } }
> {
  if (!authCookieDomain) return {};
  const d = authCookieDomain;
  const useSecure =
    process.env.AUTH_USE_SECURE_COOKIES === 'true' || process.env.NODE_ENV === 'production';
  return {
    sessionToken: { options: { domain: d, path: '/' } },
    callbackUrl: { options: { domain: d, path: '/' } },
    csrfToken: {
      name: useSecure ? '__Secure-authjs.csrf-token' : 'authjs.csrf-token',
      options: { domain: d, path: '/', secure: useSecure, sameSite: 'lax' },
    },
    pkceCodeVerifier: { options: { domain: d, path: '/' } },
    state: { options: { domain: d, path: '/' } },
    nonce: { options: { domain: d, path: '/' } },
  };
}

// Keycloak issuer: no trailing slash (must match Keycloak's .well-known/openid-configuration)
const keycloakIssuer = (process.env.KEYCLOAK_ISSUER ?? 'http://localhost:9091/realms/mint').replace(/\/$/, '').trim();
// Only send client_secret if client is confidential; for public client leave KEYCLOAK_CLIENT_SECRET unset
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim() || undefined;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refresh_token) return token;
  try {
    const url = `${keycloakIssuer}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KEYCLOAK_CLIENT_ID ?? 'mint-ecommerce',
      refresh_token: token.refresh_token,
    });
    if (keycloakClientSecret) {
      body.set('client_secret', keycloakClientSecret);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        const text = await res.text().catch(() => '');
        console.warn('[auth] Keycloak refresh_token exchange failed:', res.status, text.slice(0, 500));
      }
      return token;
    }
    const refreshed = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!refreshed.access_token) return token;
    const payload = decodeJwtPayload(refreshed.access_token);
    token.access_token = refreshed.access_token;
    if (refreshed.refresh_token) token.refresh_token = refreshed.refresh_token;
    if (typeof refreshed.expires_in === 'number') {
      token.access_token_expires = Math.floor(Date.now() / 1000) + refreshed.expires_in;
    }
    token.isSuperAdmin = hasSuperAdminRole(payload);
    return token;
  } catch {
    return token;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  session: {
    maxAge: sessionMaxAgeSeconds(),
  },
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'mint-ecommerce',
      clientSecret: keycloakClientSecret,
      issuer: keycloakIssuer,
      // Public Keycloak clients must not use client_secret at the token endpoint; Auth.js defaults to client_secret_basic otherwise.
      ...(keycloakClientSecret
        ? {}
        : { client: { token_endpoint_auth_method: 'none' as const } }),
      ...(keycloakRedirectProxyBase ? { redirectProxyUrl: keycloakRedirectProxyBase } : {}),
    }),
  ],
  cookies: crossSubdomainCookieOptions(),
  callbacks: {
    async redirect({ url, baseUrl }) {
      const requestOrigin = await getTrustedRequestOrigin();
      if (url.startsWith('/')) {
        return rewriteLocalhostTargetToOrigin(`${requestOrigin}${url}`, requestOrigin);
      }
      let next = rewriteLocalhostTargetToOrigin(url, requestOrigin);
      if (hostAllowedForRedirect(next, requestOrigin)) return next;
      if (localhostSameHostIgnoreScheme(next, requestOrigin)) return next;
      if (hostAllowedForRedirect(next, baseUrl)) return next;
      if (localhostSameHostIgnoreScheme(next, baseUrl)) return next;
      return requestOrigin.replace(/\/$/, '');
    },
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.access_token_expires = account.expires_at;
        const payload = decodeJwtPayload(account.access_token);
        (token as JWT).isSuperAdmin = hasSuperAdminRole(payload);
        return token;
      }
      const expiresAt = token.access_token_expires;
      if (expiresAt && typeof expiresAt === 'number') {
        const now = Math.floor(Date.now() / 1000);
        // Refresh if token will expire in the next 60 seconds
        if (now > expiresAt - 60) {
          token = await refreshAccessToken(token as JWT);
        }
      }
      return token as JWT;
    },
    async session({ session, token }) {
      if (session) {
        const t = token as JWT;
        (session as Session & { access_token?: string | null; isSuperAdmin?: boolean }).access_token = t?.access_token ?? null;
        (session as Session & { isSuperAdmin?: boolean }).isSuperAdmin = t?.isSuperAdmin ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  trustHost: true,
  /** Verbose Auth.js logs in the Next.js terminal (set AUTH_DEBUG=1 in .env.local). Never enable in production. */
  debug: process.env.AUTH_DEBUG === '1' || process.env.AUTH_DEBUG === 'true',
});
