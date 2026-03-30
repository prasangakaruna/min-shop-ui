export const METAOBJECT_FIELD_TYPES = [
  { value: 'single_line_text', label: 'Single line text' },
  { value: 'multi_line_text', label: 'Multi-line text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date & time' },
  { value: 'file_reference', label: 'File (URL)' },
] as const;

export type MetaobjectFieldType = (typeof METAOBJECT_FIELD_TYPES)[number]['value'];

export type MetaobjectFieldDefinition = {
  key: string;
  label: string;
  type: MetaobjectFieldType;
  required?: boolean;
};

export type MetaobjectEntry = {
  id: string;
  handle: string;
  values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MetaobjectDefinition = {
  id: string;
  name: string;
  type: string;
  field_definitions: MetaobjectFieldDefinition[];
  entries: MetaobjectEntry[];
  created_at: string;
};

export function parseMetaobject(raw: unknown): MetaobjectDefinition | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : '';
  if (!id) return null;
  const fds: MetaobjectFieldDefinition[] = [];
  if (Array.isArray(o.field_definitions)) {
    for (const row of o.field_definitions) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const key = typeof r.key === 'string' ? r.key : '';
      const label = typeof r.label === 'string' ? r.label : key;
      const type = typeof r.type === 'string' ? (r.type as MetaobjectFieldType) : 'single_line_text';
      if (!key) continue;
      fds.push({
        key,
        label,
        type: METAOBJECT_FIELD_TYPES.some((t) => t.value === type) ? type : 'single_line_text',
        required: Boolean(r.required),
      });
    }
  }
  const entries: MetaobjectEntry[] = [];
  if (Array.isArray(o.entries)) {
    for (const e of o.entries) {
      if (!e || typeof e !== 'object') continue;
      const er = e as Record<string, unknown>;
      if (typeof er.id !== 'string') continue;
      entries.push({
        id: er.id,
        handle: typeof er.handle === 'string' ? er.handle : '',
        values: er.values && typeof er.values === 'object' && !Array.isArray(er.values) ? (er.values as Record<string, unknown>) : {},
        created_at: typeof er.created_at === 'string' ? er.created_at : '',
        updated_at: typeof er.updated_at === 'string' ? er.updated_at : '',
      });
    }
  }
  return {
    id,
    name: typeof o.name === 'string' ? o.name : '',
    type: typeof o.type === 'string' ? o.type : '',
    field_definitions: fds,
    entries,
    created_at: typeof o.created_at === 'string' ? o.created_at : '',
  };
}

export function isoToDatetimeLocalValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}
