/**
 * Client-safe types and constants for platform config.
 * Do not import `platformConfig.ts` from Client Components — it uses `fs` / `path`.
 */

export const PLATFORM_CONFIG_VERSION = 1 as const;

export type MaintenanceScope = 'marketplace_home' | 'marketplace_browse';

export type PlatformConfig = {
  version: typeof PLATFORM_CONFIG_VERSION;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEta: string;
  maintenanceWindowEnd: string;
  maintenanceScope: MaintenanceScope;
  maintenanceBypassSecret: string;
  registrationPaused: boolean;
  registrationMessage: string;
  updatedAt: string;
  updatedBy: string;
};

export type PlatformConfigClientDTO = Omit<PlatformConfig, 'maintenanceBypassSecret'> & {
  maintenanceBypassSecretSet: boolean;
  maintenanceForcedByEnv: boolean;
};

export type PublicMaintenancePayload = {
  title: string;
  message: string;
  eta: string;
  windowEnd: string;
  contactEmail: string;
};

/** Query key for a one-off maintenance bypass (must match secret in Platform or `MAINTENANCE_BYPASS_SECRET`). */
export const MAINTENANCE_BYPASS_QUERY = 'mintMaintBypass';
