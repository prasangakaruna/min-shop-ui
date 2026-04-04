/**
 * IANA time zones from Intl.supportedValuesOf('timeZone') when available.
 * Labels: "(UTC±hh:mm) exemplar city" style, sorted by current UTC offset then name.
 */

export type TimezoneOption = { value: string; label: string; offsetMinutes: number };

const FALLBACK_ZONES = [
  'UTC',
  'Pacific/Midway',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/** Friendlier primary city names (optional; matches common OS dropdown wording). */
const EXEMPLAR_LABEL: Record<string, string> = {
  'Asia/Colombo': 'Sri Jayawardenepura',
  'Asia/Kolkata': 'Chennai, Kolkata, Mumbai, New Delhi',
  'Asia/Bangkok': 'Bangkok, Hanoi, Jakarta',
  'Asia/Singapore': 'Singapore, Kuala Lumpur',
  'Australia/Sydney': 'Canberra, Melbourne, Sydney',
  'America/New_York': 'Eastern Time (US & Canada)',
  'America/Chicago': 'Central Time (US & Canada)',
  'America/Denver': 'Mountain Time (US & Canada)',
  'America/Los_Angeles': 'Pacific Time (US & Canada)',
  'Europe/London': 'London, Dublin, Edinburgh',
  'Europe/Paris': 'Paris, Berlin, Rome, Madrid',
};

function listIanaTimeZones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      const zones = intl.supportedValuesOf('timeZone');
      if (Array.isArray(zones) && zones.length > 0) return [...zones];
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_ZONES];
}

/** Minutes east of UTC for `timeZone` at `date` (e.g. India = 330). */
function offsetMinutesEast(timeZone: string, date: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const part = dtf.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
    const normalized = part.replace(/\u2212/g, '-');
    const m = normalized.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    const h = parseInt(m[2], 10);
    const min = parseInt(m[3] ?? '0', 10);
    return sign * (h * 60 + min);
  } catch {
    return 0;
  }
}

function formatUtcParen(offsetMinutesEast: number): string {
  const sign = offsetMinutesEast >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutesEast);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `(UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')})`;
}

function exemplarCityLabel(iana: string): string {
  if (EXEMPLAR_LABEL[iana]) return EXEMPLAR_LABEL[iana];
  if (!iana.includes('/')) return iana;
  return iana
    .split('/')
    .slice(1)
    .join(' / ')
    .replace(/_/g, ' ');
}

let cachedFlat: TimezoneOption[] | null = null;

/**
 * All zones, sorted by current UTC offset then label (Windows-style ordering).
 * `value` is always IANA id for API storage.
 */
export function getTimezoneOptions(): TimezoneOption[] {
  if (cachedFlat) return cachedFlat;
  const now = new Date();
  const ids = Array.from(new Set(listIanaTimeZones())).sort((a, b) => a.localeCompare(b));
  cachedFlat = ids.map((value) => {
    const offset = offsetMinutesEast(value, now);
    const utcParen = formatUtcParen(offset);
    const city = exemplarCityLabel(value);
    const label = `${utcParen} ${city}`;
    return { value, label, offsetMinutes: offset };
  });
  cachedFlat.sort((a, b) => {
    if (a.offsetMinutes !== b.offsetMinutes) return a.offsetMinutes - b.offsetMinutes;
    return a.label.localeCompare(b.label);
  });
  return cachedFlat;
}

/** @deprecated prefer getTimezoneOptions() — list is already flat-sorted */
export function getTimezoneOptionsGrouped(): { region: string; options: TimezoneOption[] }[] {
  const flat = getTimezoneOptions();
  const byRegion = new Map<string, TimezoneOption[]>();
  for (const opt of flat) {
    const i = opt.value.indexOf('/');
    const region = i > 0 ? opt.value.slice(0, i).replace(/_/g, ' ') : 'Other';
    const list = byRegion.get(region) ?? [];
    list.push(opt);
    byRegion.set(region, list);
  }
  return Array.from(byRegion.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, options]) => ({ region, options }));
}
