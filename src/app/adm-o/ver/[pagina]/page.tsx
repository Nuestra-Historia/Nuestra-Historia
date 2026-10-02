import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { leerSesion } from '@/lib/session';
import { getConfig, getDb } from '@/lib/db';
import { env } from '@/lib/env';
import { Pagina1 } from '@/components/p1/Pagina1';
import { Pagina2Provisoria } from '@/components/p2/Pagina2Provisoria';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ pagina: string }>;
}

export default async function AdminPreviewPage({ params }: RouteProps) {
  const headersList = await headers();
  if (headersList.get('x-internal-admin') !== 'owner') {
    notFound();
  }

  const session = await leerSesion();
  if (!session || session.rol !== 'owner') {
    notFound();
  }

  const { pagina } = await params;
  if (pagina !== '1' && pagina !== '2') {
    notFound();
  }

  const config = await getConfig();
  const db = getDb();
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now();
  const adminUrl = `/${env.OWNER_ADMIN_PATH}`;

  return (
    <div className="relative min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800 text-xs text-neutral-300 px-4 py-2 flex items-center justify-between select-none">
        <span className="font-medium text-neutral-200">
          Vista previa (Página {pagina})
        </span>
        <Link
          href={adminUrl}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ← Volver al panel
        </Link>
      </header>

      <div className="pt-8">
        {pagina === '1' ? (
          (() => {
            return (
              <PreviewP1Wrapper
                config={config}
                db={db}
                serverNow={serverNow}
              />
            );
          })()
        ) : (
          <Pagina2Provisoria
            fechaAceptado={config.fecha_aceptado}
            serverNow={serverNow}
          />
        )}
      </div>
    </div>
  );
}

async function PreviewP1Wrapper({
  config,
  db,
  serverNow,
}: {
  config: Awaited<ReturnType<typeof getConfig>>;
  db: ReturnType<typeof getDb>;
  serverNow: number;
}) {
  const { data: frasesData } = await db
    .from('frases')
    .select('texto')
    .order('orden', { ascending: true });

  const frases = (frasesData || []).map((f) => f.texto);

  return (
    <Pagina1
      fechaHablar={config.fecha_hablar}
      fechaPareja={config.fecha_pareja}
      frases={frases}
      serverNow={serverNow}
      preview={true}
    />
  );
}
