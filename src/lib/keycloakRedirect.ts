/**
 * Keycloak / NextAuth must redirect back to the same browser origin.
 * Relative paths are resolved against NEXTAUTH_URL on the server, which breaks
 * sign-in from store subdomains (e.g. istanbulfoodpazar.mint-shop.pro) if that
 * env is only set to the apex (mint-shop.pro).
 *
 * Works for any number of stores: each tenant uses https://{storeSlug}.{rootDomain}/...
 * Register those origins (or a wildcard) in Keycloak Valid redirect URIs; set
 * NEXT_PUBLIC_MINT_ROOT_DOMAIN to the shared apex (e.g. mint-shop.pro).
 */
export function keycloakCallbackUrl(path = '/auth/after-login'): string {
  if (typeof window === 'undefined') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${p}`;
}
