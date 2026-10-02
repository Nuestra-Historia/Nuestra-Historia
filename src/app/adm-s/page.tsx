import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getConfig } from '@/lib/db';
import { leerSesion } from '@/lib/session';
import { LoginForm } from '@/components/login-form';
import { LogoutButton } from '@/components/logout-button';

export const dynamic = 'force-dynamic';

export default async function AdminSharedPage() {
  const headersList = await headers();
  if (headersList.get('x-internal-admin') !== 'shared') {
    notFound();
  }

  try {
    const config = await getConfig();
    if (config.estado !== 'aceptado') {
      notFound();
    }
  } catch {
    notFound();
  }

  const session = await leerSesion();

  if (!session || (session.rol !== 'shared' && session.rol !== 'owner')) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <LoginForm scope="s" />
      </main>
    );
  }

  const expDate = new Date(session.exp * 1000);
  const formattedExp = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(expDate);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
      <div className="flex flex-col items-center gap-2 p-6 border border-neutral-200 rounded bg-white shadow-sm max-w-sm w-full text-center">
        <p className="text-sm font-medium text-neutral-800">Sesión activa</p>
        <p className="text-xs text-neutral-500">Expira: {formattedExp}</p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}

