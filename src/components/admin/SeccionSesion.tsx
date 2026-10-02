'use client';

import { LogoutButton } from '@/components/logout-button';
import { DobleConfirmacionBoton } from './DobleConfirmacionBoton';

interface SeccionSesionProps {
  fechaExp: string;
}

export function SeccionSesion({ fechaExp }: SeccionSesionProps) {
  async function handleCerrarTodas() {
    try {
      await fetch('/api/o/sesiones/cerrar-todas', {
        method: 'POST',
      });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Sesión</h3>
      <div className="flex flex-col gap-1 text-xs">
        <p className="text-neutral-500">
          Sesión activa hasta:{' '}
          <span className="font-medium text-neutral-800">{fechaExp}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <LogoutButton />
        <DobleConfirmacionBoton
          label="Cerrar todas las sesiones"
          confirmLabel="¿Cerrar todas?"
          onConfirm={handleCerrarTodas}
          className="py-1.5 px-3 rounded text-xs border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-red-600 text-white transition-colors animate-pulse"
        />
      </div>
    </div>
  );
}
