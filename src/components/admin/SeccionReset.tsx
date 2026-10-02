'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DobleConfirmacionBoton } from './DobleConfirmacionBoton';

export function SeccionReset() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function handleResetFrases() {
    setMensaje(null);
    try {
      const res = await fetch('/api/o/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'frases' }),
      });

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: 'Error al reiniciar frases' });
        return;
      }

      setMensaje({ tipo: 'ok', texto: 'Todas las frases fueron eliminadas' });
      router.refresh();
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Datos de prueba</h3>
      <p className="text-xs text-neutral-500">
        Acciones para limpiar datos cargados durante desarrollo.
      </p>

      <div className="pt-1">
        <DobleConfirmacionBoton
          label="Borrar todas las frases"
          confirmLabel="¿Borrar todo?"
          onConfirm={handleResetFrases}
          className="py-1.5 px-3 rounded text-xs border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-red-600 text-white transition-colors animate-pulse"
        />
      </div>

      {mensaje && (
        <p
          className={`text-xs ${
            mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
