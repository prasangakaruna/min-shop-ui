/** First subdomain segment = store slug (e.g. istanbulfoodpazar.mint-shop.pro). Not used on bare localhost. */
export function storeSlugFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return null;
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const effectiveParts = parts[0] === 'www' && parts.length >= 3 ? parts.slice(1) : parts;
  return effectiveParts[0] ?? null;
}
