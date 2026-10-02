import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { leerSesion } from '@/lib/session';
import { getConfig, getDb } from '@/lib/db';
import { env } from '@/lib/env';
import { LoginForm } from '@/components/login-form';
import { SeccionEstado } from '@/components/admin/SeccionEstado';
import { SeccionFechas } from '@/components/admin/SeccionFechas';
import { SeccionFrases } from '@/components/admin/SeccionFrases';
import { SeccionVistaPrevia } from '@/components/admin/SeccionVistaPrevia';
import { SeccionReset } from '@/components/admin/SeccionReset';
import { SeccionSesion } from '@/components/admin/SeccionSesion';

export const dynamic = 'force-dynamic';

export default async function AdminOwnerPage() {
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
  const db = getDb();
  const { data: frasesData } = await db
    .from('frases')
    .select('id, orden, texto')
    .order('orden', { ascending: true });

  const frases = frasesData || [];

  const expDate = new Date(session.exp * 1000);
  const formattedExp = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(expDate);

  return (
    <main className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
            Administración
          </h1>
          <span className="text-xs text-neutral-400 font-mono">owner</span>
        </header>

        <SeccionEstado estadoActual={config.estado} />
        <SeccionFechas
          fechaHablarIso={config.fecha_hablar}
          fechaParejaIso={config.fecha_pareja}
          fechaAceptadoIso={config.fecha_aceptado}
        />
        <SeccionFrases frasesIniciales={frases} />
        <SeccionVistaPrevia ownerPath={env.OWNER_ADMIN_PATH} />
        <SeccionReset />
        <SeccionSesion fechaExp={formattedExp} />
      </div>
    </main>
  );
}
