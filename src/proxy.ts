import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

async function verifyTokenSignature(token: string): Promise<boolean> {
  const secretStr = process.env.SESSION_SECRET;
  if (!secretStr) return false;
  try {
    const secret = new TextEncoder().encode(secretStr);
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

async function getEstadoFromDb(): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/config?select=estado&id=eq.1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.estado || null;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'private, no-store');
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ownerPath = process.env.OWNER_ADMIN_PATH;
  const sharedPath = process.env.SHARED_ADMIN_PATH;

  // 1. Sanitizar request headers: borrar cualquier header interno inyectado por el cliente
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-internal-admin');

  // 2. Barrera en el proxy para endpoints de API privados (/api/o/*, /api/s/*, /api/p/*)
  if (
    pathname.startsWith('/api/o/') ||
    pathname.startsWith('/api/s/') ||
    pathname.startsWith('/api/p/')
  ) {
    const token = request.cookies.get('sid')?.value;
    const hasValidToken = token ? await verifyTokenSignature(token) : false;
    if (!hasValidToken) {
      const notFoundUrl = new URL('/_not-found', request.url);
      const response = NextResponse.rewrite(notFoundUrl, { status: 404 });
      applySecurityHeaders(response);
      return response;
    }
  }

  // 3. Rewrite para Owner: /<OWNER_ADMIN_PATH> y subrutas
  if (ownerPath && (pathname === `/${ownerPath}` || pathname.startsWith(`/${ownerPath}/`))) {
    const remainder = pathname.slice(1 + ownerPath.length);
    const destination = `/adm-o${remainder}${search}`;
    const rewriteUrl = new URL(destination, request.url);

    requestHeaders.set('x-internal-admin', 'owner');

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    applySecurityHeaders(response);
    return response;
  }

  // 4. Rewrite para Shared: /<SHARED_ADMIN_PATH> y subrutas
  if (sharedPath && (pathname === `/${sharedPath}` || pathname.startsWith(`/${sharedPath}/`))) {
    const estado = await getEstadoFromDb();
    if (estado === 'aceptado') {
      const remainder = pathname.slice(1 + sharedPath.length);
      const destination = `/adm-s${remainder}${search}`;
      const rewriteUrl = new URL(destination, request.url);

      requestHeaders.set('x-internal-admin', 'shared');

      const response = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
      applySecurityHeaders(response);
      return response;
    }

    // Si estado != 'aceptado', NO se reescribe. Deja que Next.js devuelva 404 de URL inexistente
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    applySecurityHeaders(response);
    return response;
  }

  // 5. Demás peticiones (incluyendo peticiones directas a /adm-o* o /adm-s*)
  // Pasan a Next con los headers sanitizados (sin x-internal-admin)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applySecurityHeaders(response);
  return response;
}
