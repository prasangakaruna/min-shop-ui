import { auth } from '@/auth';
import { getSystemStatusSnapshot } from '@/lib/systemStatus';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isSuperAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = await getSystemStatusSnapshot();
  return Response.json(snapshot);
}
