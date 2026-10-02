import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const editarFraseSchema = z.object({
  texto: z.string().min(1).max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = editarFraseSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const db = getDb();
  const { error } = await db
    .from('frases')
    .update({ texto: result.data.texto })
    .eq('id', id);

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

export async function DELETE(req: Request, { params }: RouteParams) {
  const guard = await requireOwner(req);
  if (guard instanceof Response) return guard;

  const { id } = await params;
  if (!id) return empty404Response();

  const db = getDb();
  const { error } = await db
    .from('frases')
    .delete()
    .eq('id', id);

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
