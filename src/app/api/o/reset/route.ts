import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';
import { getEstado } from '@/lib/estado';
import { borrarObjetos } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetSchema = z.object({
  tipo: z.enum(['frases', 'fotos', 'apuestas']),
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

  // Todos los tipos responden 409 { error: 'bloqueado' } si estado === 'aceptado'
  const estado = await getEstado();
  if (estado === 'aceptado') {
    return NextResponse.json(
      { error: 'bloqueado' },
      { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const db = getDb();

  if (result.data.tipo === 'frases') {
    const { error } = await db
      .from('frases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error al resetear frases:', error);
      return new Response(null, {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
  } else if (result.data.tipo === 'apuestas') {
    const { error } = await db
      .from('apuestas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error al resetear apuestas:', error);
      return new Response(null, {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
  } else if (result.data.tipo === 'fotos') {
    // 1. Leer todas las keys
    const { data: fotos, error: readError } = await db
      .from('fotos')
      .select('r2_key, r2_key_thumb');

    if (readError) {
      console.error('Error al leer fotos para reset:', readError);
      return new Response(null, {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    // 2. Borrar las filas de la base de datos
    const { error: deleteError } = await db
      .from('fotos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error al borrar filas de fotos:', deleteError);
      return new Response(null, {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    // 3. Borrar objetos en lotes de R2
    if (fotos && fotos.length > 0) {
      const allKeys: string[] = [];
      for (const f of fotos) {
        if (f.r2_key) allKeys.push(f.r2_key);
        if (f.r2_key_thumb) allKeys.push(f.r2_key_thumb);
      }
      await borrarObjetos(allKeys);
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
