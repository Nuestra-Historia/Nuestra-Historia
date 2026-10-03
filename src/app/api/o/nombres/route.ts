import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const nombresSchema = z.object({
  nombre_a: z.string().trim().min(1).max(30),
  nombre_b: z.string().trim().min(1).max(30),
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

  const result = nombresSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { nombre_a, nombre_b } = result.data;
  const db = getDb();

  const { error } = await db
    .from('config')
    .update({
      nombre_a,
      nombre_b,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    console.error('Error al actualizar nombres:', error);
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
