import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { getConfig, getBloqueo, registrarFallo, limpiarIntentos } from '@/lib/db';
import { firmarSesion, getCookieOptions } from '@/lib/session';
import { getClientIp, hashIp, comparePassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const loginSchema = z.object({
  scope: z.enum(['o', 's']),
  password: z.string().max(200),
});

export async function POST(req: Request) {
  // 1. Verificar header Origin contra SITE_ORIGIN
  const origin = req.headers.get('origin');
  if (origin !== env.SITE_ORIGIN) {
    notFound();
  }

  // 2. Validar body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    notFound();
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    notFound();
  }

  const { scope, password } = parseResult.data;

  // 3. Obtener configuración de la DB
  let config;
  try {
    config = await getConfig();
  } catch {
    notFound();
  }

  // 4. Si scope = 's' y config.estado != 'aceptado': 404 genérico antes de todo
  if (scope === 's' && config.estado !== 'aceptado') {
    notFound();
  }

  // 5. Calcular ipHash
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  // 6. Verificar si la IP está bloqueada
  const { bloqueado } = await getBloqueo(ipHash);
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intente más tarde.' },
      {
        status: 429,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }

  // 7. Comparar contraseña con bcrypt en tiempo constante
  const expectedHashB64 = scope === 'o' ? env.OWNER_PASSWORD_HASH_B64 : env.SHARED_PASSWORD_HASH_B64;
  const isValid = await comparePassword(password, expectedHashB64);

  // 8. Manejar resultado
  if (!isValid) {
    await registrarFallo(ipHash);
    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }

  // Éxito: limpiar intentos y generar sesión
  await limpiarIntentos(ipHash);
  const rol = scope === 'o' ? 'owner' : 'shared';
  const token = await firmarSesion({ rol, sv: config.session_version });

  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );

  const cookieOpts = getCookieOptions();
  response.cookies.set({
    name: cookieOpts.name,
    value: token,
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });

  return response;
}

