import { auth } from '@/auth';
import {
  getPlatformConfig,
  toPlatformConfigClientDTO,
  updatePlatformConfig,
  type PlatformConfig,
} from '@/lib/platformConfig';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isSuperAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cfg = await getPlatformConfig();
  return Response.json({ config: toPlatformConfigClientDTO(cfg) });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isSuperAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Expected object body' }, { status: 400 });
  }

  const patch = body as Partial<PlatformConfig>;
  const forbiddenKeys = ['version', 'updatedAt', 'updatedBy'] as const;
  for (const k of forbiddenKeys) {
    if (k in patch) delete (patch as Record<string, unknown>)[k];
  }

  const actorEmail = session.user.email?.trim() || session.user.name?.trim() || 'unknown';

  try {
    const cfg = await updatePlatformConfig(patch, { actorEmail });
    return Response.json({ config: toPlatformConfigClientDTO(cfg) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save';
    return Response.json({ error: msg }, { status: 500 });
  }
}
