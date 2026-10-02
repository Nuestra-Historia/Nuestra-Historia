import 'server-only';
import { getDb, getConfig } from './db';

export type EstadoApp = 'preguntando' | 'aceptado' | 'apagado';

export async function getEstado(): Promise<EstadoApp> {
  const config = await getConfig();
  return config.estado;
}

export async function cambiarEstado(nuevo: EstadoApp): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {
    estado: nuevo,
    updated_at: now,
  };

  if (nuevo === 'aceptado') {
    // Sobrescribir siempre con now() para que ningún ensayo previo deje una fecha vieja
    updates.fecha_aceptado = now;
  } else if (nuevo === 'preguntando') {
    updates.fecha_aceptado = null;
  }
  // Si nuevo === 'apagado', no se modifica fecha_aceptado

  const { error } = await db
    .from('config')
    .update(updates)
    .eq('id', 1);

  if (error) {
    throw new Error(`Error al cambiar estado a ${nuevo}: ${error.message}`);
  }
}
