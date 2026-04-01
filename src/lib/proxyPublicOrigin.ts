import type { NextRequest } from 'next/server';

function internalListenPorts(): Set<string> {
  return new Set(['3000', process.env.PORT].filter(Boolean) as string[]);
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
    const root = process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN?.replace(/^\./, '').trim();
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
