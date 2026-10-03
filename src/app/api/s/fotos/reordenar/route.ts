import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reordenarSchema = z.object({
  tipo: z.enum(['tira_a', 'tira_b', 'momento']),
  ids: z.array(z.string().uuid()),
});

export async function POST(req: Request) {
  const guard = await requireStaff(req);
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

  const { tipo, ids } = result.data;
  const db = getDb();

  if (ids.length > 0) {
    // Validar que todos los ids pertenecen a ese tipo
    const { data: filas, error: checkError } = await db
      .from('fotos')
      .select('id')
      .eq('tipo', tipo)
      .in('id', ids);

    if (checkError || !filas || filas.length !== ids.length) {
      return empty404Response();
    }
  }

  // Llamar al RPC reordenar_fotos
  const { error: rpcError } = await db.rpc('reordenar_fotos', { p_ids: ids });

  if (rpcError) {
    console.error('Error al reordenar fotos RPC:', rpcError);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
