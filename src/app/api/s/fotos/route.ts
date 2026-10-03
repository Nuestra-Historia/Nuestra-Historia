import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff, empty404Response } from '@/lib/guards';
import { getDb } from '@/lib/db';
import {
  presignGet,
  headObject,
  primerosBytes,
  firmaValida,
  borrarObjetos,
  MAX_FULL_BYTES,
  MAX_THUMB_BYTES,
  MAX_POR_TIRA,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const guard = await requireStaff(req);
  if (guard instanceof Response) return guard;

  const db = getDb();
  const { data: fotos, error } = await db
    .from('fotos')
    .select('id, tipo, descripcion, fecha, orden, ancho, alto, r2_key_thumb, created_at')
    .order('tipo', { ascending: true })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al listar fotos:', error);
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const items = await Promise.all(
    (fotos || []).map(async (f) => {
      const thumbUrl = await presignGet(f.r2_key_thumb);
      return {
        id: f.id,
        tipo: f.tipo,
        descripcion: f.descripcion,
        fecha: f.fecha,
        orden: f.orden,
        ancho: f.ancho,
        alto: f.alto,
        thumbUrl,
      };
    })
  );

  return NextResponse.json(items, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

const registrarFotoSchema = z.object({
  id: z.string().uuid(),
  formato: z.enum(['webp', 'jpeg']),
  tipo: z.enum(['tira_a', 'tira_b', 'momento']),
  ancho: z.number().int().positive(),
  alto: z.number().int().positive(),
  descripcion: z.string().max(1000).optional().nullable(),
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

  const result = registrarFotoSchema.safeParse(body);
  if (!result.success) {
    return empty404Response();
  }

  const { id, formato, tipo, ancho, alto, descripcion, fecha } = result.data;
  const ext = formato === 'webp' ? 'webp' : 'jpg';
  const expectedContentType =
    formato === 'webp' ? 'image/webp' : 'image/jpeg';
  const keyFull = `fotos/${id}.${ext}`;
  const keyThumb = `fotos/${id}-t.${ext}`;

  // 1. Validar existencia y atributos en R2
  const [headFull, headThumb] = await Promise.all([
    headObject(keyFull),
    headObject(keyThumb),
  ]);

  if (!headFull || !headThumb) {
    await borrarObjetos([keyFull, keyThumb]);
    return NextResponse.json(
      { error: 'Los archivos no fueron encontrados en el almacenamiento' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (
    headFull.size <= 0 ||
    headFull.size > MAX_FULL_BYTES ||
    headThumb.size <= 0 ||
    headThumb.size > MAX_THUMB_BYTES
  ) {
    await borrarObjetos([keyFull, keyThumb]);
    return NextResponse.json(
      { error: 'El tamaño de los archivos excede los límites permitidos' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (
    headFull.contentType !== expectedContentType ||
    headThumb.contentType !== expectedContentType
  ) {
    await borrarObjetos([keyFull, keyThumb]);
    return NextResponse.json(
      { error: 'El tipo de contenido no coincide con el formato declarado' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // 2. Validar firma de bytes (magic bytes)
  try {
    const [bytesFull, bytesThumb] = await Promise.all([
      primerosBytes(keyFull, 12),
      primerosBytes(keyThumb, 12),
    ]);

    if (
      !firmaValida(bytesFull, formato) ||
      !firmaValida(bytesThumb, formato)
    ) {
      await borrarObjetos([keyFull, keyThumb]);
      return NextResponse.json(
        { error: 'Firma de imagen inválida' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }
  } catch (err) {
    console.error('Error al leer bytes de R2:', err);
    await borrarObjetos([keyFull, keyThumb]);
    return NextResponse.json(
      { error: 'No se pudo verificar la imagen subida' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const db = getDb();

  // 3. Si es tira_a o tira_b, validar límite por tira
  if (tipo === 'tira_a' || tipo === 'tira_b') {
    const { count, error: countError } = await db
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', tipo);

    if (countError) {
      console.error('Error al contar fotos de la tira:', countError);
      return new Response(null, {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    if ((count ?? 0) >= MAX_POR_TIRA) {
      await borrarObjetos([keyFull, keyThumb]);
      return NextResponse.json(
        { error: 'Límite de fotos por tira alcanzado' },
        { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }
  }

  // 4. Calcular orden = max(orden en ese tipo) + 1
  const { data: maxRow } = await db
    .from('fotos')
    .select('orden')
    .eq('tipo', tipo)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = (maxRow?.orden ?? 0) + 1;

  // 5. Insertar fila en base de datos
  const { error: insertError } = await db.from('fotos').insert({
    id,
    tipo,
    orden,
    descripcion: descripcion?.trim() || null,
    fecha: fecha || null,
    r2_key: keyFull,
    r2_key_thumb: keyThumb,
    bytes: headFull.size,
    ancho,
    alto,
  });

  if (insertError) {
    console.error('Error al insertar foto en DB:', insertError);
    await borrarObjetos([keyFull, keyThumb]);

    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'La foto ya se encuentra registrada' },
        { status: 409, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar la foto' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
