'use client';

import { useState, useCallback } from 'react';
import { Contadores } from './Contadores';
import { Frases } from './Frases';
import { SeccionFinal } from './SeccionFinal';
import { usePollEstado } from './usePollEstado';

export interface Pagina1Props {
  fechaHablar: string | null;
  fechaPareja: string | null;
  frases: string[];
  serverNow: number;
  preview?: boolean;
}

export function Pagina1({
  fechaHablar,
  fechaPareja,
  frases,
  serverNow,
  preview = false,
}: Pagina1Props) {
  const [clockOffset, setClockOffset] = useState(() => serverNow - Date.now());

  const handleServerTime = useCallback((serverTimeMs: number) => {
    setClockOffset(serverTimeMs - Date.now());
  }, []);

  const { isFadingOut } = usePollEstado({
    preview,
    onServerTime: handleServerTime,
  });

  return (
    <div
      className={`h-dvh overflow-y-scroll snap-y snap-mandatory bg-neutral-950 text-neutral-100 transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Contadores
        fechaHablar={fechaHablar}
        fechaPareja={fechaPareja}
        clockOffset={clockOffset}
      />
      <Frases frases={frases} />
      <SeccionFinal />
    </div>
  );
}
