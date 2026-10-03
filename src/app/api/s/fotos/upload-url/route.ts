import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';
import {
  presignPut,
  MAX_FULL_BYTES,
  MAX_THUMB_BYTES,
  MAX_FOTOS_TOTAL,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const uploadUrlSchema = z.object({
  formato: z.enum(['webp', 'jpeg']),
  fullBytes: z.number().int().min(1).max(MAX_FULL_BYTES),
  thumbBytes: z.number().int().min(1).max(MAX_THUMB_BYTES),
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

  const result = uploadUrlSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Parámetros de subida inválidos' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const { formato, fullBytes, thumbBytes } = result.data;
  const db = getDb();

  // Validar límite total de fotos
  const { count, error } = await db
    .from('fotos')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error al contar fotos totales:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if ((count ?? 0) >= MAX_FOTOS_TOTAL) {
    return NextResponse.json(
      { error: 'Límite total de fotos alcanzado' },
      { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const id = crypto.randomUUID();
  const ext = formato === 'webp' ? 'webp' : 'jpg';
  const contentType = formato === 'webp' ? 'image/webp' : 'image/jpeg';
  const keyFull = `fotos/${id}.${ext}`;
  const keyThumb = `fotos/${id}-t.${ext}`;

  try {
    const [urlFull, urlThumb] = await Promise.all([
      presignPut({
        key: keyFull,
        contentType,
        contentLength: fullBytes,
      }),
      presignPut({
        key: keyThumb,
        contentType,
        contentLength: thumbBytes,
      }),
    ]);

    return NextResponse.json(
      {
        id,
        full: { url: urlFull, contentType },
        thumb: { url: urlThumb, contentType },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (err) {
    console.error('Error al generar URLs prefirmadas de subida:', err);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
