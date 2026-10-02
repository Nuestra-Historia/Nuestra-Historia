import { describe, it, expect } from 'vitest';
import {
  isoToBuenosAiresInput,
  buenosAiresInputToIso,
  isDateInFuture,
} from './fechas';

describe('fechas (zona America/Argentina/Buenos_Aires, UTC-3)', () => {
  it('realiza ida y vuelta correcta entre datetime-local e ISO UTC en horario diurno', () => {
    const inputBsAs = '2026-05-15T14:30';
    const iso = buenosAiresInputToIso(inputBsAs);
    expect(iso).toBe('2026-05-15T14:30:00-03:00');

    // Convertido a UTC en Date object
    const utcIso = new Date(iso!).toISOString();
    expect(utcIso).toBe('2026-05-15T17:30:00.000Z');

    // De vuelta a input de Buenos Aires
    const vueltaBsAs = isoToBuenosAiresInput(utcIso);
    expect(vueltaBsAs).toBe(inputBsAs);
  });

  it('maneja correctamente un caso cerca de medianoche (23:59 cruza de fecha en UTC)', () => {
    const inputBsAs = '2026-12-31T23:59';
    const iso = buenosAiresInputToIso(inputBsAs);
    expect(iso).toBe('2026-12-31T23:59:00-03:00');

    // En UTC son las 02:59 del 1 de enero
    const utcIso = new Date(iso!).toISOString();
    expect(utcIso).toBe('2027-01-01T02:59:00.000Z');

    // Al regresar a Buenos Aires debe mantenerse el 31 de diciembre 23:59
    const vueltaBsAs = isoToBuenosAiresInput(utcIso);
    expect(vueltaBsAs).toBe(inputBsAs);
  });

  it('maneja correctamente un caso al inicio del día (00:01)', () => {
    const inputBsAs = '2026-01-01T00:01';
    const iso = buenosAiresInputToIso(inputBsAs);
    expect(iso).toBe('2026-01-01T00:01:00-03:00');

    // En UTC son las 03:01 del mismo día
    const utcIso = new Date(iso!).toISOString();
    expect(utcIso).toBe('2026-01-01T03:01:00.000Z');

    const vueltaBsAs = isoToBuenosAiresInput(utcIso);
    expect(vueltaBsAs).toBe(inputBsAs);
  });

  it('devuelve cadena vacía o null ante entradas vacías o inválidas', () => {
    expect(isoToBuenosAiresInput(null)).toBe('');
    expect(isoToBuenosAiresInput('')).toBe('');
    expect(buenosAiresInputToIso(null)).toBeNull();
    expect(buenosAiresInputToIso('')).toBeNull();
  });

  it('detecta correctamente si una fecha está en el futuro', () => {
    const pasado = new Date(Date.now() - 100000).toISOString();
    const futuro = new Date(Date.now() + 100000).toISOString();

    expect(isDateInFuture(pasado)).toBe(false);
    expect(isDateInFuture(futuro)).toBe(true);
  });
});
