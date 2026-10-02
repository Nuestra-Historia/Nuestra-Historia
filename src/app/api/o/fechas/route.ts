import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';
import { isDateInFuture } from '@/lib/fechas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const fechasSchema = z.object({
  fecha_hablar: z.string().nullable().optional(),
  fecha_pareja: z.string().nullable().optional(),
  fecha_aceptado: z.string().nullable().optional(),
});

export async function PUT(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = fechasSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { fecha_hablar, fecha_pareja, fecha_aceptado } = result.data;

  // Validar en el servidor que fecha_hablar y fecha_pareja no estén en el futuro
  if (fecha_hablar && isDateInFuture(fecha_hablar)) {
    return NextResponse.json(
      { error: 'La fecha para hablar no puede estar en el futuro' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (fecha_pareja && isDateInFuture(fecha_pareja)) {
    return NextResponse.json(
      { error: 'La fecha de pareja no puede estar en el futuro' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {
    updated_at: now,
  };

  if (fecha_hablar !== undefined) updates.fecha_hablar = fecha_hablar;
  if (fecha_pareja !== undefined) updates.fecha_pareja = fecha_pareja;
  if (fecha_aceptado !== undefined) updates.fecha_aceptado = fecha_aceptado;

  const { error } = await db
    .from('config')
    .update(updates)
    .eq('id', 1);

  if (error) {
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
