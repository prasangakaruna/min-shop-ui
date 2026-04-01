import { NextRequest } from 'next/server';
import { mintDeployRootHostname, normalizeHostHeaderForPublicHttps } from '@/lib/proxyPublicOrigin';

function internalListenPorts(): Set<string> {
  return new Set(['3000', process.env.PORT].filter(Boolean) as string[]);
}

function edgeHostname(host: string): string {
  return host.split(':')[0]?.toLowerCase() ?? '';
}

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
 * Next.js behind nginx: `req.url` can be `https://localhost:3000/...` or `https://mint-shop.pro:3000/...`.
 * Auth.js uses `req.url` for redirects. Normalize using forwarded headers and strip internal listen ports.
 */
function urlShowsInternalPortOnHost(urlStr: string, hostname: string): boolean {
  const u = urlStr.toLowerCase();
  const h = hostname.toLowerCase();
  for (const p of internalListenPorts()) {
    if (u.includes(`://${h}:${p}/`) || u.includes(`://${h}:${p}?`) || u.endsWith(`://${h}:${p}`)) {
      return true;
    }
  }
  return false;
}

export function rewriteAuthRequestUrlForProxy(req: NextRequest): NextRequest {
  const parsed = new URL(req.url);

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

  const badPort = !!parsed.port && internalListenPorts().has(parsed.port);
  const loopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  const root = mintDeployRootHostname();
  const onMintDomain =
    !!root &&
    (parsed.hostname === root || parsed.hostname.toLowerCase().endsWith(`.${root.toLowerCase()}`));

  const edge = edgeHostname(forwardedNorm);
  const hostAlignsWithEdge =
    !!edge &&
    (parsed.hostname.toLowerCase() === edge || parsed.hostname.toLowerCase().endsWith(`.${edge}`));

  const stringPortLeak = isHttps && onMintDomain && urlShowsInternalPortOnHost(req.url, parsed.hostname);

  let needsRewrite = false;

  if (loopback && forwardedNorm) {
    needsRewrite = true;
    parsed.protocol = `${proto}:`;
    parsed.host = forwardedNorm;
  } else if (isHttps && onMintDomain && (badPort || stringPortLeak)) {
    needsRewrite = true;
    parsed.protocol = `${proto}:`;
    parsed.port = '';
  } else if (badPort && isHttps && forwardedNorm && hostAlignsWithEdge) {
    needsRewrite = true;
    parsed.protocol = `${proto}:`;
    parsed.host = forwardedNorm;
  }

  if (!needsRewrite) return req;

  return cloneRequestWithUrl(parsed.href, req);
}
