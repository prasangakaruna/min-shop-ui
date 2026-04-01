/**
 * One place for `NEXT_PUBLIC_MINT_ROOT_DOMAIN` (e.g. mint-shop.pro).
 *
 * Why NEXT_PUBLIC_? Next.js inlines it into the **client** bundle so browser code can tell
 * `store.mint-shop.pro` from a random domain — without calling the server. That is why it exists
 * at all; only a few modules import this helper (not “every page”).
 */
export function mintPublicRootHostname(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_MINT_ROOT_DOMAIN?.replace(/^\./, '').trim();
  return raw || undefined;
}

/** `https://mint-shop.pro` when the public root env is set. */
export function mintPublicApexHttpsUrl(): string | undefined {
  const h = mintPublicRootHostname();
  return h ? `https://${h}` : undefined;
}
