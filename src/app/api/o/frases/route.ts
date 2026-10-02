import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const crearFraseSchema = z.object({
  texto: z.string().min(1).max(500),
});

export async function GET(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  const db = getDb();
  const { data, error } = await db
    .from('frases')
    .select('id, orden, texto, created_at')
    .order('orden', { ascending: true });

  if (error) {
    return empty404Response();
  }

  return NextResponse.json(data || [], {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = crearFraseSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const db = getDb();

  // Obtener el orden máximo actual
  const { data: maxRows } = await db
    .from('frases')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1);

  const nextOrden = (maxRows?.[0]?.orden ?? 0) + 1;

  const { data, error } = await db
    .from('frases')
    .insert({
      texto: result.data.texto,
      orden: nextOrden,
    })
    .select('id, orden, texto, created_at')
    .single();

  if (error || !data) {
    return empty404Response();
  }

  return NextResponse.json(data, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
