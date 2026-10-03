import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';
import { borrarObjetos, MAX_POR_TIRA } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const editarFotoSchema = z.object({
  descripcion: z.string().max(1000).optional().nullable(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  tipo: z.enum(['tira_a', 'tira_b', 'momento']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = editarFotoSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const db = getDb();

  // Obtener foto existente
  const { data: fotoActual, error: fetchError } = await db
    .from('fotos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !fotoActual) {
    return empty404Response();
  }

  const updates: Record<string, unknown> = {};

  if (result.data.descripcion !== undefined) {
    updates.descripcion = result.data.descripcion?.trim() || null;
  }

  if (result.data.fecha !== undefined) {
    updates.fecha = result.data.fecha || null;
  }

  // Si cambia de tipo
  if (result.data.tipo && result.data.tipo !== fotoActual.tipo) {
    const nuevoTipo = result.data.tipo;

    if (nuevoTipo === 'tira_a' || nuevoTipo === 'tira_b') {
      const { count } = await db
        .from('fotos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo', nuevoTipo);

      if ((count ?? 0) >= MAX_POR_TIRA) {
        return NextResponse.json(
          { error: 'Límite de fotos por tira alcanzado' },
          { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
    }

    // Orden = max(orden en ese nuevo tipo) + 1
    const { data: maxRow } = await db
      .from('fotos')
      .select('orden')
      .eq('tipo', nuevoTipo)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    updates.tipo = nuevoTipo;
    updates.orden = (maxRow?.orden ?? 0) + 1;
  }

  const { error: updateError } = await db
    .from('fotos')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    console.error('Error al actualizar foto:', updateError);
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

export async function DELETE(req: Request, { params }: RouteParams) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  const db = getDb();

  // Borrar fila primero
  const { data: deleted, error: deleteError } = await db
    .from('fotos')
    .delete()
    .eq('id', id)
    .select('r2_key, r2_key_thumb')
    .maybeSingle();

  if (deleteError || !deleted) {
    return empty404Response();
  }

  // Borrar objetos de R2
  await borrarObjetos([deleted.r2_key, deleted.r2_key_thumb]);

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
