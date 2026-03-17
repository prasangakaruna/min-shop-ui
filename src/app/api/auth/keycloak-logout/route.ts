import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirects to Keycloak's logout endpoint so Keycloak clears its session and cookies.
 * Call this after signOut({ redirect: false }) so that both NextAuth and Keycloak are cleared.
 */
export function GET(request: NextRequest) {
  const issuer = process.env.KEYCLOAK_ISSUER ?? 'http://localhost:9091/realms/mint';
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? 'mint-ecommerce';
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') ?? '/';
  const postLogoutRedirect = baseUrl.replace(/\/$/, '') + (callbackUrl.startsWith('/') ? callbackUrl : '/' + callbackUrl);

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirect);
  logoutUrl.searchParams.set('client_id', clientId);

  return NextResponse.redirect(logoutUrl.toString());
}
