import { describe, it, expect } from 'vitest';
import { calcularTamano } from './imagen-cliente';

describe('calcularTamano', () => {
  it('dimensiones horizontales mayores al máximo', () => {
    // 2000 x 1000 con maxLado 1600 -> 1600 x 800
    const res = calcularTamano(2000, 1000, 1600);
    expect(res).toEqual({ ancho: 1600, alto: 800 });
  });

  it('dimensiones verticales mayores al máximo', () => {
    // 1000 x 2000 con maxLado 1600 -> 800 x 1600
    const res = calcularTamano(1000, 2000, 1600);
    expect(res).toEqual({ ancho: 800, alto: 1600 });
  });

  it('imagen cuadrada mayor al máximo', () => {
    // 3000 x 3000 con maxLado 600 -> 600 x 600
    const res = calcularTamano(3000, 3000, 600);
    expect(res).toEqual({ ancho: 600, alto: 600 });
  });

  it('imagen más chica que el máximo no se agranda', () => {
    // 800 x 600 con maxLado 1600 -> 800 x 600
    const res = calcularTamano(800, 600, 1600);
    expect(res).toEqual({ ancho: 800, alto: 600 });
  });

  it('imagen cuadrada más chica que el máximo', () => {
    // 400 x 400 con maxLado 600 -> 400 x 400
    const res = calcularTamano(400, 400, 600);
    expect(res).toEqual({ ancho: 400, alto: 400 });
  });
});
