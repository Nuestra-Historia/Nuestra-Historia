import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetSchema = z.object({
  tipo: z.enum(['frases']),
});

export async function POST(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = resetSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const db = getDb();
  if (result.data.tipo === 'frases') {
    const { error } = await db
      .from('frases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      return empty404Response();
    }
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
