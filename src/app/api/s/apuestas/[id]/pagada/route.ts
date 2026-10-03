import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const pagadaSchema = z.object({
  pagada: z.boolean(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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

  const result = pagadaSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { pagada } = result.data;
  const db = getDb();

  const { data, error } = await db
    .from('apuestas')
    .update({ pagada })
    .eq('id', id)
    .eq('estado', 'resuelta')
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al actualizar estado pagada de apuesta:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'conflicto' },
      { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  return NextResponse.json(data, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
