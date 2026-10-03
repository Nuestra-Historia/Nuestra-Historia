import { NextResponse } from 'next/server';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  const db = getDb();
  const { data, error } = await db
    .from('apuestas')
    .update({
      estado: 'pendiente',
      ganador: null,
      pagada: false,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al deshacer resolución de apuesta:', error);
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
