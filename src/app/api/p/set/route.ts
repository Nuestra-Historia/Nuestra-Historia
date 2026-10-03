import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getEstado, cambiarEstado } from '@/lib/estado';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const setSchema = z.object({
  a: z.union([z.literal(1), z.literal(2)]),
});

export async function POST(req: Request) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  // Solo permitido si el estado actual es 'preguntando'; si no, 404 con cuerpo vacío
  try {
    const estadoActual = await getEstado();
    if (estadoActual !== 'preguntando') {
      return empty404Response();
    }
  } catch {
    return empty404Response();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = setSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { a } = result.data;
  const nuevoEstado = a === 1 ? 'aceptado' : 'apagado';

  try {
    await cambiarEstado(nuevoEstado);
  } catch (err) {
    console.error('Error al cambiar estado en /api/p/set:', err);
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
