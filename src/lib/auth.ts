import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import { env } from './env';

export const DUMMY_BCRYPT_HASH = '$2b$12$moEO5TU5OYJOk1CnKwWP5.oXO.6I5jMY8SNhF28uWN5RiPTzhl3F6';

export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-vercel-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(env.IP_HASH_PEPPER + ip)
    .digest('hex');
}

export function decodeHashB64(hashB64: string): string {
  try {
    return Buffer.from(hashB64, 'base64').toString('utf-8');
  } catch {
    return DUMMY_BCRYPT_HASH;
  }
}

export async function comparePassword(password: string, expectedHashB64: string): Promise<boolean> {
  const targetHash = decodeHashB64(expectedHashB64);
  const isValidFormat = targetHash.startsWith('$2a$') || targetHash.startsWith('$2b$');
  const hashToCompare = isValidFormat ? targetHash : DUMMY_BCRYPT_HASH;

  try {
    const matches = await bcrypt.compare(password, hashToCompare);
    return isValidFormat && matches;
  } catch {
    return false;
  }
}

