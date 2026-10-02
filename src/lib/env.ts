import 'server-only';
import { z } from 'zod';

const pathRegex = /^[A-Za-z0-9_-]+$/;

const envSchema = z
  .object({
    OWNER_ADMIN_PATH: z
      .string()
      .min(24, 'OWNER_ADMIN_PATH debe tener al menos 24 caracteres')
      .regex(pathRegex, 'OWNER_ADMIN_PATH solo puede contener [A-Za-z0-9_-]'),
    SHARED_ADMIN_PATH: z
      .string()
      .min(24, 'SHARED_ADMIN_PATH debe tener al menos 24 caracteres')
      .regex(pathRegex, 'SHARED_ADMIN_PATH solo puede contener [A-Za-z0-9_-]'),
    OWNER_PASSWORD_HASH_B64: z
      .string()
      .min(1, 'OWNER_PASSWORD_HASH_B64 no puede estar vacía'),
    SHARED_PASSWORD_HASH_B64: z
      .string()
      .min(1, 'SHARED_PASSWORD_HASH_B64 no puede estar vacía'),
    SESSION_SECRET: z
      .string()
      .min(32, 'SESSION_SECRET debe tener al menos 32 caracteres'),
    CRON_SECRET: z
      .string()
      .min(1, 'CRON_SECRET no puede estar vacía'),
    IP_HASH_PEPPER: z
      .string()
      .min(1, 'IP_HASH_PEPPER no puede estar vacía'),
    SITE_ORIGIN: z
      .string()
      .url('SITE_ORIGIN debe ser una URL válida'),
    SUPABASE_URL: z
      .string()
      .url('SUPABASE_URL debe ser una URL válida'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, 'SUPABASE_SERVICE_ROLE_KEY no puede estar vacía'),
  })
  .refine((data) => data.OWNER_ADMIN_PATH !== data.SHARED_ADMIN_PATH, {
    message: 'OWNER_ADMIN_PATH y SHARED_ADMIN_PATH deben ser distintos entre sí',
    path: ['SHARED_ADMIN_PATH'],
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Error de configuración en variables de entorno:\n${errorDetails}`
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'symbol') return undefined;
    return getEnv()[prop as keyof Env];
  },
});
