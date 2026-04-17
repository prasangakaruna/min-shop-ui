'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContentRoutes } from '@/context/ContentRoutesContext';

/**
 * Legacy hub: redirects to the right Content area. Blog lives at `/admin/content/blog`.
 */
export default function AdminContentRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routes = useContentRoutes();

  useEffect(() => {
    const sectionRaw = searchParams.get('section');
    if (sectionRaw === 'files') {
      router.replace(routes.files);
      return;
    }
    if (sectionRaw === 'menus') {
      router.replace(routes.menus);
      return;
    }
    if (sectionRaw === 'blog-posts') {
      router.replace(routes.blogPosts);
      return;
    }
    router.replace(routes.metaobjects);
  }, [router, searchParams, routes]);

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50/60 p-6">
      <p className="text-sm text-gray-500">Redirecting…</p>
    </div>
  );
}
