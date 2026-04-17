import { promises as fs } from 'fs';
import path from 'path';
import {
  MAINTENANCE_BYPASS_QUERY,
  PLATFORM_CONFIG_VERSION,
  type MaintenanceScope,
  type PlatformConfig,
  type PlatformConfigClientDTO,
  type PublicMaintenancePayload,
} from '@/lib/platformConfigShared';

export type { MaintenanceScope, PlatformConfig, PlatformConfigClientDTO, PublicMaintenancePayload } from '@/lib/platformConfigShared';
export { MAINTENANCE_BYPASS_QUERY, PLATFORM_CONFIG_VERSION } from '@/lib/platformConfigShared';

const DEFAULTS: PlatformConfig = {
  version: PLATFORM_CONFIG_VERSION,
  maintenanceMode: false,
  maintenanceTitle: "We're upgrading Mint",
  maintenanceMessage:
    'The marketplace home is temporarily unavailable while we ship improvements. Storefronts on their own subdomains are unaffected.',
  maintenanceEta: '',
  maintenanceWindowEnd: '',
  maintenanceScope: 'marketplace_home',
  maintenanceBypassSecret: '',
  registrationPaused: false,
  registrationMessage:
    'New account registration on the marketplace is paused for a short time. Please try again later.',
  updatedAt: '',
  updatedBy: '',
};

function configFilePath(): string {
  const override = process.env.PLATFORM_CONFIG_FILE?.trim();
  if (override) return path.isAbsolute(override) ? override : path.join(process.cwd(), override);
  return path.join(process.cwd(), 'data', 'platform-config.json');
}

function envMaintenanceOverride(): boolean | null {
  const v = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  if (!v) return null;
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return null;
}

function mergeEnvBypassSecret(fileSecret: string): string {
  return process.env.MAINTENANCE_BYPASS_SECRET?.trim() || fileSecret;
}

function normalizePartial(raw: unknown): Partial<PlatformConfig> {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const out: Partial<PlatformConfig> = {};
  if (typeof o.maintenanceMode === 'boolean') out.maintenanceMode = o.maintenanceMode;
  if (typeof o.maintenanceTitle === 'string') out.maintenanceTitle = o.maintenanceTitle.slice(0, 120);
  if (typeof o.maintenanceMessage === 'string') out.maintenanceMessage = o.maintenanceMessage.slice(0, 4000);
  if (typeof o.maintenanceEta === 'string') out.maintenanceEta = o.maintenanceEta.slice(0, 240);
  if (typeof o.maintenanceWindowEnd === 'string') out.maintenanceWindowEnd = o.maintenanceWindowEnd.slice(0, 80);
  if (o.maintenanceScope === 'marketplace_home' || o.maintenanceScope === 'marketplace_browse') {
    out.maintenanceScope = o.maintenanceScope;
  }
  if (typeof o.maintenanceBypassSecret === 'string') out.maintenanceBypassSecret = o.maintenanceBypassSecret.slice(0, 256);
  if (typeof o.registrationPaused === 'boolean') out.registrationPaused = o.registrationPaused;
  if (typeof o.registrationMessage === 'string') out.registrationMessage = o.registrationMessage.slice(0, 2000);
  return out;
}

function coerceConfig(parsed: unknown): PlatformConfig {
  const base = { ...DEFAULTS };
  if (!parsed || typeof parsed !== 'object') return base;
  const p = parsed as Record<string, unknown>;
  return {
    ...base,
    ...normalizePartial(p),
    version: PLATFORM_CONFIG_VERSION,
  };
}

async function readPlatformConfigFromDisk(): Promise<PlatformConfig> {
  try {
    const raw = await fs.readFile(configFilePath(), 'utf8');
    return coerceConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

/** Effective config after env overrides (server-only). */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  const fromFile = await readPlatformConfigFromDisk();
  const envMaint = envMaintenanceOverride();
  const maintenanceMode = envMaint !== null ? envMaint : fromFile.maintenanceMode;
  const maintenanceBypassSecret = mergeEnvBypassSecret(fromFile.maintenanceBypassSecret);

  return {
    ...fromFile,
    maintenanceMode,
    maintenanceBypassSecret,
    version: PLATFORM_CONFIG_VERSION,
  };
}

export function toPlatformConfigClientDTO(cfg: PlatformConfig): PlatformConfigClientDTO {
  const { maintenanceBypassSecret, ...rest } = cfg;
  return {
    ...rest,
    maintenanceBypassSecretSet: maintenanceBypassSecret.length > 0,
    maintenanceForcedByEnv: envMaintenanceOverride() === true,
  };
}

export async function updatePlatformConfig(
  patch: Partial<PlatformConfig>,
  meta: { actorEmail: string }
): Promise<PlatformConfig> {
  const current = await readPlatformConfigFromDisk();
  const normalized = normalizePartial(patch);
  const next: PlatformConfig = {
    ...current,
    ...normalized,
    version: PLATFORM_CONFIG_VERSION,
    updatedAt: new Date().toISOString(),
    updatedBy: meta.actorEmail,
  };

  if (normalized.maintenanceBypassSecret === undefined) {
    next.maintenanceBypassSecret = current.maintenanceBypassSecret;
  }

  const dir = path.dirname(configFilePath());
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${configFilePath()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
  await fs.rename(tmp, configFilePath());

  return getPlatformConfig();
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | null {
  if (!searchParams) return null;
  const v = searchParams[key];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s.length > 0 ? s : null;
}

function bypassMatches(cfg: PlatformConfig, searchParams?: Record<string, string | string[] | undefined>): boolean {
  const secret = cfg.maintenanceBypassSecret.trim();
  if (!secret) return false;
  const q = firstParam(searchParams, MAINTENANCE_BYPASS_QUERY);
  return q === secret;
}

function pathInMaintenanceScope(pathname: string, scope: MaintenanceScope): boolean {
  if (scope === 'marketplace_home') return pathname === '/' || pathname === '';
  return pathname === '/' || pathname === '/products' || pathname === '/search';
}

/**
 * When to show the public maintenance screen for the marketplace (no tenant store context).
 */
export async function evaluateMarketplaceMaintenanceGate(opts: {
  pathname: string;
  storeSlug: string | null;
  searchParams?: Record<string, string | string[] | undefined>;
  isSuperAdmin: boolean;
}): Promise<{ show: false } | { show: true; payload: PublicMaintenancePayload }> {
  if (opts.storeSlug) return { show: false };
  if (opts.isSuperAdmin) return { show: false };

  const cfg = await getPlatformConfig();
  if (!cfg.maintenanceMode) return { show: false };
  if (!pathInMaintenanceScope(opts.pathname, cfg.maintenanceScope)) return { show: false };
  if (bypassMatches(cfg, opts.searchParams)) return { show: false };

  return {
    show: true,
    payload: {
      title: cfg.maintenanceTitle,
      message: cfg.maintenanceMessage,
      eta: cfg.maintenanceEta,
      windowEnd: cfg.maintenanceWindowEnd,
      contactEmail: process.env.PLATFORM_SUPPORT_EMAIL?.trim() || '',
    },
  };
}

export async function apexRegistrationBlock(): Promise<{ block: boolean; message: string }> {
  const cfg = await getPlatformConfig();
  if (!cfg.registrationPaused) return { block: false, message: '' };
  return { block: true, message: cfg.registrationMessage || DEFAULTS.registrationMessage };
}
