'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, type StoreSummary, type StorefrontAppEmbed } from '@/lib/api';
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
  mergeDefaultHeroSettings,
  DEFAULT_HERO_SECTION_SETTINGS,
  type HeroSearchCategory,
  type HeroPopularLink,
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

function normalizeAppEmbeds(raw: unknown): StorefrontAppEmbed[] {
  if (!Array.isArray(raw)) return [];
  const out: StorefrontAppEmbed[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id.trim() : '';
    if (!id) continue;
    const name = typeof r.name === 'string' ? r.name.trim() : 'App embed';
    let script_url: string | null = typeof r.script_url === 'string' ? r.script_url.trim() : null;
    if (script_url === '') script_url = null;
    out.push({
      id,
      name: name || 'App embed',
      script_url,
      enabled: r.enabled !== false,
    });
  }
  return out;
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
  const [embedDraft, setEmbedDraft] = useState<StorefrontAppEmbed[]>(() => normalizeAppEmbeds(store.settings?.storefront_app_embeds));
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
    setEmbedDraft(normalizeAppEmbeds(store.settings?.storefront_app_embeds));
  }, [store.id, store.settings?.storefront_app_embeds]);

  const publishedThemeBaseline = useMemo(
    () => mergeStorefrontHomeTheme(store.settings?.storefront_home ?? null),
    [store.id, store.settings?.storefront_home]
  );
  const publishedEmbedsBaseline = useMemo(
    () => normalizeAppEmbeds(store.settings?.storefront_app_embeds),
    [store.id, store.settings?.storefront_app_embeds]
  );

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(draft) !== JSON.stringify(publishedThemeBaseline) ||
      JSON.stringify(embedDraft) !== JSON.stringify(publishedEmbedsBaseline)
    );
  }, [draft, embedDraft, publishedThemeBaseline, publishedEmbedsBaseline]);

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
      const updated = await apiRequest<StoreSummary>('/store/theme', {
        method: 'PATCH',
        token,
        storeId: store.id,
        body: {
          storefront_home,
          storefront_app_embeds: embedDraft.map((e) => ({
            id: e.id,
            name: (e.name ?? '').trim() || 'App embed',
            script_url: (e.script_url ?? '').trim() || null,
            enabled: e.enabled !== false,
          })),
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#f0f0f1] rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Top bar — WordPress Customizer–style: title, preview devices, publish */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Customize: {store.name}</h2>
            <p className="text-[11px] text-gray-500 hidden sm:block">You are customizing your storefront theme. Changes apply after you publish.</p>
          </div>
          {isDirty ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 border border-amber-200/80">
              Unsaved changes
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 border border-gray-200">
              Published
            </span>
          )}
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
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-mint"
          >
            Open site in new tab
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-mint px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)} />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Left — WordPress Customizer–style: panels + options */}
        <aside className="w-full max-w-[440px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
          <div className="shrink-0 border-b border-gray-200 bg-[#f6f7f7] px-2 py-2">
            <div className="flex gap-0.5 rounded-lg bg-white/90 p-0.5 border border-gray-200/80 shadow-sm">
              {(['sections', 'theme', 'embeds'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition ${
                    tab === t ? 'bg-white text-mint shadow-sm ring-1 ring-gray-200/80' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t === 'sections' ? 'Home sections' : t === 'theme' ? 'Colors & fonts' : 'App embeds'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-gray-500 leading-snug">
              <span className="font-medium text-gray-700">{BUILTIN_THEME_PRESETS[0].name}</span>
              {isMintMarketplaceLayout ? ' · Default layout' : ' · Custom layout'}
            </p>
          </div>

          {tab === 'sections' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
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
            <div className="max-h-[min(260px,36vh)] overflow-y-auto py-2 space-y-1 px-2 shrink-0 border-b border-gray-100 bg-white">
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
            <div className="flex-1 overflow-y-auto min-h-0 border-t border-gray-100 bg-white">
              {selected && (
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Section settings</h3>
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
                  {selected.type === 'default_hero' && (
                    <DefaultHeroSectionEditor selected={selected} updateSection={updateSection} />
                  )}
                  {selected.type !== 'announcement_bar' &&
                    selected.type !== 'video_hero' &&
                    selected.type !== 'default_hero' && (
                      <p className="text-xs text-gray-500">Fine-grained controls for this block type can be extended here (copy, images, links).</p>
                    )}
                </div>
              )}
              {!selected && (
                <div className="p-4 text-sm text-gray-500">
                  Select a section in the list to edit it, or open <span className="font-medium">Colors & fonts</span>.
                </div>
              )}
            </div>
            <EditorTip />
            </div>
          )}

          {tab === 'theme' && (
            <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-6 border-t border-gray-100">
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:border-mint/50 hover:bg-mint/5"
              >
                View live storefront
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

          {tab === 'embeds' && (
            <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4 text-sm text-gray-600 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900 mb-1">App embeds</p>
                <p className="text-xs leading-relaxed">
                  Add HTTPS JavaScript URLs (e.g. analytics or chat loaders). Scripts load on your public store home after the page becomes interactive.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEmbedDraft((rows) => [
                    ...rows,
                    { id: newSectionId(), name: 'New embed', script_url: null, enabled: true },
                  ])
                }
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Add embed
              </button>
              <ul className="space-y-4">
                {embedDraft.map((row, idx) => (
                  <li key={row.id} className="rounded-xl border border-gray-200 p-3 space-y-2 bg-gray-50/80">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-500">Embed {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setEmbedDraft((rows) => rows.filter((r) => r.id !== row.id))}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="block text-xs font-medium text-gray-700">Label</label>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        setEmbedDraft((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r))
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                      placeholder="e.g. Analytics"
                    />
                    <label className="block text-xs font-medium text-gray-700">Script URL (https)</label>
                    <input
                      type="url"
                      value={row.script_url ?? ''}
                      onChange={(e) =>
                        setEmbedDraft((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, script_url: e.target.value || null } : r))
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono bg-white"
                      placeholder="https://cdn.example.com/loader.js"
                      inputMode="url"
                      autoComplete="off"
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={row.enabled !== false}
                        onChange={(e) =>
                          setEmbedDraft((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, enabled: e.target.checked } : r))
                          )
                        }
                      />
                      Enabled on storefront
                    </label>
                  </li>
                ))}
              </ul>
              {embedDraft.length === 0 ? (
                <p className="text-xs text-gray-500">No embeds yet. Add one to inject a third-party script on <code className="text-[11px] bg-gray-100 px-1 rounded">/?store=…</code>.</p>
              ) : null}
            </div>
          )}
        </aside>

        {/* Live preview (WordPress Customizer–style: controls left, site right) */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#cfcfcf] border-l border-gray-400/40">
          <div className="shrink-0 px-4 py-2.5 bg-[#dcdcde] border-b border-gray-400/35 text-[11px] text-gray-800">
            <span className="font-semibold">Live preview</span>
            <span className="text-gray-600"> — changes appear here as you edit. Use </span>
            <span className="font-semibold">Publish</span>
            <span className="text-gray-600"> to make them visible to shoppers.</span>
          </div>
          <div className="flex-1 flex flex-col items-center overflow-y-auto py-6 px-4 min-h-0">
            <p className="text-xs text-gray-600 mb-3">
              {previewDevice === 'mobile' ? 'Mobile' : 'Desktop'} · draft (not public until published)
            </p>
            <div
              className={`shadow-2xl overflow-hidden bg-white border border-gray-300/80 transition-all duration-200 ${
                previewDevice === 'mobile'
                  ? 'w-[min(100%,360px)] rounded-[2rem] border-8 border-gray-800'
                  : 'w-full max-w-5xl rounded-lg border border-gray-200'
              }`}
              style={{ ...previewStyle, fontFamily: draft.theme.fontBody }}
            >
              <div className="h-8 bg-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 border-b border-gray-200">
                <span className="rounded-full w-2 h-2 bg-gray-300" />
                <span>
                  {previewDevice === 'mobile' ? 'mint.app' : 'storefront'} · {store.slug}
                </span>
              </div>
              <div
                className={
                  previewDevice === 'desktop'
                    ? 'max-h-[min(720px,calc(100vh-13rem))] overflow-y-auto'
                    : 'max-h-[min(580px,calc(100vh-15rem))] overflow-y-auto'
                }
              >
                {draft.sections
                  .filter((s) => s.enabled !== false)
                  .map((s) => (
                    <PreviewBlock key={s.id} section={s} theme={draft.theme} device={previewDevice} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultHeroSectionEditor({
  selected,
  updateSection,
}: {
  selected: HomeSection;
  updateSection: (id: string, patch: Partial<HomeSection>) => void;
}) {
  const eff = mergeDefaultHeroSettings(selected.settings ?? null);
  const raw = selected.settings ?? {};

  const set = (patch: Record<string, unknown>) =>
    updateSection(selected.id, { settings: { ...raw, ...patch } });

  const categories: HeroSearchCategory[] = eff.searchCategories ?? DEFAULT_HERO_SECTION_SETTINGS.searchCategories!;
  const popular: HeroPopularLink[] = eff.popularLinks ?? DEFAULT_HERO_SECTION_SETTINGS.popularLinks!;

  const updateCategory = (index: number, row: HeroSearchCategory) => {
    const next = categories.map((c, i) => (i === index ? row : c));
    set({ searchCategories: next });
  };
  const addCategory = () => {
    set({ searchCategories: [...categories, { value: `cat-${categories.length + 1}`, label: 'New category' }] });
  };
  const removeCategory = (index: number) => {
    if (categories.length <= 1) return;
    set({ searchCategories: categories.filter((_, i) => i !== index) });
  };

  const updatePopular = (index: number, row: HeroPopularLink) => {
    const next = popular.map((c, i) => (i === index ? row : c));
    set({ popularLinks: next });
  };
  const addPopular = () => {
    set({ popularLinks: [...popular, { label: 'Link', url: '/products' }] });
  };
  const removePopular = (index: number) => {
    if (popular.length <= 1) return;
    set({ popularLinks: popular.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-gray-600 leading-relaxed">
        Headline, search, and hero background. Accent colors come from <span className="font-medium text-gray-800">Colors & fonts</span>.
      </p>
      <label className="block text-xs font-medium text-gray-700">Badge</label>
      <input
        type="text"
        value={eff.badgeText ?? ''}
        onChange={(e) => set({ badgeText: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder={DEFAULT_HERO_SECTION_SETTINGS.badgeText}
      />
      <label className="block text-xs font-medium text-gray-700">Headline (first line)</label>
      <input
        type="text"
        value={eff.headlineLine1 ?? ''}
        onChange={(e) => set({ headlineLine1: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder={DEFAULT_HERO_SECTION_SETTINGS.headlineLine1}
      />
      <label className="block text-xs font-medium text-gray-700">Headline (accent)</label>
      <input
        type="text"
        value={eff.headlineAccent ?? ''}
        onChange={(e) => set({ headlineAccent: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder={DEFAULT_HERO_SECTION_SETTINGS.headlineAccent}
      />
      <label className="block text-xs font-medium text-gray-700">Description</label>
      <textarea
        value={eff.description ?? ''}
        onChange={(e) => set({ description: e.target.value })}
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder={DEFAULT_HERO_SECTION_SETTINGS.description}
      />
      <label className="block text-xs font-medium text-gray-700">Search placeholder</label>
      <input
        type="text"
        value={eff.searchPlaceholder ?? ''}
        onChange={(e) => set({ searchPlaceholder: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder={DEFAULT_HERO_SECTION_SETTINGS.searchPlaceholder}
      />
      <label className="block text-xs font-medium text-gray-700">Hero background image URL</label>
      <input
        type="url"
        value={eff.backgroundImageUrl ?? ''}
        onChange={(e) => set({ backgroundImageUrl: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono"
        placeholder="https://…"
      />
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Search category dropdown</span>
          <button type="button" onClick={addCategory} className="text-[11px] font-medium text-mint hover:underline">
            Add row
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mb-2">Use value <code className="bg-gray-100 px-1 rounded">all</code> for “All categories”.</p>
        <ul className="space-y-2">
          {categories.map((row, i) => (
            <li key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateCategory(i, { ...row, value: e.target.value })}
                className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs"
                placeholder="value"
              />
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateCategory(i, { ...row, label: e.target.value })}
                className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs"
                placeholder="Label"
              />
              <button
                type="button"
                onClick={() => removeCategory(i)}
                className="text-xs text-red-600 hover:underline shrink-0"
                disabled={categories.length <= 1}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Popular quick links</span>
          <button type="button" onClick={addPopular} className="text-[11px] font-medium text-mint hover:underline">
            Add link
          </button>
        </div>
        <ul className="space-y-2">
          {popular.map((row, i) => (
            <li key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updatePopular(i, { ...row, label: e.target.value })}
                className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs"
                placeholder="Label"
              />
              <input
                type="text"
                value={row.url}
                onChange={(e) => updatePopular(i, { ...row, url: e.target.value })}
                className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs font-mono"
                placeholder="/path or https://"
              />
              <button
                type="button"
                onClick={() => removePopular(i)}
                className="text-xs text-red-600 hover:underline shrink-0"
                disabled={popular.length <= 1}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Customizer help</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>
            Like WordPress: <span className="font-medium">Home sections</span>, <span className="font-medium">Colors & fonts</span>, and <span className="font-medium">App embeds</span> are in the left panel; the large area on the right is a live draft preview.
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘Z</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Z</kbd> undo ·{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘⇧Z</kbd> redo
          </li>
          <li>Drag sections by ⋮⋮ to reorder, or use ↑ ↓.</li>
          <li>
            Click <span className="font-medium">Publish</span> when you are ready — until then, the live site keeps the last published version.
          </li>
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
    const hero = mergeDefaultHeroSettings(section.settings ?? null);
    const bgUrl =
      hero.backgroundImageUrl?.trim() ||
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';
    return (
      <div
        className={`${pad} bg-cover bg-center relative overflow-hidden`}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.88)), url(${bgUrl})`,
        }}
      >
        <div className="relative z-10 max-w-[95%]">
          <p className="text-[8px] font-semibold text-mint mb-1.5 inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5">
            {hero.badgeText}
          </p>
          <p
            className={`font-extrabold text-gray-900 leading-tight mb-1 ${device === 'desktop' ? 'text-sm' : 'text-xs'}`}
            style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
          >
            {hero.headlineLine1}{' '}
            <span style={{ color: primary }}>{hero.headlineAccent}</span>
          </p>
          <p className="text-[8px] text-gray-600 mb-2 leading-snug line-clamp-2">{hero.description}</p>
          <div className="flex gap-1.5">
            <div className="flex-1 h-7 rounded-md bg-white border border-gray-200 text-[8px] flex items-center px-2 text-gray-400 truncate">
              {hero.searchPlaceholder}
            </div>
            <div className="h-7 px-2 rounded-md text-[8px] font-semibold text-white flex items-center shrink-0" style={{ backgroundColor: primary }}>
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
