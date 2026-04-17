'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useContentRoutes } from '@/context/ContentRoutesContext';
import { useStore } from '@/context/StoreContext';
import { apiRequest, getImageDisplayUrl, uploadContentLibraryFile } from '@/lib/api';
import {
  slugifyPageHandle,
  type CmsPageLayoutWidth,
  type CmsPageStatus,
  type StoreContentPage,
  normalizeCmsPageLayoutWidth,
  normalizeCmsPageStatus,
  CMS_PAGE_LAYOUT_OPTIONS,
  CMS_PAGE_STATUS_OPTIONS,
  normalizeCustomFields,
  type CmsPageCustomField,
} from '@/lib/storePages';
import PageRichTextEditor, { type PageRichTextEditorHandle } from '@/components/admin/PageRichTextEditor';
import PageBlockLibrary, { type BlockLibraryTab } from '@/components/admin/PageBlockLibrary';

type ContentFile = { id: string; name: string; url: string };

type ContentResponse = {
  data: {
    pages: StoreContentPage[];
    files?: ContentFile[];
  };
};

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultScheduleDatetimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function publishTimingLabel(status: CmsPageStatus, scheduleAt: string, publishedAtIso: string | null): string {
  if (status === 'scheduled' && scheduleAt) {
    const d = new Date(scheduleAt);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }
  if (status === 'published') {
    if (publishedAtIso) {
      const d = new Date(publishedAtIso);
      return Number.isNaN(d.getTime()) ? 'Immediately' : d.toLocaleString();
    }
    return 'Immediately';
  }
  return '—';
}

function primarySaveLabel(status: CmsPageStatus, saving: boolean): string {
  if (saving) return 'Saving…';
  switch (status) {
    case 'draft':
      return 'Save draft';
    case 'pending':
      return 'Submit for review';
    case 'published':
      return 'Update';
    case 'scheduled':
      return 'Schedule';
    case 'private':
      return 'Update';
    default:
      return 'Save';
  }
}

function parentOptions(pages: StoreContentPage[], currentId: string | null): { id: string; title: string }[] {
  return pages
    .filter((p) => p.id !== currentId)
    .map((p) => ({ id: p.id, title: p.title }));
}

