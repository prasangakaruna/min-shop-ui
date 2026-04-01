'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { Me } from '@/lib/api';
import { storeSlugFromHost, customerPostAuthPath } from '@/lib/storeSlug';

const USER_TYPE_COOKIE = 'USER_TYPE_TO_REGISTER';
const USER_TYPE_PERSIST = 'USER_TYPE';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAge = 86400 * 365): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export default function AfterLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('Checking account...');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.access_token) {
      router.replace('/login');
      return;
    }

    const token = session.access_token as string;

    (async () => {
      try {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const onStoreSubdomain = Boolean(storeSlugFromHost(hostname));

        const typeToRegister = getCookie(USER_TYPE_COOKIE);
        if (typeToRegister === 'customer' || typeToRegister === 'store_admin' || typeToRegister === 'pro_admin') {
          try {
            await apiRequest<Me>('/me/sync', { method: 'POST', token, body: { user_type: typeToRegister } });
          } catch {
            // sync may fail if already set; continue with GET /me
          }
          clearCookie(USER_TYPE_COOKIE);
        }

        let me = await apiRequest<Me>('/me', { token });
        let userType = me.user_type;

        // Store URL sign-in: treat as a shopper — default to customer without the global "choose type" step.
        if (userType == null && onStoreSubdomain) {
          try {
            await apiRequest<Me>('/me/sync', { method: 'POST', token, body: { user_type: 'customer' } });
            me = await apiRequest<Me>('/me', { token });
            userType = me.user_type;
          } catch {
            // fall through to choose-type if sync fails
          }
        }

        // First time on marketplace apex: still pick role (customer vs seller vs pro).
        if (userType == null) {
          router.replace('/auth/choose-type');
          return;
        }

        setCookie(USER_TYPE_PERSIST, userType);
        if (userType === 'store_admin') {
          router.replace('/admin');
        } else if (userType === 'pro_admin') {
          router.replace('/admin/pro');
        } else {
          router.replace(customerPostAuthPath(hostname));
        }
      } catch (e) {
        setMessage('Could not load your account. Try signing in again.');
        setTimeout(() => router.replace('/login'), 2000);
      }
    })();
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-mint border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
