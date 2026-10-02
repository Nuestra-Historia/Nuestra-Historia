'use client';

import { useState, useEffect } from 'react';
import { desglosar, DesgloseTiempo } from '@/lib/contador';
import { useIsMounted } from '@/lib/useIsMounted';

export interface Pagina2ProvisoriaProps {
  fechaAceptado: string | null;
  serverNow: number;
}

export function Pagina2Provisoria({ fechaAceptado, serverNow }: Pagina2ProvisoriaProps) {
  const mounted = useIsMounted();
  const [clockOffset] = useState(() => serverNow - Date.now());
  const [desglose, setDesglose] = useState<DesgloseTiempo | null>(null);

  useEffect(() => {
    if (!fechaAceptado || !mounted) return;

    function calcular() {
      const targetMs = new Date(fechaAceptado!).getTime();
      const currentServerTime = Date.now() + clockOffset;
      const diff = currentServerTime - targetMs;
      setDesglose(desglosar(diff));
    }

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fechaAceptado, clockOffset, mounted]);

  return (
    <main className="h-dvh flex items-center justify-center p-6 bg-neutral-950 text-neutral-100 select-none">
      <div className="flex flex-col items-center text-center">
        {!mounted || !fechaAceptado ? (
          <span className="text-3xl font-light text-neutral-500">—</span>
        ) : desglose ? (
          <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-100">
                {desglose.dias}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">días</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-100">
                {String(desglose.horas).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">hs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-100">
                {String(desglose.minutos).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">min</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-100">
                {String(desglose.segundos).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">seg</span>
            </div>
          </div>
        ) : (
          <span className="text-3xl font-light text-neutral-500">—</span>
        )}
      </div>
    </main>
  );
}
