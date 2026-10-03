import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HoldGesture, HOLD_MS, MOVE_TOLERANCE_PX } from './hold';

describe('HoldGesture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispara exactamente a los 3000 ms', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);

    vi.advanceTimersByTime(HOLD_MS - 1);
    expect(onTrigger).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('no dispara si se suelta a los 2999 ms', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);
    vi.advanceTimersByTime(HOLD_MS - 1);

    // Se suelta (cancel) a los 2999 ms
    gesture.cancel();

    vi.advanceTimersByTime(1000);
    expect(onTrigger).not.toHaveBeenCalled();
    expect(gesture.isActive()).toBe(false);
  });

  it('se cancela con movimiento mayor a 10 px', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);

    // Movimiento dentro de la tolerancia (10 px exactos)
    gesture.move(50, 50 + MOVE_TOLERANCE_PX);
    expect(gesture.isActive()).toBe(true);

    // Movimiento mayor a la tolerancia (11 px)
    gesture.move(50, 50 + MOVE_TOLERANCE_PX + 1);
    expect(gesture.isActive()).toBe(false);

    vi.advanceTimersByTime(HOLD_MS);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('se cancela con pointercancel', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);
    expect(gesture.isActive()).toBe(true);

    // Simulando pointercancel
    gesture.cancel();
    expect(gesture.isActive()).toBe(false);

    vi.advanceTimersByTime(HOLD_MS);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('no dispara dos veces', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);
    vi.advanceTimersByTime(HOLD_MS);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    // Avanzando más tiempo
    vi.advanceTimersByTime(5000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('un segundo pointerdown reinicia correctamente', () => {
    const onTrigger = vi.fn();
    const gesture = new HoldGesture({ onTrigger });

    gesture.start(50, 50);
    vi.advanceTimersByTime(2000); // 2000 ms transcurridos

    // Segundo pointerdown reinicia el temporizador
    gesture.start(60, 60);

    // 2000 ms más (total 4000 ms desde el inicio pero 2000 ms desde el 2do start)
    vi.advanceTimersByTime(2000);
    expect(onTrigger).not.toHaveBeenCalled();

    // 1000 ms más (completa los 3000 ms del 2do start)
    vi.advanceTimersByTime(1000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
