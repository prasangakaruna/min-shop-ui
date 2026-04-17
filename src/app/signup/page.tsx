import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apexRegistrationBlock } from '@/lib/platformConfig';
import { publicHostnameForStorefrontSlug, storeSlugFromHost } from '@/lib/storeSlug';
import SignUpClient from './SignUpClient';

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  const h = await headers();
  const host = publicHostnameForStorefrontSlug(h.get('host'), h.get('x-forwarded-host'));
  const tenantSlug = host ? storeSlugFromHost(host) : null;
  const reg = await apexRegistrationBlock();

  if (reg.block && !tenantSlug) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center sm:py-24">
          <Link href="/" className="mb-8 inline-flex items-center justify-center gap-2">
            <Image src="/logo.webp" alt="Mint Hub" width={48} height={48} className="object-contain" priority />
            <span className="text-xl font-bold text-gray-800">Mint</span>
          </Link>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-8 text-left shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Registration paused</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">{reg.message}</p>
            <p className="mt-6 text-sm text-gray-600">
              Storefronts on their own hosts can still onboard customers. This pause applies to the shared marketplace signup
              only.
            </p>
            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-mint-dark hover:underline">
                Sign in
              </Link>
              {' · '}
              <Link href="/" className="font-medium text-mint-dark hover:underline">
                Home
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <SignUpClient />;
}
