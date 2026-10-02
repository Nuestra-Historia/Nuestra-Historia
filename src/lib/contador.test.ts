import { describe, it, expect } from 'vitest';
import { desglosar } from './contador';

describe('desglosar', () => {
  it('desglosa correctamente una diferencia normal de tiempo', () => {
    // 2 días, 3 horas, 4 minutos, 5 segundos
    const diff = (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    const resultado = desglosar(diff);
    expect(resultado).toEqual({
      dias: 2,
      horas: 3,
      minutos: 4,
      segundos: 5,
    });
  });

  it('devuelve ceros cuando la diferencia es exactamente cero', () => {
    const resultado = desglosar(0);
    expect(resultado).toEqual({
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    });
  });

  it('limita la diferencia negativa a cero', () => {
    const resultado = desglosar(-50000);
    expect(resultado).toEqual({
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    });
  });

  it('maneja correctamente una cantidad grande de días', () => {
    // 1500 días, 12 horas, 30 minutos, 45 segundos
    const diff = (1500 * 86400 + 12 * 3600 + 30 * 60 + 45) * 1000;
    const resultado = desglosar(diff);
    expect(resultado).toEqual({
      dias: 1500,
      horas: 12,
      minutos: 30,
      segundos: 45,
    });
  });
});
