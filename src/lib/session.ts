import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { env } from './env';
import { getConfig } from './db';

export const COOKIE_NAME = 'sid';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 días

export type UserRole = 'owner' | 'shared';

export interface SessionPayload {
  rol: UserRole;
  sv: number;
}

export interface SessionResult {
  rol: UserRole;
  exp: number;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function firmarSesion({ rol, sv }: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ rol, sv })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function leerSesion(
  source?: NextRequest | Request | string | null
): Promise<SessionResult | null> {
  try {
    let token: string | undefined;

    if (typeof source === 'string') {
      token = source;
    } else if (source && 'cookies' in source && typeof (source as NextRequest).cookies?.get === 'function') {
      token = (source as NextRequest).cookies.get(COOKIE_NAME)?.value;
    } else if (source && 'headers' in source && typeof source.headers?.get === 'function') {
      const cookieHeader = source.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
      token = match ? decodeURIComponent(match[1]) : undefined;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const rol = payload.rol as UserRole | undefined;
    const sv = payload.sv as number | undefined;
    const exp = payload.exp as number | undefined;

    if (!rol || (rol !== 'owner' && rol !== 'shared') || typeof sv !== 'number' || typeof exp !== 'number') {
      return null;
    }

    // Verificar contra la versión de sesión de la base de datos
    const config = await getConfig();
    if (config.session_version !== sv) {
      return null;
    }

    return { rol, exp };
  } catch {
    return null;
  }
}

