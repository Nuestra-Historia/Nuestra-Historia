import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { cambiarEstado } from '@/lib/estado';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const estadoSchema = z.object({
  estado: z.enum(['preguntando', 'aceptado', 'apagado']),
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

  const result = estadoSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  try {
    await cambiarEstado(result.data.estado);
    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch {
    return empty404Response();
  }
}
