import { NextRequest } from 'next/server';
import { normalizeHostHeaderForPublicHttps } from '@/lib/proxyPublicOrigin';

function cloneRequestWithUrl(href: string, req: NextRequest): NextRequest {
  if (req.body) {
    return new NextRequest(href, {
      headers: req.headers,
      method: req.method,
      body: req.body,
      duplex: 'half',
    });
  }
  return new NextRequest(href, {
    headers: req.headers,
    method: req.method,
  });
}

/**
 * Auth.js uses `req.url` for redirect Location headers. Next.js behind nginx often exposes
 * `https://your-domain:3000/...` (Node listen port). In production, TLS is on 443 — rebuild
 * `/api/auth` URLs as `https://<hostname><path>` so `:3000` never appears in redirects.
 */
export function rewriteAuthRequestUrlForProxy(req: NextRequest): NextRequest {
  let parsed: URL;
  try {
    parsed = new URL(req.url);
  } catch {
    return req;
  }

  if (!parsed.pathname.startsWith('/api/auth')) {
    return req;
  }

  const pathAndQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`;

  const xfProto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().replace(/:$/, '') ?? '';
  const forwardedRaw =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim() ||
    '';

  const proto =
    xfProto ||
    (forwardedRaw.includes('localhost') || forwardedRaw.startsWith('127.') ? 'http' : 'https');
  const isHttps = proto === 'https';

  const forwardedNorm = forwardedRaw
    ? normalizeHostHeaderForPublicHttps(forwardedRaw, isHttps)
    : '';

  const loopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  // Node still sees http://localhost:3000 — use edge host from proxy headers.
  if (loopback && forwardedNorm) {
    const edgeBase = `${proto}://${forwardedNorm}`;
    const next = new URL(pathAndQuery, edgeBase);
    if (next.href !== parsed.href) {
      return cloneRequestWithUrl(next.href, req);
    }
    return req;
  }

  // Production: any non-loopback auth URL must not carry the internal listen port.
  if (process.env.NODE_ENV === 'production' && !loopback) {
    const canonical = new URL(pathAndQuery, `https://${parsed.hostname}`);
    if (canonical.href !== parsed.href) {
      return cloneRequestWithUrl(canonical.href, req);
    }
  }

  return req;
}
