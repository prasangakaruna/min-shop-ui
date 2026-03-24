'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import {
  apiRequest,
  getImageDisplayUrl,
  uploadContentLibraryFile,
} from '@/lib/api';
import AdminSearchFilters from '@/components/shared/AdminSearchFilters';

type ContentFile = {
  id: string;
  name: string;
  url: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

type ContentResponse = {
  data: {
    files: ContentFile[];
  };
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function isImageMime(m: string | null | undefined): boolean {
  if (!m) return false;
  return m.startsWith('image/');
}

function FilesHeroIllustration() {
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-6 text-gray-300">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    </div>
  );
}

export default function AdminContentFilesPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore, loading: storesLoading } = useStore();

  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    if (!token || !currentStore) return;
    const res = await apiRequest<ContentResponse>('/store/content', { token, storeId: currentStore.id });
    setFiles(Array.isArray(res.data?.files) ? res.data.files : []);
  }, [token, currentStore]);

  useEffect(() => {
    if (!token || !currentStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadFiles()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load files'))
      .finally(() => setLoading(false));
  }, [token, currentStore, loadFiles]);

  const triggerFileDialog = () => fileInputRef.current?.click();

  const handleFilesSelected = async (list: FileList | null) => {
    if (!list?.length || !token || !currentStore) return;
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        await uploadContentLibraryFile(file, { token, storeId: currentStore.id });
      }
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = async (id: string) => {
    if (!token || !currentStore) return;
    setError(null);
    try {
      await apiRequest(`/store/content/files/${id}`, {
        method: 'DELETE',
        token,
        storeId: currentStore.id,
      });
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete file');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredFiles = useMemo(() => {
    if (!normalizedSearch) return files;
    return files.filter((f) =>
      `${f.name} ${f.mime_type ?? ''} ${f.url}`.toLowerCase().includes(normalizedSearch)
    );
  }, [files, normalizedSearch]);

  const hasFiles = files.length > 0;

  if (!storesLoading && !currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a store from the header to manage files.
        </div>
      </div>
    );
  }

  const uploadButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-60';

  return (
    <div className="min-h-full bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Files</h1>
              <p className="text-sm text-gray-500">Upload and manage images, videos, documents, and more.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              disabled={uploading || !token || !currentStore}
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />
            <button type="button" className={uploadButtonClass} onClick={triggerFileDialog} disabled={uploading || !currentStore}>
              {uploading ? 'Uploading…' : 'Upload files'}
              <svg className="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent" />
          </div>
        ) : !hasFiles ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
            <FilesHeroIllustration />
            <h2 className="mt-10 text-xl font-semibold text-gray-900">Upload and manage your files</h2>
            <p className="mt-2 text-sm text-gray-600">Files can be images, videos, documents, and more.</p>
            <button
              type="button"
              onClick={triggerFileDialog}
              disabled={uploading || !currentStore}
              className={`${uploadButtonClass} mt-8`}
            >
              {uploading ? 'Uploading…' : 'Upload files'}
            </button>
            <p className="mt-10 text-sm">
              <Link href="/admin/content" className="text-mint hover:underline">
                Learn more about files
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <AdminSearchFilters
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search files by name or type..."
              />
              <p className="mt-2 text-xs text-gray-500">Results update as you type.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Preview
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Added
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          No files match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">
                            {isImageMime(f.mime_type) ? (
                              <img
                                src={getImageDisplayUrl(f.url)}
                                alt=""
                                className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900" title={f.name}>
                            {f.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{f.mime_type ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600 tabular-nums">{formatBytes(f.size)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(f.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={getImageDisplayUrl(f.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="mr-3 text-mint hover:underline"
                            >
                              Open
                            </a>
                            <button
                              type="button"
                              onClick={() => void removeFile(f.id)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={triggerFileDialog} disabled={uploading} className={uploadButtonClass}>
                {uploading ? 'Uploading…' : 'Upload more files'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