export default function PageEditorShell({ mode, pageId }: { mode: 'create' | 'edit'; pageId?: string }) {
  const routes = useContentRoutes();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const [allPages, setAllPages] = useState<StoreContentPage[]>([]);
  const [files, setFiles] = useState<ContentFile[]>([]);

  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [body, setBody] = useState('<p></p>');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [pageStatus, setPageStatus] = useState<CmsPageStatus>('draft');
  const [scheduleAt, setScheduleAt] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState<CmsPageLayoutWidth>('default');
  const [editorKey, setEditorKey] = useState(0);
  const featuredFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const editorRef = useRef<PageRichTextEditorHandle>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [sidebarTab, setSidebarTab] = useState<'page' | 'block'>('page');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listViewOpen, setListViewOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [publishedAtSummary, setPublishedAtSummary] = useState<string | null>(null);
  const [lastEditedAt, setLastEditedAt] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CmsPageCustomField[]>(() => normalizeCustomFields(undefined));
  const [blockLibraryOpen, setBlockLibraryOpen] = useState(true);
  const [blockLibraryTab, setBlockLibraryTab] = useState<BlockLibraryTab>('blocks');
  const [blockLibrarySearch, setBlockLibrarySearch] = useState('');
  const [customFieldsOpen, setCustomFieldsOpen] = useState(true);

  const loadContent = useCallback(async () => {
    if (!token || !currentStore) return null;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    const list = Array.isArray(res.data?.pages) ? res.data.pages : [];
    setAllPages(list as StoreContentPage[]);
    const rawFiles = res.data?.files;
    setFiles(Array.isArray(rawFiles) ? rawFiles : []);
    return list as StoreContentPage[];
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    if (mode === 'create') {
      setLoading(true);
      loadContent()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
        .finally(() => setLoading(false));
      return;
    }
    if (!pageId) {
      setMissing(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadContent()
      .then((list) => {
        const p = list?.find((x) => String(x.id) === String(pageId));
        if (!p) {
          setMissing(true);
          return;
        }
        setMissing(false);
        setTitle(p.title);
        setHandle(p.handle);
        setHandleTouched(true);
        setBody(p.body && p.body.trim() !== '' ? p.body : '<p></p>');
        setExcerpt(p.excerpt ?? '');
        setFeaturedImage(p.featured_image ?? '');
        setParentId(p.parent_id ?? '');
        const st = normalizeCmsPageStatus(p.status, p.published);
        setPageStatus(st);
        setScheduleAt(isoToDatetimeLocalValue(p.published_at) || defaultScheduleDatetimeLocal());
        setSortOrder(typeof p.sort_order === 'number' ? p.sort_order : 0);
        setLayoutWidth(normalizeCmsPageLayoutWidth(p.layout_width));
        setCustomFields(normalizeCustomFields(p.custom_fields));
        setPublishedAtSummary(p.published_at ?? null);
        setLastEditedAt(p.updated_at ?? p.created_at ?? null);
        setEditorKey((k) => k + 1);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'))
      .finally(() => setLoading(false));
  }, [token, currentStore, mode, pageId, loadContent]);

  useEffect(() => {
    if (mode !== 'create' || handleTouched) return;
    const auto = slugifyPageHandle(title);
    setHandle(auto);
  }, [title, handleTouched, mode]);

  const parents = useMemo(
    () => parentOptions(allPages, mode === 'edit' && pageId ? pageId : null),
    [allPages, mode, pageId]
  );

  const authorDisplay = useMemo(() => {
    const u = session?.user as { name?: string | null; email?: string | null } | undefined;
    if (u?.name?.trim()) return u.name.trim();
    if (u?.email?.trim()) return u.email.trim();
    return '—';
  }, [session]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'k') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      e.preventDefault();
      document.getElementById('wp-page-editor-title')?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [moreMenuOpen]);

  const storeSlug = currentStore?.slug?.trim() ?? '';
  const storefrontPreviewPath = handle ? `/pages/${handle}${storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : ''}` : '';

  const scheduleDateMs = scheduleAt ? new Date(scheduleAt).getTime() : NaN;
  const scheduledIsPast = pageStatus === 'scheduled' && !Number.isNaN(scheduleDateMs) && scheduleDateMs <= Date.now();
  const showViewLive =
    Boolean(storefrontPreviewPath) &&
    (pageStatus === 'published' || pageStatus === 'private' || scheduledIsPast);

  const uploadImageToLibrary = useCallback(
    async (file: File) => {
      if (!token || !currentStore) {
        throw new Error('Select a store and sign in.');
      }
      const res = await uploadContentLibraryFile(file, { token, storeId: currentStore.id });
      await loadContent();
      return res.data.url;
    },
    [token, currentStore, loadContent]
  );

  const onFeaturedFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token || !currentStore) return;
    setUploadingFeatured(true);
    setError(null);
    try {
      const url = await uploadImageToLibrary(file);
      setFeaturedImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingFeatured(false);
    }
  };

  const save = async () => {
    const t = title.trim();
    const h = handle.trim().toLowerCase();
    if (!t || !h) {
      setError('Title and URL slug are required.');
      return;
    }
    if (pageStatus === 'scheduled') {
      if (!scheduleAt.trim()) {
        setError('Choose a date and time to schedule this page.');
        return;
      }
      const ms = new Date(scheduleAt).getTime();
      if (Number.isNaN(ms)) {
        setError('Invalid schedule date.');
        return;
      }
    }
    if (!token || !currentStore) return;
    if (mode === 'edit' && !pageId) {
      setError('Missing page id.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: t,
        handle: h,
        body: body.trim() === '' || body === '<p></p>' ? null : body,
        excerpt: excerpt.trim() || null,
        featured_image: featuredImage.trim() || null,
        parent_id: parentId ? parseInt(parentId, 10) : null,
        layout_width: layoutWidth,
        sort_order: sortOrder,
        status: pageStatus,
      };
      if (pageStatus === 'scheduled') {
        payload.published_at = new Date(scheduleAt).toISOString();
      } else if (pageStatus === 'published') {
        // Keep existing published_at on the server when omitted
      } else {
        payload.published_at = null;
      }
      payload.custom_fields = customFields
        .filter((r) => r.name.trim() !== '' || r.value.trim() !== '')
        .map((r) => ({ name: r.name.trim(), value: r.value.trim() }));
      if (mode === 'create') {
        const res = await apiRequest<{ data: StoreContentPage }>('/store/pages', {
          method: 'POST',
          token,
          storeId: currentStore.id,
          body: payload,
        });
        router.replace(routes.page(res.data.id));
        return;
      }
      const res = await apiRequest<{ data: StoreContentPage }>(`/store/pages/${pageId}`, {
        method: 'PUT',
        token,
        storeId: currentStore.id,
        body: payload,
      });
      const d = res.data;
      setTitle(d.title);
      setHandle(d.handle);
      setBody(d.body && d.body.trim() !== '' ? d.body : '<p></p>');
      setExcerpt(d.excerpt ?? '');
      setFeaturedImage(d.featured_image ?? '');
      setParentId(d.parent_id ?? '');
      const st = normalizeCmsPageStatus(d.status, d.published);
      setPageStatus(st);
      setScheduleAt(isoToDatetimeLocalValue(d.published_at) || defaultScheduleDatetimeLocal());
      setSortOrder(typeof d.sort_order === 'number' ? d.sort_order : 0);
      setLayoutWidth(normalizeCmsPageLayoutWidth(d.layout_width));
      setCustomFields(normalizeCustomFields(d.custom_fields));
      setPublishedAtSummary(d.published_at ?? null);
      setLastEditedAt(d.updated_at ?? null);
      setEditorKey((k) => k + 1);
      await loadContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select a store from the header.</div>
      </div>
    );
  }

  if (mode === 'edit' && missing && !loading) {
    return (
      <div className="min-h-full bg-gray-50/60 p-6">
        <Link href={routes.pages} className="text-sm text-mint hover:underline">
          ← Pages
        </Link>
        <p className="mt-4 text-sm text-gray-600">Page not found.</p>
      </div>
    );
  }

  const titleBarLabel = title.trim() ? title.trim() : 'No title';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#f0f0f1]">
      <input
        ref={featuredFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onFeaturedFileSelected(ev)}
      />

      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href={routes.pages}
            className="rounded p-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-mint"
            title="All pages"
          >
            ←
          </Link>
          <Link
            href={routes.pages}
            className="flex h-9 w-9 items-center justify-center rounded text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            title="Close"
            aria-label="Close editor"
          >
            ×
          </Link>
          <button
            type="button"
            title="Add block"
            onClick={() => {
              editorRef.current?.focus();
              editorRef.current?.openBlockInserter();
            }}
            className="flex h-9 w-9 items-center justify-center rounded text-lg font-light text-gray-700 hover:bg-gray-100"
          >
            +
          </button>
          <button
            type="button"
            title="Undo"
            onClick={() => editorRef.current?.undo()}
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            ↶
          </button>
          <button
            type="button"
            title="Redo"
            onClick={() => editorRef.current?.redo()}
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            ↷
          </button>
          <button
            type="button"
            title="List view (headings)"
            onClick={() => setListViewOpen(true)}
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            ≡
          </button>
        </div>

        <div className="mx-auto hidden min-w-0 max-w-md flex-1 px-2 text-center sm:block">
          <span className="truncate text-sm text-gray-500" title={`${titleBarLabel} · Page`}>
            {titleBarLabel} <span className="text-gray-400">· Page</span>
          </span>
          <span className="mt-0.5 block text-[10px] text-gray-400">Ctrl+K focus title</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 sm:px-3"
          >
            Save draft
          </button>
          {mode === 'edit' && pageId ? (
            <Link
              href={routes.pagePreview(pageId)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 sm:px-3"
            >
              Preview
            </Link>
          ) : null}
          {showViewLive ? (
            <a
              href={storefrontPreviewPath}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 sm:inline-block sm:px-3"
            >
              View
            </a>
          ) : null}
          <button
            type="button"
            title="Toggle settings sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            className={`rounded p-2 hover:bg-gray-100 ${sidebarOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
          >
            <span className="sr-only">Settings sidebar</span>
            <span aria-hidden className="text-base leading-none">
              ⚙
            </span>
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {primarySaveLabel(pageStatus, saving)}
          </button>
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              title="More"
              onClick={() => setMoreMenuOpen((v) => !v)}
              className="rounded p-2 text-gray-600 hover:bg-gray-100"
            >
              ⋮
            </button>
            {moreMenuOpen ? (
              <div className="absolute right-0 top-full z-40 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {showViewLive ? (
                  <a
                    href={storefrontPreviewPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    View live page
                  </a>
                ) : null}
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    void navigator.clipboard.writeText(`/pages/${handle || ''}`);
                  }}
                >
                  Copy slug path
                </button>
                <Link
                  href={routes.files}
                  className="block px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setMoreMenuOpen(false)}
                >
                  Content → Files
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="p-8 text-sm text-gray-500">Loading editor…</div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {blockLibraryOpen ? (
            <>
              <button
                type="button"
                aria-label="Close block library"
                className="fixed bottom-0 left-0 right-0 z-20 bg-black/30 md:hidden"
                style={{ top: '3.5rem' }}
                onClick={() => setBlockLibraryOpen(false)}
              />
              <div className="fixed bottom-0 left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden md:static md:inset-auto md:z-0 md:h-auto md:min-h-0 md:max-h-[min(100vh-3.5rem,100%)]">
                <PageBlockLibrary
                  open
                  tab={blockLibraryTab}
                  onTabChange={setBlockLibraryTab}
                  search={blockLibrarySearch}
                  onSearchChange={setBlockLibrarySearch}
                  onClose={() => setBlockLibraryOpen(false)}
                  onCommand={(id) => {
                    editorRef.current?.focus();
                    editorRef.current?.runLibraryCommand(id);
                  }}
                  onInsertPatternHtml={(html) => {
                    editorRef.current?.focus();
                    editorRef.current?.insertPatternHtml(html);
                  }}
                />
              </div>
            </>
          ) : null}
          <main className="min-w-0 flex-1 overflow-y-auto bg-white">
            <div className="mx-auto max-w-3xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
              <label className="sr-only" htmlFor="wp-page-editor-title">
                Title
              </label>
              <input
                id="wp-page-editor-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title"
                className="w-full border-0 border-b-2 border-transparent pb-2 text-3xl font-semibold tracking-tight text-gray-900 placeholder:text-gray-400 focus:border-mint focus:outline-none focus:ring-0"
              />
            </div>
            <div className="mx-auto max-w-3xl px-0 sm:px-6">
              <PageRichTextEditor
                ref={editorRef}
                key={editorKey}
                chrome="minimal"
                useExternalBlockLibrary
                onToggleBlockLibraryRequest={() => setBlockLibraryOpen(true)}
                initialHtml={body}
                onChange={setBody}
                uploadImageFile={uploadImageToLibrary}
                onUseAsPageHero={(url) => setFeaturedImage(url)}
              />
            </div>

            <section className="mt-8 border-t border-gray-200 bg-[#f6f7f7] px-4 py-4 sm:px-8">
              <div className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <button
                  type="button"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  title={customFieldsOpen ? 'Collapse' : 'Expand'}
                  aria-expanded={customFieldsOpen}
                  onClick={() => setCustomFieldsOpen((v) => !v)}
                >
                  <span aria-hidden>{customFieldsOpen ? '▼' : '▶'}</span>
                </button>
                <h2 className="flex-1 text-sm font-semibold text-gray-900">Custom Fields</h2>
                <button
                  type="button"
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  title="Page settings"
                  onClick={() => {
                    setSidebarOpen(true);
                    setSidebarTab('page');
                  }}
                >
                  <span aria-hidden>⚙</span>
                </button>
              </div>
              {customFieldsOpen ? (
                <>
              <p className="mt-3 max-w-2xl text-xs text-gray-500">
                Extra metadata as plain text (like WordPress). Values are sanitized on save; use for theme integrations or internal notes.
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Value</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customFields.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2">
                          <input
                            value={row.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFields((prev) => prev.map((r, j) => (j === i ? { ...r, name: v } : r)));
                            }}
                            placeholder="field_key"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 font-mono text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            value={row.value}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFields((prev) => prev.map((r, j) => (j === i ? { ...r, value: v } : r)));
                            }}
                            placeholder="Value"
                            className="w-full rounded border border-gray-200 px-2 py-1.5"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            title="Remove row"
                            disabled={customFields.length <= 1}
                            onClick={() =>
                              setCustomFields((prev) =>
                                prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)
                              )
                            }
                            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setCustomFields((prev) => [...prev, { name: '', value: '' }])}
                className="mt-3 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Add custom field
              </button>
                </>
              ) : null}
            </section>
          </main>

          {sidebarOpen ? (
            <>
              <button
                type="button"
                aria-label="Close settings"
                className="fixed inset-0 z-30 bg-black/30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed bottom-0 right-0 top-14 z-40 flex w-full max-w-[320px] shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-xl md:static md:top-auto md:z-0 md:max-h-[min(100vh-3.5rem,100%)] md:shadow-none">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setSidebarTab('page')}
                  className={`flex-1 px-3 py-2.5 text-sm font-semibold ${sidebarTab === 'page' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Page
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('block')}
                  className={`flex-1 px-3 py-2.5 text-sm font-semibold ${sidebarTab === 'block' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Block
                </button>
              </div>

              {sidebarTab === 'page' ? (
                <div className="p-3 text-sm">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                    {featuredImage ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageDisplayUrl(featuredImage)}
                          alt=""
                          className="mx-auto max-h-28 rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFeaturedImage('')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => featuredFileInputRef.current?.click()}
                        disabled={uploadingFeatured || !token || !currentStore}
                        className="text-sm font-medium text-mint hover:underline disabled:opacity-50"
                      >
                        {uploadingFeatured ? 'Uploading…' : 'Set featured image'}
                      </button>
                    )}
                    <select
                      value=""
                      onChange={(e) => {
                        const u = e.target.value;
                        if (u) setFeaturedImage(u);
                      }}
                      className="mt-3 w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700"
                    >
                      <option value="">Library…</option>
                      {files.map((f) => (
                        <option key={f.id} value={f.url}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="Image URL"
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs"
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Last edited{' '}
                    {lastEditedAt
                      ? new Date(lastEditedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </p>

                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500">Status</div>
                      <select
                        value={pageStatus}
                        onChange={(e) => {
                          const v = e.target.value as CmsPageStatus;
                          setPageStatus(v);
                          if (v === 'scheduled' && !scheduleAt.trim()) {
                            setScheduleAt(defaultScheduleDatetimeLocal());
                          }
                        }}
                        className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {CMS_PAGE_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-gray-100 py-2 text-xs">
                      <span className="text-gray-500">Publish</span>
                      <span className="text-right text-gray-800">
                        {publishTimingLabel(pageStatus, scheduleAt, publishedAtSummary)}
                      </span>
                    </div>
                    {pageStatus === 'scheduled' ? (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Publish on</label>
                        <input
                          type="datetime-local"
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                        />
                        {scheduledIsPast ? (
                          <p className="mt-1 text-[11px] text-amber-700">Past time → API publishes immediately.</p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-2 border-b border-gray-100 py-2 text-xs">
                      <span className="text-gray-500">Slug</span>
                      <input
                        value={handle}
                        onChange={(e) => {
                          setHandleTouched(true);
                          setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        }}
                        className="max-w-[9rem] rounded border border-gray-200 px-1 py-0.5 font-mono text-[11px] text-gray-900"
                      />
                    </div>
                    <div className="flex justify-between gap-2 border-b border-gray-100 py-2 text-xs">
                      <span className="text-gray-500">Author</span>
                      <span className="truncate text-right text-gray-800">{authorDisplay}</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Template</div>
                      <select
                        value={layoutWidth}
                        onChange={(e) => setLayoutWidth(normalizeCmsPageLayoutWidth(e.target.value))}
                        className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {CMS_PAGE_LAYOUT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-gray-100 py-2 text-xs">
                      <span className="text-gray-500">Discussion</span>
                      <span className="text-gray-800">Closed</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Parent</div>
                      <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        <option value="">None</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Menu order</div>
                      <input
                        type="number"
                        min={0}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                        className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Excerpt</div>
                      <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={3}
                        placeholder="Optional summary…"
                        className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Permalink: <code className="rounded bg-gray-100 px-1">/pages/{handle || '…'}</code>
                    </p>
                    <button
                      type="button"
                      onClick={() => void save()}
                      disabled={saving}
                      className="w-full rounded bg-mint py-2 text-sm font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
                    >
                      {primarySaveLabel(pageStatus, saving)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 text-sm">
                  <p className="text-xs text-gray-500">
                    Formatting for the current text selection. Select text in the canvas, or use the floating toolbar.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => editorRef.current?.toggleBold()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold hover:bg-gray-50"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.toggleItalic()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs italic hover:bg-gray-50"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.toggleUnderline()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs underline hover:bg-gray-50"
                    >
                      U
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.setLink()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Link
                    </button>
                  </div>
                  <p className="text-xs font-medium text-gray-600">Insert</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertHeading(2)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertHeading(3)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertBulletList()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertOrderedList()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Ordered
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertBlockquote()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.insertHorizontalRule()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => editorRef.current?.triggerImageUpload()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Image
                    </button>
                  </div>
                </div>
              )}
              </aside>
            </>
          ) : null}
        </div>
      )}

      {listViewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
          role="presentation"
          onClick={() => setListViewOpen(false)}
        >
          <div
            className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 id="list-view-title" className="text-sm font-semibold text-gray-900">
                Document outline
              </h2>
              <button
                type="button"
                onClick={() => setListViewOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto p-2 text-sm">
              {(() => {
                const outlineItems = editorRef.current?.getHeadingOutline() ?? [];
                if (outlineItems.length === 0) {
                  return (
                    <li className="px-2 py-4 text-center text-gray-500">
                      No headings yet. Add an H2 or H3 from the + menu.
                    </li>
                  );
                }
                return outlineItems.map((h, idx) => (
                  <li key={`${h.pos}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => {
                        editorRef.current?.scrollToDocPos(h.pos);
                        setListViewOpen(false);
                      }}
                      className="w-full rounded px-2 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="text-xs text-gray-400">H{h.level}</span>{' '}
                      <span className="text-gray-900">{h.text || '(empty)'}</span>
                    </button>
                  </li>
                ));
              })()}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
