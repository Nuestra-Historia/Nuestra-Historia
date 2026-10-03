'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UsePollEstadoOptions {
  preview?: boolean;
  onServerTime?: (serverTimeMs: number) => void;
}

export function usePollEstado({ preview, onServerTime }: UsePollEstadoOptions = {}) {
  const router = useRouter();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const stoppedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onServerTimeRef = useRef(onServerTime);
  useEffect(() => {
    onServerTimeRef.current = onServerTime;
  }, [onServerTime]);

  const checkNowRef = useRef<() => Promise<void>>(async () => {});

  const checkNow = useCallback(async () => {
    if (stoppedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      const res = await fetch('/api/estado', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data: { e: 'p' | 'a' | 'x'; t: number } = await res.json();

        if (data.t && onServerTimeRef.current) {
          onServerTimeRef.current(data.t);
        }

        if (data.e === 'a') {
          stoppedRef.current = true;
          setIsFadingOut(true);
          setTimeout(() => {
            router.refresh();
          }, 500);
          return;
        }

        if (data.e === 'x') {
          stoppedRef.current = true;
          window.location.reload();
          return;
        }
      }
    } catch {
      // Ignorar errores de red en silencio
    }

    if (!stoppedRef.current && !document.hidden && !preview) {
      timeoutRef.current = setTimeout(() => {
        void checkNowRef.current();
      }, 5000);
    }
  }, [router, preview]);

  useEffect(() => {
    checkNowRef.current = checkNow;
  }, [checkNow]);

  useEffect(() => {
    if (preview) return;

    function handleVisibilityChange() {
      if (stoppedRef.current) return;

      if (!document.hidden) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        void checkNow();
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Arrancar polling de forma asíncrona
    timeoutRef.current = setTimeout(() => {
      void checkNow();
    }, 0);

    return () => {
      stoppedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preview, checkNow]);

  return { isFadingOut, checkNow };
}
