import { getPlatformConfig, toPlatformConfigClientDTO } from '@/lib/platformConfig';

/**
 * Read-only snapshot of platform signals for the system operator console.
 * No merchant/store APIs — safe to call from server components after auth checks.
 */
export type SystemStatusSnapshot = {
  at: string;
  environment: string;
  keycloakIssuerConfigured: boolean;
  idpWellKnownOk: boolean | null;
  authSecretConfigured: boolean;
  /** Public API base URL present (boolean only). */
  apiBaseConfigured: boolean;
  /** Effective marketplace maintenance (file + env). */
  marketplaceMaintenance: {
    active: boolean;
    scope: string;
    forcedByEnv: boolean;
    bypassSecretConfigured: boolean;
  };
  registrationPaused: boolean;
};

export async function getSystemStatusSnapshot(): Promise<SystemStatusSnapshot> {
  const issuer = process.env.KEYCLOAK_ISSUER?.replace(/\/$/, '').trim();
  let idpWellKnownOk: boolean | null = null;
  if (issuer) {
    const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;
    try {
      const r = await fetch(wellKnownUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      idpWellKnownOk = r.ok;
    } catch {
      idpWellKnownOk = false;
    }
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_MINT_API_URL?.trim() ||
    process.env.MINT_API_URL?.trim() ||
    '';

  const platform = await getPlatformConfig();
  const dto = toPlatformConfigClientDTO(platform);

  return {
    at: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    keycloakIssuerConfigured: Boolean(issuer),
    idpWellKnownOk,
    authSecretConfigured: Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET),
    apiBaseConfigured: Boolean(apiBase),
    marketplaceMaintenance: {
      active: dto.maintenanceMode,
      scope: dto.maintenanceScope,
      forcedByEnv: dto.maintenanceForcedByEnv,
      bypassSecretConfigured: dto.maintenanceBypassSecretSet,
    },
    registrationPaused: dto.registrationPaused,
  };
}
