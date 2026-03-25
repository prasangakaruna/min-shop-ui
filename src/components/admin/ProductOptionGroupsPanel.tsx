'use client';

import React from 'react';
import type { ProductOptionGroup, ProductOptionValue } from '@/lib/api';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length) return list;
  const next = [...list];
  const [removed] = next.splice(fromIndex, 1);
  const clamped = Math.min(toIndex, next.length);
  next.splice(clamped, 0, removed);
  return next;
}

const MIME_GROUP = 'application/x-mint-option-group';
const MIME_VALUE = 'application/x-mint-option-value';

type Props = {
  groups: ProductOptionGroup[];
  onChange: (groups: ProductOptionGroup[]) => void;
  /** Nested inside a sticky settings-style shell — no outer card border. */
  embedded?: boolean;
};

/** Normalize API/metadata shape into typed option groups. */
export function normalizeProductOptionGroups(raw: unknown): ProductOptionGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductOptionGroup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const g = item as Record<string, unknown>;
    const name = typeof g.name === 'string' ? g.name.trim() : '';
    if (!name) continue;
    const gid = typeof g.id === 'string' && g.id ? g.id : newId();
    const valsIn = g.values;
    const values: ProductOptionValue[] = [];
    if (Array.isArray(valsIn)) {
      for (const v of valsIn) {
        if (!v || typeof v !== 'object') continue;
        const vv = v as Record<string, unknown>;
        const label = typeof vv.label === 'string' ? vv.label.trim() : '';
        if (!label) continue;
        const vid = typeof vv.id === 'string' && vv.id ? vv.id : newId();
        values.push({ id: vid, label });
      }
    }
    out.push({ id: gid, name, values });
  }
  return out;
}

export default function ProductOptionGroupsPanel({ groups, onChange, embedded = false }: Props) {
  const addGroup = () => {
    onChange([
      ...groups,
      {
        id: newId(),
        name: 'Color',
        values: [
          { id: newId(), label: 'Black' },
          { id: newId(), label: 'Navy' },
        ],
      },
    ]);
  };

  const updateGroup = (index: number, patch: Partial<ProductOptionGroup>) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const addValue = (groupIndex: number) => {
    const g = groups[groupIndex];
    if (!g) return;
    updateGroup(groupIndex, { values: [...g.values, { id: newId(), label: '' }] });
  };

  const updateValue = (groupIndex: number, valueIndex: number, label: string) => {
    const g = groups[groupIndex];
    if (!g) return;
    const values = g.values.map((v, i) => (i === valueIndex ? { ...v, label } : v));
    updateGroup(groupIndex, { values });
  };

  const removeValue = (groupIndex: number, valueIndex: number) => {
    const g = groups[groupIndex];
    if (!g) return;
    updateGroup(groupIndex, { values: g.values.filter((_, i) => i !== valueIndex) });
  };

  const onDragStartGroup = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(MIME_GROUP, String(index));
  };

  const onDragOverRow = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropGroup = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData(MIME_GROUP), 10);
    if (Number.isNaN(from)) return;
    onChange(reorder(groups, from, dropIndex));
  };

  const onDragStartValue = (e: React.DragEvent, groupIndex: number, valueIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(MIME_VALUE, `${groupIndex}:${valueIndex}`);
  };

  const onDropValue = (e: React.DragEvent, groupIndex: number, dropValueIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(MIME_VALUE);
    const [gStr, vStr] = raw.split(':');
    const fromG = parseInt(gStr, 10);
    const fromV = parseInt(vStr, 10);
    if (Number.isNaN(fromG) || Number.isNaN(fromV) || fromG !== groupIndex) return;
    const g = groups[groupIndex];
    if (!g) return;
    const values = reorder(g.values, fromV, dropValueIndex);
    updateGroup(groupIndex, { values });
  };

  const shell = embedded
    ? 'space-y-3 px-1 pb-1'
    : 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

  return (
    <div className={shell}>
      {!embedded && (
        <>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Product options</h2>
          <p className="text-sm text-gray-500 mb-4">
            Define options such as Color or Size. Drag groups and values to set the order shown to customers. Save product
            changes to persist. Assign each variant&apos;s option combination below in Pricing &amp; stock.
          </p>
        </>
      )}
      <div className={embedded ? 'space-y-3' : 'space-y-4'}>
        {groups.map((group, gi) => (
          <div
            key={group.id}
            className={`rounded-lg border border-gray-200 bg-gray-50/50 ${embedded ? 'p-3' : 'p-4'}`}
            onDragOver={onDragOverRow}
            onDrop={(e) => onDropGroup(e, gi)}
          >
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                draggable
                onDragStart={(e) => onDragStartGroup(e, gi)}
                className="mt-2 cursor-grab active:cursor-grabbing rounded border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50"
                title="Drag to reorder option"
                aria-label="Drag to reorder option group"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 9h2v2H9V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2z" />
                </svg>
              </button>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`og-name-${group.id}`}>
                    Option name
                  </label>
                  <input
                    id={`og-name-${group.id}`}
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroup(gi, { name: e.target.value })}
                    placeholder="e.g. Color, Size"
                    className="min-w-[8rem] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove group
                  </button>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Values (drag to reorder)</p>
                  <ul className="space-y-2">
                    {group.values.map((val, vi) => (
                      <li
                        key={val.id}
                        className="flex flex-wrap items-center gap-2"
                        onDragOver={onDragOverRow}
                        onDrop={(e) => onDropValue(e, gi, vi)}
                      >
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => onDragStartValue(e, gi, vi)}
                          className="cursor-grab active:cursor-grabbing rounded border border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-50"
                          title="Drag to reorder value"
                          aria-label="Drag to reorder value"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 9h2v2H9V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2z" />
                          </svg>
                        </button>
                        <input
                          type="text"
                          value={val.label}
                          onChange={(e) => updateValue(gi, vi, e.target.value)}
                          placeholder="e.g. Black, M, 32"
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeValue(gi, vi)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => addValue(gi)}
                    className="mt-2 text-sm font-medium text-mint hover:underline"
                  >
                    + Add value
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addGroup}
        className="mt-4 rounded-lg border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-mint hover:bg-mint/5 hover:text-mint"
      >
        + Add option group (e.g. Color, Size)
      </button>
    </div>
  );
}
