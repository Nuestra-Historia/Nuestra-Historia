import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reordenarSchema = z.object({
  ids: z.array(z.string().uuid()),
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

  const result = reordenarSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { ids } = result.data;
  const db = getDb();

  // Llamar al RPC reordenar_frases
  const { error } = await db.rpc('reordenar_frases', { p_ids: ids });

  if (error) {
    // Si la función RPC aún no está creada en la DB, aplicar actualización de orden
    for (let i = 0; i < ids.length; i++) {
      await db.from('frases').update({ orden: i + 1 }).eq('id', ids[i]);
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
