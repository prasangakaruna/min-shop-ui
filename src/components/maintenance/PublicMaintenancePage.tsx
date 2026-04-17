import Image from 'next/image';
import Link from 'next/link';
import type { PublicMaintenancePayload } from '@/lib/platformConfigShared';

export function PublicMaintenancePage({ payload }: { payload: PublicMaintenancePayload }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-4 py-6">
          <Image src="/logo.webp" alt="Mint" width={40} height={40} className="object-contain opacity-90" priority />
          <span className="text-lg font-bold tracking-tight text-slate-800">Mint</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:py-24">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200/80">
          <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{payload.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{payload.message}</p>
        {(payload.eta || payload.windowEnd) && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When to check back</p>
            {payload.eta ? <p className="mt-1 text-sm text-slate-800">{payload.eta}</p> : null}
            {payload.windowEnd ? (
              <p className="mt-1 font-mono text-xs text-slate-600">{payload.windowEnd}</p>
            ) : null}
          </div>
        )}
        {payload.contactEmail ? (
          <p className="mt-8 text-sm text-slate-600">
            Need help?{' '}
            <a href={`mailto:${payload.contactEmail}`} className="font-medium text-mint-dark underline decoration-mint/40 underline-offset-2 hover:decoration-mint">
              {payload.contactEmail}
            </a>
          </p>
        ) : null}
        <p className="mt-10 text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-mint-dark hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
