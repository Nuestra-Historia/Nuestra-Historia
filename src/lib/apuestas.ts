export interface ApuestaFila {
  id: string;
  titulo: string;
  apuesta_a: string | null;
  apuesta_b: string | null;
  premio: string | null;
  estado: 'pendiente' | 'resuelta';
  ganador: 'a' | 'b' | null;
  pagada: boolean;
  fecha: string | null;
  created_at?: string;
}

export interface Deuda {
  id: string;
  deudor: string;
  acreedor: string;
  premio: string;
}

export function calcularDeudas(
  apuestas: ApuestaFila[],
  nombres: { nombreA: string; nombreB: string }
): Deuda[] {
  const deudas: Deuda[] = [];

  for (const a of apuestas) {
    if (
      a.estado === 'resuelta' &&
      !a.pagada &&
      (a.ganador === 'a' || a.ganador === 'b')
    ) {
      const premioLimpio = a.premio?.trim();
      const premio = premioLimpio ? premioLimpio : '(sin definir)';

      if (a.ganador === 'a') {
        deudas.push({
          id: a.id,
          deudor: nombres.nombreB,
          acreedor: nombres.nombreA,
          premio,
        });
      } else {
        deudas.push({
          id: a.id,
          deudor: nombres.nombreA,
          acreedor: nombres.nombreB,
          premio,
        });
      }
    }
  }

  return deudas;
}
