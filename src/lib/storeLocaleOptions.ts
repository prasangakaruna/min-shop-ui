/**
 * Store settings: currency and region options from Intl (system / browser automation).
 * Values persisted: ISO 4217 currency code (e.g. LKR) and ISO 3166-1 alpha-2 region (e.g. LK).
 */

export type LocaleSelectOption = { value: string; label: string };

const FALLBACK_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'LKR',
  'INR',
  'AUD',
  'CAD',
  'JPY',
  'CNY',
  'SGD',
  'AED',
  'SAR',
  'NZD',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'ZAR',
  'BRL',
  'MXN',
];

const FALLBACK_REGIONS = [
  'US',
  'GB',
  'LK',
  'IN',
  'AU',
  'CA',
  'DE',
  'FR',
  'JP',
  'CN',
  'SG',
  'AE',
  'NZ',
  'BR',
  'MX',
];

function listCurrencyCodes(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    const codes = intl.supportedValuesOf?.('currency');
    if (Array.isArray(codes) && codes.length > 0) {
      return codes.filter((c) => typeof c === 'string' && /^[A-Z]{3}$/.test(c));
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_CURRENCIES];
}

function listRegionCodes(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    const regions = intl.supportedValuesOf?.('region');
    if (Array.isArray(regions) && regions.length > 0) {
      return regions.filter(
        (r) => typeof r === 'string' && /^[A-Z]{2}$/.test(r) && r !== 'ZZ' && r !== 'XA' && r !== 'XB'
      );
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_REGIONS];
}

let cachedCurrencies: LocaleSelectOption[] | null = null;
let cachedRegions: LocaleSelectOption[] | null = null;

export function getCurrencyOptions(): LocaleSelectOption[] {
  if (cachedCurrencies) return cachedCurrencies;
  const codes = Array.from(new Set(listCurrencyCodes())).sort((a, b) => a.localeCompare(b));
  const dn = new Intl.DisplayNames(['en'], { type: 'currency' });
  cachedCurrencies = codes.map((code) => {
    const name = dn.of(code) ?? code;
    return { value: code, label: `${name} (${code})` };
  });
  return cachedCurrencies;
}

export function getRegionOptions(): LocaleSelectOption[] {
  if (cachedRegions) return cachedRegions;
  const codes = Array.from(new Set(listRegionCodes())).sort((a, b) => a.localeCompare(b));
  const dn = new Intl.DisplayNames(['en'], { type: 'region' });
  cachedRegions = codes.map((code) => ({
    value: code,
    label: dn.of(code) ?? code,
  }));
  cachedRegions.sort((a, b) => a.label.localeCompare(b.label));
  return cachedRegions;
}

/** Map legacy free-text to ISO 4217 when possible. */
export function normalizeStoredCurrency(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  const t = raw.trim();
  if (/^[A-Z]{3}$/.test(t)) return t;
  const inParens = t.match(/\(([A-Z]{3})\b/);
  if (inParens) return inParens[1];
  const tailWord = t.match(/\b([A-Z]{3})\s*$/);
  if (tailWord) return tailWord[1];
  return t;
}

/** Map legacy country name or code to ISO 3166-1 alpha-2 when possible. */
export function normalizeStoredRegion(raw: string | undefined, options: LocaleSelectOption[]): string {
  if (!raw?.trim()) return '';
  const t = raw.trim();
  if (/^[A-Z]{2}$/.test(t)) return t;
  const low = t.toLowerCase();
  const byLabel = options.find((o) => o.label.toLowerCase() === low);
  if (byLabel) return byLabel.value;
  return t;
}

export function currencyOptionValues(): Set<string> {
  return new Set(getCurrencyOptions().map((o) => o.value));
}

export function regionOptionValues(): Set<string> {
  return new Set(getRegionOptions().map((o) => o.value));
}
