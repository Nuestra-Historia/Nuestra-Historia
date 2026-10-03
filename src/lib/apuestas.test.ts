import { describe, it, expect } from 'vitest';
import { calcularDeudas, ApuestaFila } from './apuestas';

describe('calcularDeudas', () => {
  const nombres = { nombreA: 'Agos', nombreB: 'Nico' };

  it('calcula deuda correctamente cuando gana A (deudor es B y acreedor es A)', () => {
    const apuestas: ApuestaFila[] = [
      {
        id: 'ap-1',
        titulo: 'Quién cocina mejor',
        apuesta_a: null,
        apuesta_b: null,
        premio: 'Una cena',
        estado: 'resuelta',
        ganador: 'a',
        pagada: false,
        fecha: null,
      },
    ];

    const deudas = calcularDeudas(apuestas, nombres);
    expect(deudas).toHaveLength(1);
    expect(deudas[0]).toEqual({
      id: 'ap-1',
      deudor: 'Nico',
      acreedor: 'Agos',
      premio: 'Una cena',
    });
  });

  it('calcula deuda correctamente cuando gana B (deudor es A y acreedor es B)', () => {
    const apuestas: ApuestaFila[] = [
      {
        id: 'ap-2',
        titulo: 'Quién llega primero',
        apuesta_a: null,
        apuesta_b: null,
        premio: 'Un helado',
        estado: 'resuelta',
        ganador: 'b',
        pagada: false,
        fecha: null,
      },
    ];

    const deudas = calcularDeudas(apuestas, nombres);
    expect(deudas).toHaveLength(1);
    expect(deudas[0]).toEqual({
      id: 'ap-2',
      deudor: 'Agos',
      acreedor: 'Nico',
      premio: 'Un helado',
    });
  });

  it('excluye apuestas ya pagadas y apuestas pendientes', () => {
    const apuestas: ApuestaFila[] = [
      {
        id: 'ap-pagada',
        titulo: 'Pagada',
        apuesta_a: null,
        apuesta_b: null,
        premio: 'Café',
        estado: 'resuelta',
        ganador: 'a',
        pagada: true,
        fecha: null,
      },
      {
        id: 'ap-pendiente',
        titulo: 'Pendiente',
        apuesta_a: null,
        apuesta_b: null,
        premio: 'Cine',
        estado: 'pendiente',
        ganador: null,
        pagada: false,
        fecha: null,
      },
    ];

    const deudas = calcularDeudas(apuestas, nombres);
    expect(deudas).toHaveLength(0);
  });

  it('asigna "(sin definir)" si el premio está vacío o null', () => {
    const apuestas: ApuestaFila[] = [
      {
        id: 'ap-sin-premio-1',
        titulo: 'Sin premio null',
        apuesta_a: null,
        apuesta_b: null,
        premio: null,
        estado: 'resuelta',
        ganador: 'a',
        pagada: false,
        fecha: null,
      },
      {
        id: 'ap-sin-premio-2',
        titulo: 'Sin premio vacío',
        apuesta_a: null,
        apuesta_b: null,
        premio: '   ',
        estado: 'resuelta',
        ganador: 'b',
        pagada: false,
        fecha: null,
      },
    ];

    const deudas = calcularDeudas(apuestas, nombres);
    expect(deudas).toHaveLength(2);
    expect(deudas[0].premio).toBe('(sin definir)');
    expect(deudas[1].premio).toBe('(sin definir)');
  });
});
