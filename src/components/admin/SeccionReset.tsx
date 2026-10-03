'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DobleConfirmacionBoton } from './DobleConfirmacionBoton';

export function SeccionReset() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function handleReset(tipo: 'frases' | 'fotos' | 'apuestas') {
    setMensaje(null);
    try {
      const res = await fetch('/api/o/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      });

      if (res.status === 409) {
        setMensaje({
          tipo: 'error',
          texto: 'Acción bloqueada: no se pueden reiniciar datos en estado aceptado',
        });
        return;
      }

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: `Error al reiniciar ${tipo}` });
        return;
      }

      const nombres = {
        frases: 'Todas las frases fueron eliminadas',
        fotos: 'Todas las fotos fueron eliminadas',
        apuestas: 'Todas las apuestas fueron eliminadas',
      };
      setMensaje({ tipo: 'ok', texto: nombres[tipo] });
      router.refresh();
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Datos de prueba</h3>
      <p className="text-xs text-neutral-500">
        Acciones para limpiar datos cargados. Bloqueadas en estado aceptado.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        <DobleConfirmacionBoton
          label="Borrar todas las frases"
          confirmLabel="¿Borrar frases?"
          onConfirm={() => handleReset('frases')}
          className="py-1.5 px-3 rounded text-xs border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-red-600 text-white transition-colors animate-pulse"
        />

        <DobleConfirmacionBoton
          label="Borrar todas las fotos"
          confirmLabel="¿Borrar fotos?"
          onConfirm={() => handleReset('fotos')}
          className="py-1.5 px-3 rounded text-xs border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          confirmClassName="py-1.5 px-3 rounded text-xs bg-red-600 text-white transition-colors animate-pulse"
        />

        <DobleConfirmacionBoton
          label="Borrar todas las apuestas"
          confirmLabel="¿Borrar apuestas?"
          onConfirm={() => handleReset('apuestas')}
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
