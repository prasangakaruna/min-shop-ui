'use client';

import { SessionProvider, __NEXTAUTH } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * next-auth/react defaults __NEXTAUTH.baseUrl to http://localhost:3000 when NEXTAUTH_URL is unset.
 * Run during render (not useLayoutEffect) so the first sign-in click cannot fire before sync.
 */
function NextAuthOriginSync() {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    __NEXTAUTH.baseUrl = origin;
    __NEXTAUTH.baseUrlServer = origin;
  }
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <NextAuthOriginSync />
      {children}
    </SessionProvider>
  );
}
