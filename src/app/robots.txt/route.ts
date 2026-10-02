export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('User-agent: *\nDisallow: /\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'private, no-store',
    },
  });
}

