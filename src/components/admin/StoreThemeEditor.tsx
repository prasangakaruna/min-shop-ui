'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, type StoreSummary } from '@/lib/api';
import {
  SECTION_CATALOG,
  BUILTIN_THEME_PRESETS,
  MINT_MARKETPLACE_PRESET,
  type HomeSection,
  type HomeSectionType,
  type StorefrontHomeTheme,
  mergeStorefrontHomeTheme,
  themeToCssVars,
  buttonRadiusLabel,
  createDefaultSections,
  isMintMarketplaceSectionOrder,
} from '@/lib/storefrontHomeTheme';

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Sans-Serif)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia (Serif)' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: '"DM Sans", system-ui, sans-serif', label: 'DM Sans' },
];

function newSectionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneTheme(t: StorefrontHomeTheme): StorefrontHomeTheme {
  return structuredClone(t);
}

type Tab = 'sections' | 'theme' | 'embeds';

type Props = {
  token: string;
  store: StoreSummary;
  onSaved: (s: StoreSummary) => void;
};

export default function StoreThemeEditor({ token, store, onSaved }: Props) {
  const [draft, setDraft] = useState<StorefrontHomeTheme>(() => mergeStorefrontHomeTheme(store.settings?.storefront_home ?? null));
  const [past, setPast] = useState<StorefrontHomeTheme[]>([]);
  const [future, setFuture] = useState<StorefrontHomeTheme[]>([]);
  const [tab, setTab] = useState<Tab>('sections');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState<HomeSectionType>('announcement_bar');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [helpOpen, setHelpOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const draggedId = useRef<string | null>(null);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prevSnap = p[p.length - 1];
      setDraft((current) => {
        setFuture((f) => [cloneTheme(current), ...f]);
        return prevSnap;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextSnap = f[0];
      setDraft((current) => {
        setPast((p) => [...p.slice(-49), cloneTheme(current)]);
        return nextSnap;
      });
      return f.slice(1);
    });
  }, []);

  useEffect(() => {
    const next = mergeStorefrontHomeTheme(store.settings?.storefront_home ?? null);
    setDraft(next);
    setPast([]);
    setFuture([]);
  }, [store.id, store.settings?.storefront_home]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const selected = useMemo(
    () => draft.sections.find((s) => s.id === selectedId) ?? null,
    [draft.sections, selectedId]
  );

  const previewStyle = useMemo(() => themeToCssVars(draft.theme), [draft.theme]);

  const isMintMarketplaceLayout = useMemo(
    () => isMintMarketplaceSectionOrder(draft.sections),
    [draft.sections]
  );

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const storefront_home: StorefrontHomeTheme = {
        ...draft,
        preset: isMintMarketplaceSectionOrder(draft.sections) ? MINT_MARKETPLACE_PRESET : null,
      };
      const settings = {
        ...(store.settings ?? {}),
        storefront_home,
      };
      const updated = await apiRequest<StoreSummary>('/store', {
        method: 'PATCH',
        token,
        storeId: store.id,
        body: {
          name: store.name,
          email: store.email ?? null,
          plan: store.plan,
          is_active: store.is_active,
          settings,
        },
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    setDraft((d) => {
      const idx = d.sections.findIndex((s) => s.id === id);
      if (idx < 0) return d;
      const next = idx + dir;
      if (next < 0 || next >= d.sections.length) return d;
      const copy = [...d.sections];
      const t = copy[idx];
      copy[idx] = copy[next];
      copy[next] = t;
      const out = { ...d, sections: copy };
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return out;
    });
  };

  const reorderDrag = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setDraft((d) => {
      const fromIdx = d.sections.findIndex((s) => s.id === fromId);
      const toIdx = d.sections.findIndex((s) => s.id === toId);
      if (fromIdx < 0 || toIdx < 0) return d;
      const copy = [...d.sections];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return { ...d, sections: copy };
    });
  };

  const removeSection = (id: string) => {
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return { ...d, sections: d.sections.filter((s) => s.id !== id) };
    });
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const addSectionOfType = (type: HomeSectionType) => {
    const s: HomeSection = {
      id: newSectionId(),
      type,
      enabled: true,
      settings: type === 'announcement_bar' ? { text: 'FREE SHIPPING ON ALL ORDERS OVER $150' } : {},
    };
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return { ...d, sections: [...d.sections, s] };
    });
    setSelectedId(s.id);
    setAddMenuOpen(false);
  };

  const updateSection = (id: string, patch: Partial<HomeSection>) => {
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return {
        ...d,
        sections: d.sections.map((s) => {
          if (s.id !== id) return s;
          const n: HomeSection = { ...s, ...patch };
          if (patch.settings !== undefined) {
            n.settings = { ...(s.settings ?? {}), ...patch.settings };
          }
          return n;
        }),
      };
    });
  };

  const setThemeField = <K extends keyof StorefrontHomeTheme['theme']>(key: K, value: StorefrontHomeTheme['theme'][K]) => {
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return { ...d, theme: { ...d.theme, [key]: value } };
    });
  };

  const resetCompactTemplate = () => {
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return { ...d, sections: createDefaultSections(), preset: null };
    });
  };

  /** Same sections as the public marketplace home (`/`). */
  const resetMintMarketplaceDefault = () => {
    setDraft((d) => {
      setPast((p) => [...p.slice(-49), cloneTheme(d)]);
      setFuture([]);
      return mergeStorefrontHomeTheme(null);
    });
  };

  const storefrontUrl = `/?store=${encodeURIComponent(store.slug)}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Top bar — tabs + device / undo / help + live + save */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
            {(['sections', 'theme', 'embeds'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  tab === t ? 'bg-white text-mint shadow-sm ring-1 ring-gray-200/80' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'sections' ? 'Sections' : t === 'theme' ? 'Theme Settings' : 'App Embeds'}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded-md ${previewDevice === 'mobile' ? 'bg-gray-100 text-mint' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Mobile preview"
              aria-label="Mobile preview"
            >
              <IconMobile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded-md ${previewDevice === 'desktop' ? 'bg-gray-100 text-mint' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Desktop preview"
              aria-label="Desktop preview"
            >
              <IconDesktop className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (⌘Z)"
              aria-label="Undo"
            >
              <IconUndo className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (⌘⇧Z)"
              aria-label="Redo"
            >
              <IconRedo className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-50"
              title="Help"
              aria-label="Help"
            >
              <IconHelp className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden md:inline">Live Preview</span>
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-mint"
          >
            Open storefront
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mx-4 mt-2 mb-1 flex flex-wrap items-start gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[11px] leading-snug text-gray-600">
        <span className="font-semibold text-gray-800 shrink-0">Default theme</span>
        <span>
          <span className="text-mint font-medium">{BUILTIN_THEME_PRESETS[0].name}</span> — {BUILTIN_THEME_PRESETS[0].description}
        </span>
        {isMintMarketplaceLayout ? (
          <span className="ml-auto shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">Matches default</span>
        ) : (
          <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Custom</span>
        )}
      </div>

      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)} />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Left — sections (always visible; matches Shopify-style editor) */}
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">Sections</span>
              <div className="relative" ref={addMenuRef}>
                <button
                  type="button"
                  onClick={() => setAddMenuOpen((o) => !o)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-mint/40 hover:text-mint"
                  aria-label="Add section"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
                {addMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-56 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {SECTION_CATALOG.map((c) => (
                      <button
                        key={c.type}
                        type="button"
                        onClick={() => addSectionOfType(c.type)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-mint/10"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2 min-h-0">
              {draft.sections.map((s) => {
                const label = SECTION_CATALOG.find((c) => c.type === s.type)?.label ?? s.type;
                const active = selectedId === s.id;
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => {
                      draggedId.current = s.id;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      const from = draggedId.current;
                      draggedId.current = null;
                      if (from) reorderDrag(from, s.id);
                    }}
                    className={`flex items-center gap-1 rounded-lg border-2 transition ${
                      active ? 'border-mint bg-mint/5 shadow-sm' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className="pl-1 text-gray-300 cursor-grab active:cursor-grabbing select-none" title="Drag to reorder">
                      ⋮⋮
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="flex-1 text-left py-2.5 pr-1 text-sm text-gray-800 truncate"
                    >
                      {label}
                    </button>
                    {active && (
                      <span className="pr-2 text-mint" title="Editing">
                        <IconPencil className="w-4 h-4" />
                      </span>
                    )}
                    <div className="flex flex-col gap-0 pr-1">
                      <button type="button" className="text-[10px] text-gray-400 hover:text-gray-700 py-0.5" onClick={() => move(s.id, -1)} aria-label="Move up">
                        ↑
                      </button>
                      <button type="button" className="text-[10px] text-gray-400 hover:text-gray-700 py-0.5" onClick={() => move(s.id, 1)} aria-label="Move down">
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100 space-y-2 shrink-0">
              <div className="flex gap-2">
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as HomeSectionType)}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 text-xs px-2 py-2"
                >
                  {SECTION_CATALOG.map((c) => (
                    <option key={c.type} value={c.type}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addSectionOfType(addType)}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={() => removeSection(selected.id)}
                  className="w-full rounded-lg border border-red-200 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Remove selected
                </button>
              )}
              <button
                type="button"
                onClick={resetMintMarketplaceDefault}
                className="w-full rounded-lg border border-mint/30 bg-mint/5 py-2 text-[11px] font-semibold text-mint hover:bg-mint/10"
              >
                Apply Mint Marketplace (default)
              </button>
              <p className="text-[10px] text-gray-400">Same blocks as the public home page ·</p>
              <button type="button" onClick={resetCompactTemplate} className="w-full text-[11px] text-gray-500 hover:text-mint hover:underline">
                Reset to compact showcase template
              </button>
            </div>
            <EditorTip />
          </aside>

        {/* Center — preview */}
        <div className="flex-1 flex flex-col items-center justify-start bg-gradient-to-b from-gray-200/90 to-gray-300/80 overflow-y-auto py-6 px-4 min-h-0">
          <p className="text-xs text-gray-500 mb-3">
            {previewDevice === 'mobile' ? 'Mobile' : 'Desktop'} preview · draft styles
          </p>
          <div
            className={`shadow-2xl overflow-hidden bg-white border border-gray-300/80 transition-all duration-200 ${
              previewDevice === 'mobile'
                ? 'w-[min(100%,360px)] rounded-[2rem] border-8 border-gray-800'
                : 'w-full max-w-4xl rounded-lg border border-gray-200'
            }`}
            style={{ ...previewStyle, fontFamily: draft.theme.fontBody }}
          >
            <div className="h-8 bg-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 border-b border-gray-200">
              <span className="rounded-full w-2 h-2 bg-gray-300" />
              <span>
                {previewDevice === 'mobile' ? 'mint.app' : 'storefront'} · {store.slug}
              </span>
            </div>
            <div className={previewDevice === 'desktop' ? 'max-h-[560px] overflow-y-auto' : 'max-h-[520px] overflow-y-auto'}>
              {draft.sections
                .filter((s) => s.enabled !== false)
                .slice(0, 8)
                .map((s) => (
                  <PreviewBlock key={s.id} section={s} theme={draft.theme} device={previewDevice} />
                ))}
            </div>
          </div>
        </div>

        {/* Right — settings */}
        <aside className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto min-h-0">
          {tab === 'embeds' && (
            <div className="p-5 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">App embeds</p>
              <p className="text-xs">Install apps that inject scripts or widgets into your storefront (checkout extensions, analytics, chat). Configuration will appear here.</p>
            </div>
          )}

          {tab === 'sections' && selected && (
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Section</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.enabled !== false}
                  onChange={(e) => updateSection(selected.id, { enabled: e.target.checked })}
                />
                Visible on storefront
              </label>
              {selected.type === 'announcement_bar' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Banner text</label>
                  <textarea
                    value={typeof selected.settings?.text === 'string' ? selected.settings.text : ''}
                    onChange={(e) => updateSection(selected.id, { settings: { text: e.target.value } })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="FREE SHIPPING…"
                  />
                </div>
              )}
              {selected.type === 'video_hero' && (
                <div className="space-y-3 text-xs text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">Video Hero</span> uses your theme colors and shows a featured story block on the home page.
                  </p>
                  <label className="block text-xs font-medium text-gray-700">Eyebrow</label>
                  <input
                    type="text"
                    defaultValue="Featured"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    readOnly
                  />
                </div>
              )}
              {selected.type !== 'announcement_bar' && selected.type !== 'video_hero' && (
                <p className="text-xs text-gray-500">Fine-grained controls for this block type can be extended here (copy, images, links).</p>
              )}
            </div>
          )}

          {tab === 'sections' && !selected && (
            <div className="p-5 text-sm text-gray-500">Select a section in the list, or switch to Theme Settings.</div>
          )}

          {tab === 'theme' && (
            <div className="p-5 space-y-6">
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:border-mint/50 hover:bg-mint/5"
              >
                View storefront
              </a>

              <div>
                <h3 className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase mb-3">Typography</h3>
                <label className="block text-xs text-gray-600 mb-1">Headings</label>
                <select
                  value={draft.theme.fontHeading}
                  onChange={(e) => setThemeField('fontHeading', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm mb-3 bg-white"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-gray-600 mb-1">Body text</label>
                <select
                  value={draft.theme.fontBody}
                  onChange={(e) => setThemeField('fontBody', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={`b-${f.value}`} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase mb-3">Global Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['colorPrimary', 'Primary'],
                      ['colorSecondary', 'Secondary'],
                      ['colorBackground', 'Background'],
                      ['colorAccent', 'Accent'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-600 mb-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.theme[key]}
                          onChange={(e) => setThemeField(key, e.target.value)}
                          className="h-11 w-14 cursor-pointer rounded border border-gray-200 p-0.5"
                        />
                        <span className="text-[10px] font-mono text-gray-500 truncate">{draft.theme[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase mb-3">Button Styles</h3>
                <label className="block text-xs text-gray-600 mb-1">
                  Corner roundness: <span className="font-medium text-gray-800">{buttonRadiusLabel(draft.theme.buttonCornerRoundness)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.theme.buttonCornerRoundness}
                  onChange={(e) => setThemeField('buttonCornerRoundness', Number(e.target.value))}
                  className="w-full accent-mint"
                />
                <label className="block text-xs text-gray-600 mt-3 mb-1">
                  Border weight: <span className="font-medium text-gray-800">{draft.theme.buttonBorderWeight}px</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={draft.theme.buttonBorderWeight}
                  onChange={(e) => setThemeField('buttonBorderWeight', Number(e.target.value))}
                  className="w-full accent-mint"
                />
              </div>

              <div>
                <h3 className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase mb-3">Layout</h3>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-gray-800">Wide layout</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.theme.wideLayout}
                    onClick={() => setThemeField('wideLayout', !draft.theme.wideLayout)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      draft.theme.wideLayout ? 'bg-mint' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        draft.theme.wideLayout ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <label className="block text-xs text-gray-600 mt-4 mb-1">
                  Section spacing: <span className="font-medium text-gray-800">{draft.theme.sectionSpacing}px</span>
                </label>
                <input
                  type="range"
                  min={24}
                  max={96}
                  step={4}
                  value={draft.theme.sectionSpacing}
                  onChange={(e) => setThemeField('sectionSpacing', Number(e.target.value))}
                  className="w-full accent-mint"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraft((d) => {
                    const a = d.theme.colorPrimary;
                    const b = d.theme.colorAccent;
                    setPast((p) => [...p.slice(-49), cloneTheme(d)]);
                    setFuture([]);
                    return {
                      ...d,
                      theme: {
                        ...d.theme,
                        colorSecondary: b,
                        colorAccent: a,
                      },
                    };
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint py-3.5 text-sm font-semibold text-white shadow-md hover:bg-mint-dark"
              >
                <IconWand className="w-5 h-5" />
                Generate AI Palette
              </button>
              <p className="text-[11px] text-gray-400 text-center">Harmonizes accent and secondary from your primary palette.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EditorTip() {
  return (
    <div className="mx-2 mb-3 rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50/90 px-3 py-3 text-[11px] leading-relaxed text-amber-950 shadow-sm">
      <p className="font-semibold text-amber-900 mb-1">Editor tip</p>
      <p>Add a <span className="font-medium">Multi-column</span> section to highlight what makes your brand different—shipping, returns, or sustainability.</p>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Theme editor help</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘Z</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Z</kbd> undo
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘⇧Z</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Shift+Z</kbd> redo
          </li>
          <li>Drag sections by the grip (⋮⋮) to reorder, or use ↑ ↓.</li>
          <li>Use <span className="font-medium">Save</span> to publish changes to your live storefront.</li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-mint py-2.5 text-sm font-semibold text-white hover:bg-mint-dark"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function PreviewBlock({
  section,
  theme,
  device,
}: {
  section: HomeSection;
  theme: StorefrontHomeTheme['theme'];
  device: 'mobile' | 'desktop';
}) {
  const primary = theme.colorPrimary;
  const accent = theme.colorAccent;
  const r = Math.min(48, (theme.buttonCornerRoundness / 100) * 48);
  const pad = device === 'desktop' ? 'px-8 py-6' : 'px-3 py-6';

  if (section.type === 'default_hero') {
    return (
      <div
        className={`${pad} bg-cover bg-center relative overflow-hidden`}
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.88)), url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80)',
        }}
      >
        <div className="relative z-10 max-w-[95%]">
          <p className="text-[8px] font-semibold text-mint mb-1.5 inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5">MINT CONDITION MARKETPLACE</p>
          <p
            className={`font-extrabold text-gray-900 leading-tight mb-1 ${device === 'desktop' ? 'text-sm' : 'text-xs'}`}
            style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
          >
            Sell Your Assets <span style={{ color: primary }}>With Ease.</span>
          </p>
          <p className="text-[8px] text-gray-600 mb-2 leading-snug">Browse verified listings from trusted sellers.</p>
          <div className="flex gap-1.5">
            <div className="flex-1 h-7 rounded-md bg-white border border-gray-200 text-[8px] flex items-center px-2 text-gray-400">Search…</div>
            <div className="h-7 px-2 rounded-md text-[8px] font-semibold text-white flex items-center" style={{ backgroundColor: primary }}>
              Go
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (section.type === 'announcement_bar') {
    const text =
      typeof section.settings?.text === 'string' && section.settings.text.trim()
        ? section.settings.text
        : 'FREE SHIPPING ON ALL ORDERS OVER $150 • LIMITED TIME OFFER';
    return (
      <div className="py-2.5 px-3 text-[10px] sm:text-[11px] text-center font-medium" style={{ backgroundColor: accent, color: theme.colorSecondary }}>
        {text}
      </div>
    );
  }
  if (section.type === 'video_hero') {
    return (
      <div className={`${pad} text-white relative`} style={{ background: `linear-gradient(135deg, ${primary}, #0f172a)` }}>
        <div className={`flex flex-col ${device === 'desktop' ? 'md:flex-row md:items-center md:justify-between' : ''} gap-6`}>
          <div className="max-w-xl">
            <p className="text-[9px] uppercase tracking-wider opacity-80 mb-1">Featured</p>
            <p className={`font-bold mb-2 ${device === 'desktop' ? 'text-2xl' : 'text-lg'}`} style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}>
              Motion in Minimal
            </p>
            <p className="text-slate-300 text-[10px] mb-4">Curated pieces for modern living.</p>
            <div className="flex flex-wrap gap-2">
              <span
                className="px-3 py-2 text-[10px] font-semibold bg-white text-gray-900"
                style={{ borderRadius: r, borderWidth: theme.buttonBorderWeight, borderStyle: 'solid', borderColor: primary }}
              >
                Explore Video
              </span>
              <span className="px-3 py-2 text-[10px] font-semibold border border-white/70 text-white" style={{ borderRadius: r }}>
                Shop Now
              </span>
            </div>
          </div>
          <div className="flex justify-center md:justify-end shrink-0">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl"
              style={{ backgroundColor: accent, color: primary }}
            >
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (section.type === 'multi_column') {
    const cols =
      device === 'desktop'
        ? [
            ['Sustainable', 'Ethically made materials.'],
            ['Fast Delivery', 'Tracked shipping nationwide.'],
            ['Lifetime Warranty', 'We stand behind every order.'],
          ]
        : [
            ['Sustainable', 'Ethically made.'],
            ['Fast Delivery', 'Tracked shipping.'],
            ['Lifetime Warranty', 'We stand behind every order.'],
          ];
    return (
      <div
        className={`px-3 py-5 grid gap-3 text-center ${device === 'desktop' ? 'grid-cols-3' : 'grid-cols-3'}`}
        style={{ marginTop: theme.sectionSpacing / 5, fontFamily: 'var(--sf-font-body, inherit)' }}
      >
        {cols.map(([title, sub]) => (
          <div key={title} className="text-[9px] text-gray-600">
            <div className="h-7 w-7 rounded-full mx-auto mb-1.5" style={{ backgroundColor: `${primary}33` }} />
            <div className="font-semibold mb-0.5" style={{ color: primary }}>
              {title}
            </div>
            <div className="text-[8px] leading-tight opacity-90">{sub}</div>
          </div>
        ))}
      </div>
    );
  }
  const label = SECTION_CATALOG.find((c) => c.type === section.type)?.label ?? section.type;
  return (
    <div className="px-3 py-3 border-t border-gray-100 text-[10px] text-gray-500" style={{ marginTop: theme.sectionSpacing / 4 }}>
      {label}
    </div>
  );
}

function IconMobile({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function IconDesktop({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

function IconUndo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function IconRedo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  );
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function IconWand({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
