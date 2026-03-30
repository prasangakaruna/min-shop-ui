'use client';

import { SessionProvider, __NEXTAUTH } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

/**
 * next-auth/react defaults __NEXTAUTH.baseUrl to http://localhost:3000 when NEXTAUTH_URL is unset.
 * Production omits NEXTAUTH_URL so apex Keycloak + store subdomains work; without this sync, the
 * client can still treat the site as localhost and send users there after sign-in.
 */
function NextAuthOriginSync() {
  useLayoutEffect(() => {
    const origin = window.location.origin;
    if (origin) {
      __NEXTAUTH.baseUrl = origin;
      __NEXTAUTH.baseUrlServer = origin;
    }
  }, []);
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
