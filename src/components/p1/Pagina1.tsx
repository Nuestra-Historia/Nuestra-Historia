'use client';

import { useState, useCallback, useRef } from 'react';
import type { PanelOcultoProps } from './PanelOculto';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [clockOffset, setClockOffset] = useState(() => serverNow - Date.now());
  const [PanelComponent, setPanelComponent] = useState<React.ComponentType<PanelOcultoProps> | null>(null);

  const handleServerTime = useCallback((serverTimeMs: number) => {
    setClockOffset(serverTimeMs - Date.now());
  }, []);

  const { isFadingOut, checkNow } = usePollEstado({
    preview,
    onServerTime: handleServerTime,
  });

  const handleOpenPanel = useCallback(async () => {
    if (preview) return;
    try {
      const mod = await import('./PanelOculto');
      setPanelComponent(() => mod.default);
    } catch {
      // Ignorar en silencio
    }
  }, [preview]);

  const handleClosePanel = useCallback(() => {
    setPanelComponent(null);
  }, []);

  return (
    <div
      ref={containerRef}
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
      <SeccionFinal
        preview={preview}
        onOpenPanel={handleOpenPanel}
        containerRef={containerRef}
      />
      {PanelComponent && (
        <PanelComponent
          onClose={handleClosePanel}
          onAction1Success={() => {
            handleClosePanel();
            checkNow();
          }}
        />
      )}
    </div>
  );
}
