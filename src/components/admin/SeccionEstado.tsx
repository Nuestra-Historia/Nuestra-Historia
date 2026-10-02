'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DobleConfirmacionBoton } from './DobleConfirmacionBoton';

interface SeccionEstadoProps {
  estadoActual: 'preguntando' | 'aceptado' | 'apagado';
}

export function SeccionEstado({ estadoActual }: SeccionEstadoProps) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [error, setError] = useState<string | null>(null);

  async function handleCambiarEstado(nuevoEstado: 'preguntando' | 'aceptado' | 'apagado') {
    setError(null);
    try {
      const res = await fetch('/api/o/estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        setError('Error al cambiar de estado');
        return;
      }

      setEstado(nuevoEstado);
      router.refresh();
    } catch {
      setError('Error de conexión');
    }
  }

  const badgeColors = {
    preguntando: 'bg-amber-100 text-amber-800 border-amber-200',
    aceptado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    apagado: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">Estado del sitio</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeColors[estado]}`}>
          {estado}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <DobleConfirmacionBoton
          label="Aceptó"
          onConfirm={() => handleCambiarEstado('aceptado')}
          className="py-1.5 px-3 rounded text-xs bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-emerald-900 text-white transition-colors animate-pulse"
        />

        <DobleConfirmacionBoton
          label="Volver a preguntando"
          onConfirm={() => handleCambiarEstado('preguntando')}
          className="py-1.5 px-3 rounded text-xs bg-neutral-700 text-white hover:bg-neutral-800 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-amber-700 text-white transition-colors animate-pulse"
        />

        <DobleConfirmacionBoton
          label="Apagar sitio"
          onConfirm={() => handleCambiarEstado('apagado')}
          className="py-1.5 px-3 rounded text-xs bg-rose-700 text-white hover:bg-rose-800 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-rose-900 text-white transition-colors animate-pulse"
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
