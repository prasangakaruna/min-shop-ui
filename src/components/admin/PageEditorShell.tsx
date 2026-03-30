'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, getImageDisplayUrl, uploadContentLibraryFile } from '@/lib/api';
import { slugifyPageHandle, type StoreContentPage } from '@/lib/storePages';
import PageRichTextEditor from '@/components/admin/PageRichTextEditor';

type ContentFile = { id: string; name: string; url: string };

type ContentResponse = {
  data: {
    pages: StoreContentPage[];
    files?: ContentFile[];
  };
};

function parentOptions(pages: StoreContentPage[], currentId: string | null): { id: string; title: string }[] {
  return pages
    .filter((p) => p.id !== currentId)
    .map((p) => ({ id: p.id, title: p.title }));
}

export default function PageEditorShell({ mode, pageId }: { mode: 'create' | 'edit'; pageId?: string }) {
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
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const featuredFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

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
        setPublished(p.published);
        setSortOrder(typeof p.sort_order === 'number' ? p.sort_order : 0);
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

  const storeSlug = currentStore?.slug?.trim() ?? '';
  const storefrontPreviewPath = handle ? `/pages/${handle}${storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : ''}` : '';

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
    if (!token || !currentStore) return;
    if (mode === 'edit' && !pageId) {
      setError('Missing page id.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: t,
        handle: h,
        body: body.trim() === '' || body === '<p></p>' ? null : body,
        excerpt: excerpt.trim() || null,
        featured_image: featuredImage.trim() || null,
        parent_id: parentId ? parseInt(parentId, 10) : null,
        published,
        sort_order: sortOrder,
      };
      if (mode === 'create') {
        const res = await apiRequest<{ data: StoreContentPage }>('/store/pages', {
          method: 'POST',
          token,
          storeId: currentStore.id,
          body: payload,
        });
        router.replace(`/admin/content/pages/${res.data.id}`);
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
      setPublished(d.published);
      setSortOrder(typeof d.sort_order === 'number' ? d.sort_order : 0);
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
        <Link href="/admin/content/pages" className="text-sm text-mint hover:underline">
          ← Pages
        </Link>
        <p className="mt-4 text-sm text-gray-600">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f0f0f1]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/content/pages" className="text-sm text-gray-600 hover:text-mint">
              ← All pages
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{mode === 'create' ? 'Add new page' : 'Edit page'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'edit' && pageId ? (
              <Link
                href={`/admin/content/pages/${pageId}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Preview
              </Link>
            ) : null}
            {storefrontPreviewPath && published ? (
              <a
                href={storefrontPreviewPath}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                View live
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loading}
              className="rounded bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : published ? 'Publish' : 'Save draft'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}
        {loading ? (
          <p className="text-sm text-gray-500">Loading editor…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <label className="sr-only" htmlFor="page-title">
                  Title
                </label>
                <input
                  id="page-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add title"
                  className="w-full border-0 border-b-2 border-transparent pb-2 text-2xl font-semibold text-gray-900 placeholder:text-gray-400 focus:border-mint focus:outline-none focus:ring-0"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-600">Permalink:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                    /pages/{handle || '…'}
                  </code>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-medium text-gray-500">URL slug</label>
                  <input
                    value={handle}
                    onChange={(e) => {
                      setHandleTouched(true);
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    className="mt-1 w-full max-w-md rounded border border-gray-200 px-2 py-1.5 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Content</p>
                <PageRichTextEditor
                  key={editorKey}
                  initialHtml={body}
                  onChange={setBody}
                  uploadImageFile={uploadImageToLibrary}
                  onUseAsPageHero={(url) => setFeaturedImage(url)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">Publish</div>
                <div className="space-y-3 p-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={published ? 'published' : 'draft'}
                      onChange={(e) => setPublished(e.target.value === 'published')}
                      className="mt-1 w-full rounded border border-gray-200 px-2 py-2 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Draft pages are hidden on the store. Use <strong>Preview</strong> (when editing) to review before publishing.
                  </p>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="w-full rounded bg-mint py-2 text-sm font-semibold text-white hover:bg-mint-dark disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : published ? 'Update' : 'Save draft'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">Page attributes</div>
                <div className="space-y-3 p-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Parent page</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-200 px-2 py-2 text-sm"
                    >
                      <option value="">(no parent)</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Optional hierarchy (like WordPress). URLs stay /pages/your-slug.</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Order</label>
                    <input
                      type="number"
                      min={0}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                      className="mt-1 w-full rounded border border-gray-200 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">Featured image</div>
                <div className="p-3">
                  <input
                    ref={featuredFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(ev) => void onFeaturedFileSelected(ev)}
                  />
                  <button
                    type="button"
                    onClick={() => featuredFileInputRef.current?.click()}
                    disabled={uploadingFeatured || !token || !currentStore}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingFeatured ? 'Uploading…' : 'Upload image'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    Files go through the same pipeline as <strong>Content → Files</strong> (S3 when your API is configured with an S3 disk).
                  </p>
                  <select
                    value=""
                    onChange={(e) => {
                      const u = e.target.value;
                      if (u) setFeaturedImage(u);
                    }}
                    className="mt-3 w-full rounded border border-gray-200 px-2 py-2 text-sm"
                  >
                    <option value="">Or choose from library…</option>
                    {files.map((f) => (
                      <option key={f.id} value={f.url}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="Or paste image URL"
                    className="mt-2 w-full rounded border border-gray-200 px-2 py-2 text-sm"
                  />
                  {featuredImage ? (
                    <div className="mt-2 flex flex-wrap items-start gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary library URL */}
                      <img
                        src={getImageDisplayUrl(featuredImage)}
                        alt=""
                        className="max-h-32 rounded border border-gray-100 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage('')}
                        className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">Excerpt</div>
                <div className="p-3">
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={4}
                    placeholder="Optional short summary (plain text). Can show in search results or theme cards."
                    className="w-full rounded border border-gray-200 px-2 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
