import { NextRequest } from 'next/server';

/**
 * Next.js 16 removed `experimental.trustHostHeader` from the config schema. Behind nginx,
 * App Router can still surface `req.url` as `https://localhost:3000/...` (forwarded proto +
 * Node listen address). Auth.js uses that URL for redirects — rebuild it from proxy headers
 * when the URL host is loopback.
 */
export function rewriteAuthRequestUrlForProxy(req: NextRequest): NextRequest {
  const parsed = new URL(req.url);
  const loopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (!loopback) return req;

  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim();
  if (!host) return req;

  let proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  proto = proto.replace(/:$/, '');

  parsed.protocol = `${proto}:`;
  parsed.host = host;

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
