import { createHash } from 'crypto';

export function claveSemana(date: Date): string {
  // America/Argentina/Buenos_Aires es UTC-3 fijo sin horario de verano.
  // Restar 3 horas a la fecha para alinear UTC getters con el reloj local de Buenos Aires.
  const d = new Date(date.getTime() - 3 * 3600 * 1000);

  // En ISO 8601: Lunes = 1 .. Domingo = 7
  const dayOfWeek = ((d.getUTCDay() + 6) % 7) + 1;

  // El jueves de la semana define el año ISO y número de semana
  d.setUTCDate(d.getUTCDate() + (4 - dayOfWeek));

  const isoYear = d.getUTCFullYear();
  const firstDayOfYear = new Date(Date.UTC(isoYear, 0, 1));
  const dayOfYear =
    Math.floor((d.getTime() - firstDayOfYear.getTime()) / 86400000) + 1;
  const isoWeek = Math.ceil(dayOfYear / 7);

  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

export function elegirDestacados(
  ids: string[],
  clave: string,
  n: number = 4
): string[] {
  if (ids.length <= n) {
    return [...ids];
  }

  const scored = ids.map((id) => {
    const hash = createHash('sha256').update(`${clave}:${id}`).digest('hex');
    const score = parseInt(hash.slice(0, 8), 16);
    return { id, score };
  });

  scored.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    return a.id.localeCompare(b.id);
  });

  return scored.slice(0, n).map((item) => item.id);
}
