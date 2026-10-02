import 'server-only';
import { env } from './env';
import { leerSesion, SessionResult } from './session';

export function empty404Response(): Response {
  return new Response(null, {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function requireOwner(req: Request): Promise<SessionResult | Response> {
  // Verificar header Origin solo para métodos que no sean GET
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin !== env.SITE_ORIGIN) {
      return empty404Response();
    }
  }

  const session = await leerSesion(req);
  if (!session || session.rol !== 'owner') {
    return empty404Response();
  }

  return session;
}
