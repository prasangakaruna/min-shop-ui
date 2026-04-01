import type { NextRequest } from 'next/server';
import { mintPublicRootHostname } from '@/lib/mintPublicRootDomain';

function internalListenPorts(): Set<string> {
  return new Set(['3000', process.env.PORT].filter(Boolean) as string[]);
}

/**
 * Root hostname for this deployment. Prefer server-safe vars: many hosts only inject
 * KEYCLOAK / cookie env at runtime, while NEXT_PUBLIC_* can be missing on the Node process.
 */
export function mintDeployRootHostname(): string | undefined {
  const fromPublic = mintPublicRootHostname();
  if (fromPublic) return fromPublic;
  const redirect = process.env.AUTH_KEYCLOAK_REDIRECT_ORIGIN?.replace(/\/$/, '').trim();
  if (redirect) {
    try {
      return new URL(redirect.startsWith('http') ? redirect : `https://${redirect}`).hostname;
    } catch {
      /* ignore */
    }
  }
  const cookie = process.env.AUTH_COOKIE_DOMAIN?.replace(/^\./, '').trim();
  return cookie || undefined;
}

/**
 * Host / X-Forwarded-Host may incorrectly include the Node listen port (e.g. `mint-shop.pro:3000`)
 * while TLS terminates on 443. Strip only known internal ports when the request is HTTPS.
 */
export function normalizeHostHeaderForPublicHttps(hostHeader: string, isHttps: boolean): string {
  const host = hostHeader.split(',')[0]?.trim() ?? '';
  if (!host || !isHttps) return host;
  try {
    const u = new URL(`https://${host}`);
    if (u.port && internalListenPorts().has(u.port)) {
      u.port = '';
      return u.host;
    }
  } catch {
    /* ignore */
  }
  return host;
}

/** Base URL for redirects when NEXTAUTH_URL / AUTH_URL are unset (Keycloak logout, etc.). */
export function publicOriginFromNextRequest(req: NextRequest): string {
  const raw =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim() ||
    '';
  const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().replace(/:$/, '') ?? '';
  const proto =
    xfProto ||
    (raw.includes('localhost') || raw.startsWith('127.') ? 'http' : 'https');
  const isHttps = proto === 'https';

  if (!raw) {
    const root = mintDeployRootHostname();
    if (root) return `https://${root}`;
    try {
      const u = new URL(req.url);
      if (u.port && internalListenPorts().has(u.port)) {
        u.port = '';
        return u.origin;
      }
      return u.origin;
    } catch {
      return 'http://localhost:3000';
    }
  }

  const host = normalizeHostHeaderForPublicHttps(raw, isHttps);
  return `${proto}://${host}`;
}
