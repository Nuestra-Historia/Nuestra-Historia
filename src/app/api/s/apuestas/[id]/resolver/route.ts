import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resolverSchema = z.object({
  ganador: z.enum(['a', 'b']),
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

  const result = resolverSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { ganador } = result.data;
  const db = getDb();

  const { data, error } = await db
    .from('apuestas')
    .update({
      estado: 'resuelta',
      ganador,
      pagada: false,
    })
    .eq('id', id)
    .eq('estado', 'pendiente')
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al resolver apuesta:', error);
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
