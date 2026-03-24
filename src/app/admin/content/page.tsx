'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';

type ContentSection = 'metaobjects' | 'menus' | 'blog-posts';

type MetaobjectDefinition = {
  id: string;
  name: string;
  type: string;
  fields: string[];
  created_at: string;
};

type MenuItem = { id: string; label: string; url: string };
type ContentMenu = {
  id: string;
  name: string;
  handle: string;
  items: MenuItem[];
  created_at: string;
};

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
};

type ContentSettings = {
  metaobjects: MetaobjectDefinition[];
  menus: ContentMenu[];
  blog_posts: BlogPost[];
};

const EMPTY_CONTENT: ContentSettings = {
  metaobjects: [],
  menus: [],
  blog_posts: [],
};

function safeContent(value: unknown): ContentSettings {
  const raw = (value ?? {}) as Partial<ContentSettings & { files?: unknown }>;
  return {
    metaobjects: Array.isArray(raw.metaobjects) ? raw.metaobjects : [],
    menus: Array.isArray(raw.menus) ? raw.menus : [],
    blog_posts: Array.isArray(raw.blog_posts) ? raw.blog_posts : [],
  };
}

type ContentResponse = { data: ContentSettings };

export default function AdminContentPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sectionRaw = searchParams.get('section');
  useEffect(() => {
    if (sectionRaw === 'files') {
      router.replace('/admin/content/files');
      return;
    }
    if (sectionRaw === 'menus') {
      router.replace('/admin/content/menus');
    }
  }, [sectionRaw, router]);

  const section = (sectionRaw as ContentSection | null) ?? 'metaobjects';
  const activeSection: ContentSection =
    section === 'menus' || section === 'blog-posts' ? section : 'metaobjects';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContentSettings>(EMPTY_CONTENT);
  const [searchTerm, setSearchTerm] = useState('');

  const [metaName, setMetaName] = useState('');
  const [metaType, setMetaType] = useState('');
  const [metaFields, setMetaFields] = useState('');

  const [menuName, setMenuName] = useState('');
  const [menuHandle, setMenuHandle] = useState('');
  const [menuItemsRaw, setMenuItemsRaw] = useState('');

  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');

  const loadContent = async () => {
    if (!token || !currentStore) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    setContent(safeContent(res.data));
  };

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadContent()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load content settings'))
      .finally(() => setLoading(false));
  }, [token, currentStore]);

  const hasStore = !storesLoading && !!currentStore;

  const addMetaobject = async () => {
    const name = metaName.trim();
    const type = metaType.trim();
    if (!name || !type) return;
    const fields = metaFields.split(',').map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/store/content/metaobjects', {
        method: 'POST',
        token,
        storeId: currentStore?.id,
        body: { name, type, fields },
      });
      await loadContent();
      setMetaName('');
      setMetaType('');
      setMetaFields('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add definition');
    } finally {
      setSaving(false);
    }
  };

  const addMenu = async () => {
    const name = menuName.trim();
    const handle = menuHandle.trim();
    if (!name || !handle) return;
    const items = menuItemsRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split('|').map((s) => s.trim());
        return {
          id: crypto.randomUUID(),
          label: label || 'Untitled',
          url: url || '/',
        };
      });
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/store/content/menus', {
        method: 'POST',
        token,
        storeId: currentStore?.id,
        body: { name, handle, items: items.map((item) => ({ label: item.label, url: item.url })) },
      });
      await loadContent();
      setMenuName('');
      setMenuHandle('');
      setMenuItemsRaw('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const addBlogPost = async () => {
    const title = blogTitle.trim();
    const body = blogContent.trim();
    if (!title || !body) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/store/content/blog-posts', {
        method: 'POST',
        token,
        storeId: currentStore?.id,
        body: {
          title,
          excerpt: blogExcerpt.trim(),
          content: body,
          status: blogStatus,
        },
      });
      await loadContent();
      setBlogTitle('');
      setBlogExcerpt('');
      setBlogContent('');
      setBlogStatus('draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const removeMetaobject = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/metaobjects/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete definition');
    } finally {
      setSaving(false);
    }
  };

  const removeMenu = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/menus/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete menu');
    } finally {
      setSaving(false);
    }
  };

  const removeBlogPost = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/store/content/blog-posts/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore?.id,
      });
      await loadContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = useMemo(() => {
    if (activeSection === 'menus') return 'Menus';
    if (activeSection === 'blog-posts') return 'Blog posts';
    return 'Metaobjects';
  }, [activeSection]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredMetaobjects = useMemo(() => {
    if (!normalizedSearch) return content.metaobjects;
    return content.metaobjects.filter((m) => {
      const fieldsText = Array.isArray(m.fields) ? m.fields.join(' ') : '';
      return `${m.name} ${m.type} ${fieldsText}`.toLowerCase().includes(normalizedSearch);
    });
  }, [content.metaobjects, normalizedSearch]);

  const filteredMenus = useMemo(() => {
    if (!normalizedSearch) return content.menus;
    return content.menus.filter((m) => {
      const itemsText = (m.items ?? []).map((i) => `${i.label} ${i.url}`).join(' ');
      return `${m.name} ${m.handle} ${itemsText}`.toLowerCase().includes(normalizedSearch);
    });
  }, [content.menus, normalizedSearch]);

  const filteredBlogPosts = useMemo(() => {
    if (!normalizedSearch) return content.blog_posts;
    return content.blog_posts.filter((p) =>
      `${p.title} ${p.excerpt} ${p.content} ${p.status}`.toLowerCase().includes(normalizedSearch)
    );
  }, [content.blog_posts, normalizedSearch]);

  if (!hasStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to manage content.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage {pageTitle.toLowerCase()} for your store.</p>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminSearchFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={`Search ${pageTitle.toLowerCase()}...`}
          />
          <p className="mt-2 text-xs text-gray-500">Live search is enabled. Results update as you type.</p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {(saving || loading) && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {loading ? 'Loading content...' : 'Saving changes...'}
          </div>
        )}

        {activeSection === 'metaobjects' && (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Add definition</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input value={metaName} onChange={(e) => setMetaName(e.target.value)} placeholder="Name (e.g. Brand profile)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input value={metaType} onChange={(e) => setMetaType(e.target.value)} placeholder="Type (e.g. brand.profile)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input value={metaFields} onChange={(e) => setMetaFields(e.target.value)} placeholder="Fields (comma separated)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <button onClick={addMetaobject} className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark">
                Add definition
              </button>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Definitions</h2>
              <div className="mt-4 space-y-3">
                {filteredMetaobjects.length === 0 ? (
                  <p className="text-sm text-gray-500">No definitions yet.</p>
                ) : (
                  filteredMetaobjects.map((m) => (
                    <div key={m.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.type}</p>
                        </div>
                        <button onClick={() => void removeMetaobject(m.id)} className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                          Delete
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{m.fields.join(', ') || 'No fields'}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === 'menus' && (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Create menu</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Menu name (e.g. Main menu)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input value={menuHandle} onChange={(e) => setMenuHandle(e.target.value)} placeholder="Handle (e.g. main-menu)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <textarea
                value={menuItemsRaw}
                onChange={(e) => setMenuItemsRaw(e.target.value)}
                rows={5}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder={'Menu items, one per line: Label|/url\nExample: Home|/\nCatalog|/products'}
              />
              <button onClick={addMenu} className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark">
                Save menu
              </button>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Saved menus</h2>
              <div className="mt-4 space-y-3">
                {filteredMenus.length === 0 ? (
                  <p className="text-sm text-gray-500">No menus yet.</p>
                ) : (
                  filteredMenus.map((m) => (
                    <div key={m.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.handle}</p>
                        </div>
                        <button onClick={() => void removeMenu(m.id)} className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                          Delete
                        </button>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        {m.items.map((item) => (
                          <li key={item.id}>{item.label} - {item.url}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === 'blog-posts' && (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Create blog post</h2>
              <div className="mt-4 space-y-3">
                <input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="Post title" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} placeholder="Short excerpt" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <textarea value={blogContent} onChange={(e) => setBlogContent(e.target.value)} rows={6} placeholder="Write your post content..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <select value={blogStatus} onChange={(e) => setBlogStatus(e.target.value as 'draft' | 'published')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <button onClick={addBlogPost} className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark">
                Save post
              </button>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Posts</h2>
              <div className="mt-4 space-y-3">
                {filteredBlogPosts.length === 0 ? (
                  <p className="text-sm text-gray-500">No posts yet.</p>
                ) : (
                  filteredBlogPosts.map((p) => (
                    <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">{p.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {p.status}
                          </span>
                          <button onClick={() => void removeBlogPost(p.id)} className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{p.excerpt || 'No excerpt'}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

