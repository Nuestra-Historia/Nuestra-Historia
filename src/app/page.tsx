import { notFound } from 'next/navigation';
import { getConfig, getDb } from '@/lib/db';
import { Pagina1 } from '@/components/p1/Pagina1';
import { Pagina2Provisoria } from '@/components/p2/Pagina2Provisoria';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let config;
  try {
    config = await getConfig();
  } catch {
    notFound();
  }

  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now();

  if (config.estado === 'apagado') {
    notFound();
  }

  if (config.estado === 'aceptado') {
    return (
      <Pagina2Provisoria
        fechaAceptado={config.fecha_aceptado}
        serverNow={serverNow}
      />
    );
  }

  // Estado 'preguntando'
  const db = getDb();
  const { data: frasesData, error } = await db
    .from('frases')
    .select('texto')
    .order('orden', { ascending: true });

  if (error) {
    notFound();
  }

  const frases = (frasesData || []).map((f) => f.texto);

  return (
    <Pagina1
      fechaHablar={config.fecha_hablar}
      fechaPareja={config.fecha_pareja}
      frases={frases}
      serverNow={serverNow}
    />
  );
}
