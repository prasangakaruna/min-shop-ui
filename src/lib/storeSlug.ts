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
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN
      ? String(process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN).toLowerCase().trim().replace(/^\./, '')
      : '') || '';

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

/** `?store=` on apex (e.g. mint-shop.pro/...?store=slug), else subdomain slug. */
export function resolveStorefrontStoreSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const fromQuery = new URLSearchParams(window.location.search).get('store');
  if (fromQuery && fromQuery.trim() !== '') return fromQuery.trim();
  return storeSlugFromHostname();
}
