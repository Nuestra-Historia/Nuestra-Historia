'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UsePollEstadoOptions {
  preview?: boolean;
  onServerTime?: (serverTimeMs: number) => void;
}

export function usePollEstado({ preview, onServerTime }: UsePollEstadoOptions = {}) {
  const router = useRouter();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (preview) return;

    let timeoutId: NodeJS.Timeout | null = null;

    async function poll() {
      if (stoppedRef.current) return;

      try {
        const res = await fetch('/api/estado', {
          cache: 'no-store',
        });

        if (res.ok) {
          const data: { e: 'p' | 'a' | 'x'; t: number } = await res.json();

          if (data.t && onServerTime) {
            onServerTime(data.t);
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

      if (!stoppedRef.current && !document.hidden) {
        timeoutId = setTimeout(poll, 5000);
      }
    }

    function handleVisibilityChange() {
      if (stoppedRef.current) return;

      if (!document.hidden) {
        if (timeoutId) clearTimeout(timeoutId);
        poll();
      } else {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    poll();

    return () => {
      stoppedRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preview, router, onServerTime]);

  return { isFadingOut };
}
