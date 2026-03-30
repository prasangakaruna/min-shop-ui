'use client';

import { useParams } from 'next/navigation';
import PageEditorShell from '@/components/admin/PageEditorShell';

export default function AdminEditStorePage() {
  const params = useParams();
  const pageId = typeof params?.pageId === 'string' ? params.pageId : '';

  return <PageEditorShell mode="edit" pageId={pageId} />;
}
