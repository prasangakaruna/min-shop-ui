'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Redirecting to sign in...</p>
    </div>
  );
}
