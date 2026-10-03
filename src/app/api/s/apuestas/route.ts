import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const db = getDb();
  const { data, error } = await db
    .from('apuestas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al listar apuestas:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return NextResponse.json(data || [], {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

const crearApuestaSchema = z.object({
  titulo: z.string().min(1).max(200),
  apuesta_a: z.string().max(300).optional().nullable(),
  apuesta_b: z.string().max(300).optional().nullable(),
  premio: z.string().max(200).optional().nullable(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return empty404Response();
  }

  const result = crearApuestaSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { titulo, apuesta_a, apuesta_b, premio, fecha } = result.data;
  const db = getDb();

  const { data, error } = await db
    .from('apuestas')
    .insert({
      titulo: titulo.trim(),
      apuesta_a: apuesta_a?.trim() || null,
      apuesta_b: apuesta_b?.trim() || null,
      premio: premio?.trim() || null,
      fecha: fecha || null,
      estado: 'pendiente',
      ganador: null,
      pagada: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error al crear apuesta:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return NextResponse.json(data, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
