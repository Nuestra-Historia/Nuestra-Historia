import { NextResponse } from 'next/server';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb, getConfig } from '@/lib/db';
import { COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  const db = getDb();
  const config = await getConfig();

  const newVersion = config.session_version + 1;
  const { error } = await db
    .from('config')
    .update({
      session_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    return empty404Response();
  }

  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );

  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
