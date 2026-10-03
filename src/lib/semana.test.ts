import { describe, it, expect } from 'vitest';
import { claveSemana, elegirDestacados } from './semana';

describe('claveSemana y elegirDestacados', () => {
  it('la misma semana da la misma selección', () => {
    const ids = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6'];
    const d1 = new Date('2026-10-07T12:00:00Z');
    const d2 = new Date('2026-10-09T18:00:00Z');

    const clave1 = claveSemana(d1);
    const clave2 = claveSemana(d2);
    expect(clave1).toBe(clave2);

    const sel1 = elegirDestacados(ids, clave1, 4);
    const sel2 = elegirDestacados(ids, clave2, 4);
    expect(sel1).toEqual(sel2);
  });

  it('un domingo 23:59 y el lunes 00:00 (hora Buenos Aires, 02:59 y 03:00 UTC) caen en semanas distintas', () => {
    // 2026-10-04 es Domingo en Buenos Aires (hasta las 02:59:59Z del 2026-10-05)
    // 2026-10-05 03:00:00Z es Lunes 00:00:00 en Buenos Aires
    const domingoBuenosAires = new Date('2026-10-05T02:59:00Z');
    const lunesBuenosAires = new Date('2026-10-05T03:00:00Z');

    const claveDom = claveSemana(domingoBuenosAires);
    const claveLun = claveSemana(lunesBuenosAires);

    expect(claveDom).not.toBe(claveLun);
    expect(claveDom).toBe('2026-W40');
    expect(claveLun).toBe('2026-W41');
  });

  it('claves correctas alrededor del 31 de diciembre y el 1 de enero', () => {
    // En 2026: 31 de diciembre de 2026 es Jueves -> pertenece a la semana 2026-W53.
    // 1 de enero de 2027 es Viernes -> pertenece a la misma semana 2026-W53.
    // 4 de enero de 2027 es Lunes -> semana 2027-W01.
    const dec31 = new Date('2026-12-31T15:00:00Z'); // Mediodía Buenos Aires
    const jan1 = new Date('2027-01-01T15:00:00Z');  // Mediodía Buenos Aires
    const jan4 = new Date('2027-01-04T15:00:00Z');  // Mediodía Buenos Aires

    expect(claveSemana(dec31)).toBe('2026-W53');
    expect(claveSemana(jan1)).toBe('2026-W53');
    expect(claveSemana(jan4)).toBe('2027-W01');
  });

  it('con 6 ids, entre 8 semanas distintas hay al menos dos selecciones diferentes', () => {
    const ids = ['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5', 'uuid-6'];
    const selecciones = new Set<string>();

    for (let w = 1; w <= 8; w++) {
      const clave = `2026-W0${w}`;
      const sel = elegirDestacados(ids, clave, 4);
      selecciones.add(sel.join(','));
    }

    expect(selecciones.size).toBeGreaterThanOrEqual(2);
  });

  it('agregar un id a la lista cambia como máximo un elemento de la selección', () => {
    const ids = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'];
    const clave = '2026-W40';

    const selOriginal = elegirDestacados(ids, clave, 4);
    const selNuevo = elegirDestacados([...ids, 'id-6'], clave, 4);

    // Los elementos comunes deben ser al menos 3 (cambia como máximo 1)
    const comunes = selOriginal.filter((id) => selNuevo.includes(id));
    expect(comunes.length).toBeGreaterThanOrEqual(3);
  });

  it('con 3 ids devuelve los 3', () => {
    const ids = ['foto-a', 'foto-b', 'foto-c'];
    const sel = elegirDestacados(ids, '2026-W40', 4);
    expect(sel).toHaveLength(3);
    expect(sel).toEqual(ids);
  });
});
