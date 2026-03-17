import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    access_token?: string | null;
    isSuperAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    isSuperAdmin?: boolean;
  }
}

/** Decode JWT payload without verification (we trust Keycloak). Returns payload or {}. */
function decodeJwtPayload(accessToken: string | undefined): Record<string, unknown> {
  if (!accessToken || typeof accessToken !== 'string') return {};
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function hasSuperAdminRole(payload: Record<string, unknown>): boolean {
  const role = process.env.SUPER_ADMIN_ROLE ?? 'super_admin';
  const realmRoles = (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  if (realmRoles.includes(role)) return true;
  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  if (resourceAccess) {
    for (const client of Object.values(resourceAccess)) {
      if (client?.roles?.includes(role)) return true;
    }
  }
  return false;
}

// NextAuth requires AUTH_SECRET or NEXTAUTH_SECRET for session signing. Without it, /api/auth/session returns 500.
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

// Keycloak issuer: no trailing slash (must match Keycloak's .well-known/openid-configuration)
const keycloakIssuer = (process.env.KEYCLOAK_ISSUER ?? 'http://localhost:9091/realms/mint').replace(/\/$/, '').trim();
// Only send client_secret if client is confidential; for public client leave KEYCLOAK_CLIENT_SECRET unset
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'mint-ecommerce',
      clientSecret: keycloakClientSecret,
      issuer: keycloakIssuer,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.access_token_expires = account.expires_at;
        const payload = decodeJwtPayload(account.access_token);
        (token as JWT).isSuperAdmin = hasSuperAdminRole(payload);
      }
      return token;
    },
    async session({ session, token }) {
      if (session) {
        const t = token as JWT;
        (session as Session & { access_token?: string | null; isSuperAdmin?: boolean }).access_token = t?.access_token ?? null;
        (session as Session & { isSuperAdmin?: boolean }).isSuperAdmin = t?.isSuperAdmin ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  trustHost: true,
});
