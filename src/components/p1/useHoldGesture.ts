'use client';

import { useEffect, useRef, useCallback } from 'react';
import { HoldGesture } from '@/lib/hold';

export interface UseHoldGestureOptions {
  disabled?: boolean;
  onSuccess: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function useHoldGesture({
  disabled = false,
  onSuccess,
  containerRef,
}: UseHoldGestureOptions) {
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const handleTrigger = useCallback(async () => {
    try {
      const res = await fetch('/api/p/check', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok === true) {
          onSuccessRef.current();
        }
      }
    } catch {
      // Ignorar en silencio cualquier error
    }
  }, []);

  const gestureRef = useRef<HoldGesture | null>(null);

  useEffect(() => {
    const gesture = new HoldGesture({
      onTrigger: () => {
        void handleTrigger();
      },
    });
    gestureRef.current = gesture;

    return () => {
      gesture.cancel();
    };
  }, [handleTrigger]);

  // Cancelar en visibilitychange oculto
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        gestureRef.current?.cancel();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Cancelar en scroll del contenedor o de la ventana
  useEffect(() => {
    const handleScroll = () => {
      gestureRef.current?.cancel();
    };

    const container = containerRef?.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  // Si está disabled, cancelar inmediatamente
  useEffect(() => {
    if (disabled) {
      gestureRef.current?.cancel();
    }
  }, [disabled]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.button !== 0) return;
      gestureRef.current?.start(e.clientX, e.clientY);
    },
    [disabled]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    gestureRef.current?.move(e.clientX, e.clientY);
  }, []);

  const onPointerUp = useCallback(() => {
    gestureRef.current?.cancel();
  }, []);

  const onPointerCancel = useCallback(() => {
    gestureRef.current?.cancel();
  }, []);

  const onPointerLeave = useCallback(() => {
    gestureRef.current?.cancel();
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onContextMenu,
  };
}
