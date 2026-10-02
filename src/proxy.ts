import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ownerPath = process.env.OWNER_ADMIN_PATH;
  const sharedPath = process.env.SHARED_ADMIN_PATH;

  // 1. Bloqueo de acceso directo a /adm-o* y /adm-s*
  if (
    pathname === '/adm-o' ||
    pathname.startsWith('/adm-o/') ||
    pathname === '/adm-s' ||
    pathname.startsWith('/adm-s/')
  ) {
    const notFoundUrl = new URL('/_not-found', request.url);
    const response = NextResponse.rewrite(notFoundUrl, { status: 404 });
    applySecurityHeaders(response);
    return response;
  }

  // 2. Rewrite para Owner
  if (ownerPath && (pathname === `/${ownerPath}` || pathname.startsWith(`/${ownerPath}/`))) {
    const remainder = pathname.slice(1 + ownerPath.length);
    const destination = `/adm-o${remainder}${search}`;
    const rewriteUrl = new URL(destination, request.url);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-internal-admin', 'owner');

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    applySecurityHeaders(response);
    return response;
  }

  // 3. Rewrite para Shared
  if (sharedPath && (pathname === `/${sharedPath}` || pathname.startsWith(`/${sharedPath}/`))) {
    const remainder = pathname.slice(1 + sharedPath.length);
    const destination = `/adm-s${remainder}${search}`;
    const rewriteUrl = new URL(destination, request.url);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-internal-admin', 'shared');

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    applySecurityHeaders(response);
    return response;
  }

  // 4. Respuesta normal con headers de seguridad
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
}

