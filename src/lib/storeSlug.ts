import { mintPublicRootHostname } from '@/lib/mintPublicRootDomain';

/**
 * Store slug from hostname: subdomain of the marketplace root (e.g. istanbulfoodpazar.mint-shop.pro).
 * On apex hosts like mint-shop.pro there is no subdomain — do not treat "mint-shop" as a slug.
 */

function stripLeadingWwwLabels(host: string): string {
  let parts = host.split('.').filter(Boolean);
  while (parts[0] === 'www' && parts.length > 0) {
    parts = parts.slice(1);
  }
  return parts.join('.');
}

/**
 * @param hostname host only, no port (or with port — port is stripped)
 */
export function storeSlugFromHost(hostname: string): string | null {
  const hostRaw = hostname.split(':')[0]?.toLowerCase() ?? '';
  if (!hostRaw || hostRaw === 'localhost' || hostRaw === '127.0.0.1') return null;

  const root =
    typeof process !== 'undefined' ? (mintPublicRootHostname()?.toLowerCase() ?? '') : '';

  if (root) {
    if (hostRaw === root || hostRaw === `www.${root}`) return null;
    const suffix = '.' + root;
    if (hostRaw.endsWith(suffix)) {
      let prefix = hostRaw.slice(0, -suffix.length);
      if (!prefix || prefix === 'www') return null;
      while (prefix.startsWith('www.')) prefix = prefix.slice(4);
      return prefix || null;
    }
    return null;
  }

  const core = stripLeadingWwwLabels(hostRaw);
  const parts = core.split('.').filter(Boolean);
  if (parts.length < 3) return null;
  return parts[0] ?? null;
}

export function storeSlugFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  return storeSlugFromHost(window.location.hostname);
}

/**
 * Host to use for tenant slug detection behind reverse proxies.
 * Prefer `Host` when it already encodes `*.root` — some setups send the apex only in
 * `X-Forwarded-Host` while `Host` still has the store subdomain, which would wrongly show
 * the global marketplace on SSR/hard refresh.
 */
export function publicHostnameForStorefrontSlug(
  hostHeader: string | null,
  forwardedHostHeader: string | null
): string {
  const normalize = (v: string | null) =>
    (v ?? '')
      .split(',')[0]
      .trim()
      .split(':')[0]
      .toLowerCase();

  const host = normalize(hostHeader);
  const forwarded = normalize(forwardedHostHeader);
  const slugFromHost = host ? storeSlugFromHost(host) : null;
  const slugFromForwarded = forwarded ? storeSlugFromHost(forwarded) : null;
  if (slugFromHost) return host;
  if (slugFromForwarded) return forwarded;
  return forwarded || host;
}

/** `?store=` on apex (e.g. mint-shop.pro/...?store=slug), else subdomain slug. */
export function resolveStorefrontStoreSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const fromQuery = new URLSearchParams(window.location.search).get('store');
  if (fromQuery && fromQuery.trim() !== '') return fromQuery.trim();
  return storeSlugFromHostname();
}

/**
 * Where to send shoppers after auth. On a tenant host (e.g. istanbulfoodpazar.mint-shop.pro) use `/` so
 * they stay on that store for browsing and checkout; on the marketplace apex, use `/dashboard`.
 */
export function customerPostAuthPath(hostname: string): string {
  return storeSlugFromHost(hostname) ? '/' : '/dashboard';
}
