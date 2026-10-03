import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
