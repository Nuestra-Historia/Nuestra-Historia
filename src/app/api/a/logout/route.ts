import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && origin !== env.SITE_ORIGIN) {
    notFound();
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

