import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const editarApuestaSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  apuesta_a: z.string().max(300).optional().nullable(),
  apuesta_b: z.string().max(300).optional().nullable(),
  premio: z.string().max(200).optional().nullable(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
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

  const result = editarApuestaSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const updates: Record<string, unknown> = {};
  if (result.data.titulo !== undefined) {
    updates.titulo = result.data.titulo.trim();
  }
  if (result.data.apuesta_a !== undefined) {
    updates.apuesta_a = result.data.apuesta_a?.trim() || null;
  }
  if (result.data.apuesta_b !== undefined) {
    updates.apuesta_b = result.data.apuesta_b?.trim() || null;
  }
  if (result.data.premio !== undefined) {
    updates.premio = result.data.premio?.trim() || null;
  }
  if (result.data.fecha !== undefined) {
    updates.fecha = result.data.fecha || null;
  }

  const db = getDb();
  const { data, error } = await db
    .from('apuestas')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al editar apuesta:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if (!data) {
    return empty404Response();
  }

  return NextResponse.json(data, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  const db = getDb();
  const { data, error } = await db
    .from('apuestas')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error al borrar apuesta:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if (!data) {
    return empty404Response();
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
