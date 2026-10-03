import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getConfig } from '@/lib/db';
import { leerSesion } from '@/lib/session';
import { env } from '@/lib/env';
import { LoginForm } from '@/components/login-form';
import { Contenido } from '@/components/contenido/Contenido';

export const dynamic = 'force-dynamic';

export default async function AdminOwnerContenidoPage() {
  const headersList = await headers();
  if (headersList.get('x-internal-admin') !== 'owner') {
    notFound();
  }

  const session = await leerSesion();

  if (!session || session.rol !== 'owner') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
        <LoginForm scope="o" />
      </main>
    );
  }

  const config = await getConfig();
  const nombreA = config.nombre_a || 'Agos';
  const nombreB = config.nombre_b || 'Nico';

  return (
    <main className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <a
              href={`/${env.OWNER_ADMIN_PATH}`}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              ← Administración
            </a>
          </div>
          <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
            Contenido
          </h1>
        </header>

        <Contenido nombreA={nombreA} nombreB={nombreB} />
      </div>
    </main>
  );
}

