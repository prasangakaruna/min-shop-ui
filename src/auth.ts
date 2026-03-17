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
    refresh_token?: string;
    access_token_expires?: number;
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

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refresh_token) return token;
  try {
    const url = `${keycloakIssuer}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KEYCLOAK_CLIENT_ID ?? 'mint-ecommerce',
      refresh_token: token.refresh_token,
    });
    if (keycloakClientSecret) {
      body.set('client_secret', keycloakClientSecret);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      return token;
    }
    const refreshed = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!refreshed.access_token) return token;
    const payload = decodeJwtPayload(refreshed.access_token);
    token.access_token = refreshed.access_token;
    if (refreshed.refresh_token) token.refresh_token = refreshed.refresh_token;
    if (typeof refreshed.expires_in === 'number') {
      token.access_token_expires = Math.floor(Date.now() / 1000) + refreshed.expires_in;
    }
    token.isSuperAdmin = hasSuperAdminRole(payload);
    return token;
  } catch {
    return token;
  }
}

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
        return token;
      }
      const expiresAt = token.access_token_expires;
      if (expiresAt && typeof expiresAt === 'number') {
        const now = Math.floor(Date.now() / 1000);
        // Refresh if token will expire in the next 60 seconds
        if (now > expiresAt - 60) {
          token = await refreshAccessToken(token as JWT);
        }
      }
      return token as JWT;
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
