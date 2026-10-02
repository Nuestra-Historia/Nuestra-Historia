import crypto from 'node:crypto';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!authHeader || !timingSafeEqualStr(authHeader, expected)) {
    notFound();
  }

  const supabase = getDb();
  const { error } = await supabase.from('config').select('id').limit(1);

  if (error) {
    throw new Error(`Keepalive query failed: ${error.message}`);
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}

