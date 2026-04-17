'use client';

import { useSession } from 'next-auth/react';
import { BlogPostsManager } from '@/components/admin/BlogPostsManager';

export default function AdminContentBlogPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  return <BlogPostsManager token={token} />;
}
