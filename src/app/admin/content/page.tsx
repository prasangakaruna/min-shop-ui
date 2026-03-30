'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
};

type ContentSettings = {
  blog_posts: BlogPost[];
};

const EMPTY_CONTENT: ContentSettings = {
  blog_posts: [],
};

function safeContent(value: unknown): ContentSettings {
  const raw = (value ?? {}) as Partial<ContentSettings & { files?: unknown }>;
  return {
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
      return;
    }
    if (sectionRaw === 'blog-posts') {
      return;
    }
    router.replace('/admin/content/metaobjects');
  }, [sectionRaw, router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContentSettings>(EMPTY_CONTENT);
  const [searchTerm, setSearchTerm] = useState('');

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

  const normalizedSearch = searchTerm.trim().toLowerCase();

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

  if (sectionRaw !== 'blog-posts') {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-50/60 p-6">
        <p className="text-sm text-gray-500">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage blog posts for your store.</p>
        </div>
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminSearchFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search blog posts..."
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

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Create blog post</h2>
          <div className="mt-4 space-y-3">
            <input
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={blogExcerpt}
              onChange={(e) => setBlogExcerpt(e.target.value)}
              placeholder="Short excerpt"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              rows={6}
              placeholder="Write your post content..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={blogStatus}
              onChange={(e) => setBlogStatus(e.target.value as 'draft' | 'published')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <button
            onClick={addBlogPost}
            className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark"
          >
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {p.status}
                      </span>
                      <button
                        onClick={() => void removeBlogPost(p.id)}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
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
      </main>
    </div>
  );
}
