'use client';

import { useState, useEffect } from 'react';
import { desglosar, DesgloseTiempo } from '@/lib/contador';
import { useIsMounted } from '@/lib/useIsMounted';
import { copyP1 } from './copy';

interface ContadoresProps {
  fechaHablar: string | null;
  fechaPareja: string | null;
  clockOffset: number;
}

function ContadorItem({
  titulo,
  fechaIso,
  clockOffset,
  mounted,
}: {
  titulo: string;
  fechaIso: string | null;
  clockOffset: number;
  mounted: boolean;
}) {
  const [desglose, setDesglose] = useState<DesgloseTiempo | null>(null);

  useEffect(() => {
    if (!fechaIso || !mounted) return;

    function calcular() {
      const targetMs = new Date(fechaIso!).getTime();
      const currentServerTime = Date.now() + clockOffset;
      const diff = currentServerTime - targetMs;
      setDesglose(desglosar(diff));
    }

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fechaIso, clockOffset, mounted]);

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-sm font-light tracking-wide text-neutral-400 mb-3">{titulo}</h2>
      {!mounted || !fechaIso ? (
        <span className="text-2xl font-light text-neutral-500">—</span>
      ) : desglose ? (
        <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-100">
              {desglose.dias}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">días</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-100">
              {String(desglose.horas).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">hs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-100">
              {String(desglose.minutos).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">min</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-100">
              {String(desglose.segundos).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">seg</span>
          </div>
        </div>
      ) : (
        <span className="text-2xl font-light text-neutral-500">—</span>
      )}
    </div>
  );
}

export function Contadores({ fechaHablar, fechaPareja, clockOffset }: ContadoresProps) {
  const mounted = useIsMounted();

  return (
    <section className="h-dvh snap-start flex flex-col items-center justify-center p-6 bg-neutral-950 text-neutral-100 select-none">
      <div className="flex flex-col gap-10 w-full max-w-md">
        <ContadorItem
          titulo={copyP1.contadorHablar}
          fechaIso={fechaHablar}
          clockOffset={clockOffset}
          mounted={mounted}
        />
        <div className="w-12 h-px bg-neutral-800 self-center" />
        <ContadorItem
          titulo={copyP1.contadorPareja}
          fechaIso={fechaPareja}
          clockOffset={clockOffset}
          mounted={mounted}
        />
      </div>
    </section>
  );
}
