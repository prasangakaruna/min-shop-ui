import { handlers } from '@/auth';
import { rewriteAuthRequestUrlForProxy } from '@/lib/authProxyRequest';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return handlers.GET(rewriteAuthRequestUrlForProxy(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(rewriteAuthRequestUrlForProxy(req));
}
