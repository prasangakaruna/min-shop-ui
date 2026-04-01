import { NextRequest } from 'next/server';

/**
 * Guarded reachability check from the **Node** process (same network as OAuth token exchange).
 * Set AUTH_DIAG_SECRET in env, then: GET /api/internal/auth-health?key=<secret>
 * Returns 404 if secret missing or wrong — do not commit the secret.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  const secret = process.env.AUTH_DIAG_SECRET?.trim();
  if (!secret || key !== secret) {
    return new Response('Not Found', { status: 404 });
  }

  const issuer = process.env.KEYCLOAK_ISSUER?.replace(/\/$/, '').trim();
  if (!issuer) {
    return Response.json({ ok: false, error: 'KEYCLOAK_ISSUER not set' });
  }

  const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;
  try {
    const r = await fetch(wellKnownUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const snippet = r.ok ? undefined : (await r.text()).slice(0, 500);
    return Response.json({
      ok: r.ok,
      wellKnownHttp: r.status,
      wellKnownUrl,
      ...(snippet ? { bodySnippet: snippet } : {}),
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message : 'fetch failed',
      wellKnownUrl,
    });
  }
}
