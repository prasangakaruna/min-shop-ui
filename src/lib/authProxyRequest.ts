import { NextRequest } from 'next/server';

/**
 * Next.js 16+ behind nginx: `req.url` can be wrong for Auth.js redirects:
 * - `https://localhost:3000/...` (forwarded proto + Node listen host/port)
 * - `https://mint-shop.pro:3000/...` (public Host + internal listen port still in URL)
 * Rebuild from `X-Forwarded-*` / `Host` when we detect loopback or that stray app port.
 */
export function rewriteAuthRequestUrlForProxy(req: NextRequest): NextRequest {
  const parsed = new URL(req.url);

  const forwardedHost =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim();
  if (!forwardedHost) return req;

  const loopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().replace(/:$/, '') ?? '';
  const isPublicHttps = xfProto === 'https';

  const forwardedHostname = forwardedHost.split(':')[0]?.toLowerCase() ?? '';
  const urlHostname = parsed.hostname.toLowerCase();
  const sameHostnameAsEdge = forwardedHostname.length > 0 && urlHostname === forwardedHostname;

  const strayInternalPort =
    parsed.port === '3000' || (!!process.env.PORT && parsed.port === process.env.PORT);

  // Nginx usually sends Host without :3000; if it already includes a port, keep it.
  const forwardedHasExplicitPort = /^[^[\]]+:\d+$/.test(forwardedHost) || /]:/.test(forwardedHost);

  const shouldRewriteLoopback = loopback;
  const shouldDropInternalPort =
    !loopback &&
    sameHostnameAsEdge &&
    strayInternalPort &&
    isPublicHttps &&
    !forwardedHasExplicitPort;

  if (!shouldRewriteLoopback && !shouldDropInternalPort) return req;

  let proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    (forwardedHost.includes('localhost') || forwardedHost.startsWith('127.') ? 'http' : 'https');
  proto = proto.replace(/:$/, '');

  parsed.protocol = `${proto}:`;
  parsed.host = forwardedHost;

  if (req.body) {
    return new NextRequest(parsed.href, {
      headers: req.headers,
      method: req.method,
      body: req.body,
      duplex: 'half',
    });
  }

  return new NextRequest(parsed.href, {
    headers: req.headers,
    method: req.method,
  });
}
