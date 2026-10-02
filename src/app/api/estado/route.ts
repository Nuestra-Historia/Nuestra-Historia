import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getEstado } from '@/lib/estado';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const estado = await getEstado();
    let e: 'p' | 'a' | 'x';
    if (estado === 'preguntando') e = 'p';
    else if (estado === 'aceptado') e = 'a';
    else if (estado === 'apagado') e = 'x';
    else return notFound();

    return NextResponse.json(
      {
        e,
        t: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch {
    notFound();
  }
}
