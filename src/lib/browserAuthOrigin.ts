import { mintPublicRootHostname } from '@/lib/mintPublicRootDomain';

/**
 * Client-only: next-auth/react and callback URLs must not use `window.location.origin` when the
 * address bar shows `https://public-domain:3000` (Node port leaked to the browser). That value
 * is synced into __NEXTAUTH and into Keycloak callbackUrl, so errors redirect to :3000.
 */

export function getCanonicalBrowserOrigin(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '').trim();
  if (site) {
    return site.startsWith('http') ? site : `https://${site}`;
  }

  try {
    const u = new URL(window.location.href);
    const root = mintPublicRootHostname();
    const onMint =
      !!root &&
      (u.hostname === root || u.hostname.toLowerCase().endsWith(`.${root.toLowerCase()}`));

    // HTTPS on a real deploy hostname should never keep the app listen port in the origin.
    if (
      u.protocol === 'https:' &&
      u.port === '3000' &&
      u.hostname !== 'localhost' &&
      !u.hostname.startsWith('127.')
    ) {
      if (!root || onMint) {
        u.port = '';
        return u.origin;
      }
    }
  } catch {
    /* ignore */
  }

  return window.location.origin;
}
