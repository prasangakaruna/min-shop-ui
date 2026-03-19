'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPlanPage() {
  const router = useRouter();

  useEffect(() => {
    // Keep the plan editor as an embedded section within /admin/settings.
    router.replace('/admin/settings?section=plan');
  }, [router]);

  return null;
}

