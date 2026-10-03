import 'server-only';
import { getDb, getConfig } from './db';
import { presignGet } from './r2';
import { claveSemana, elegirDestacados } from './semana';
import { calcularDeudas, ApuestaFila, Deuda } from './apuestas';
import { SessionResult } from './session';

export interface Pagina2Data {
  fechaAceptado: string | null;
  nombreA: string;
  nombreB: string;
  tiraA: { id: string; url: string; ancho: number; alto: number }[];
  tiraB: { id: string; url: string; ancho: number; alto: number }[];
  momentos: {
    todos: {
      id: string;
      url: string;
      ancho: number;
      alto: number;
      fecha: string | null;
      descripcion: string | null;
    }[];
    destacadosIds: string[];
  };
  apuestas: {
    pendientes: ApuestaFila[];
    deudas: Deuda[];
  };
}

export async function getPagina2Data(
  now: Date = new Date()
): Promise<Pagina2Data> {
  const db = getDb();
  const config = await getConfig();

  const nombreA = config.nombre_a || 'Agos';
  const nombreB = config.nombre_b || 'Nico';

  // Leer fotos ordenadas por orden y created_at
  const { data: fotosData } = await db
    .from('fotos')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  const fotos = fotosData || [];

  const tiraA: { id: string; url: string; ancho: number; alto: number }[] = [];
  const tiraB: { id: string; url: string; ancho: number; alto: number }[] = [];
  const momentosTodos: {
    id: string;
    url: string;
    ancho: number;
    alto: number;
    fecha: string | null;
    descripcion: string | null;
  }[] = [];

  for (const f of fotos) {
    // Solo presignar miniaturas
    const thumbUrl = await presignGet(f.r2_key_thumb);
    if (f.tipo === 'tira_a') {
      tiraA.push({
        id: f.id,
        url: thumbUrl,
        ancho: f.ancho,
        alto: f.alto,
      });
    } else if (f.tipo === 'tira_b') {
      tiraB.push({
        id: f.id,
        url: thumbUrl,
        ancho: f.ancho,
        alto: f.alto,
      });
    } else if (f.tipo === 'momento') {
      momentosTodos.push({
        id: f.id,
        url: thumbUrl,
        ancho: f.ancho,
        alto: f.alto,
        fecha: f.fecha,
        descripcion: f.descripcion,
      });
    }
  }

  // Elegir destacados de la semana
  const clave = claveSemana(now);
  const destacadosIds = elegirDestacados(
    momentosTodos.map((m) => m.id),
    clave,
    4
  );

  // Leer apuestas
  const { data: apuestasData } = await db
    .from('apuestas')
    .select('*')
    .order('created_at', { ascending: false });

  const apuestas = (apuestasData || []) as ApuestaFila[];
  const pendientes = apuestas.filter((a) => a.estado === 'pendiente');
  const deudas = calcularDeudas(apuestas, { nombreA, nombreB });

  return {
    fechaAceptado: config.fecha_aceptado,
    nombreA,
    nombreB,
    tiraA,
    tiraB,
    momentos: {
      todos: momentosTodos,
      destacadosIds,
    },
    apuestas: {
      pendientes,
      deudas,
    },
  };
}

/**
 * Único punto donde se decide la visibilidad pública de la Página 2.
 * Devuelve true porque en estado 'aceptado' la Página 2 es pública para quien tenga la URL.
 */
export function puedeVerPagina2(_sesion?: SessionResult | null): boolean {
  void _sesion;
  return true;
}

export function puedeGestionar(
  sesion: SessionResult | null,
  estado: 'preguntando' | 'aceptado' | 'apagado'
): boolean {
  if (!sesion) return false;
  if (sesion.rol === 'owner') return true;
  if (sesion.rol === 'shared' && estado === 'aceptado') return true;
  return false;
}
