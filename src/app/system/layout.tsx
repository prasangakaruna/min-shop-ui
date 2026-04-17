import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SystemShell } from '@/components/system/SystemShell';

export const metadata: Metadata = {
  title: 'Mint Admin Console',
  description: 'Platform operator console for system administrators.',
};

export default async function SystemLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!session.isSuperAdmin) {
    redirect('/');
  }
  const user = session.user;
  const userName = user.name?.trim() || user.email?.split('@')[0] || 'Admin';
  const userEmail = user.email ?? '';
  const userImage = user.image ?? null;
  return (
    <SystemShell userName={userName} userEmail={userEmail} userImage={userImage}>
      {children}
    </SystemShell>
  );
}
