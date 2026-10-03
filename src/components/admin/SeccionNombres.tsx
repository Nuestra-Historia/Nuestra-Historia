'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SeccionNombresProps {
  initialNombreA: string | null;
  initialNombreB: string | null;
}

export function SeccionNombres({
  initialNombreA,
  initialNombreB,
}: SeccionNombresProps) {
  const router = useRouter();
  const [nombreA, setNombreA] = useState(initialNombreA || 'Agos');
  const [nombreB, setNombreB] = useState(initialNombreB || 'Nico');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setLoading(true);

    try {
      const res = await fetch('/api/o/nombres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_a: nombreA.trim(),
          nombre_b: nombreB.trim(),
        }),
      });

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: 'Error al guardar nombres' });
        return;
      }

      setMensaje({ tipo: 'ok', texto: 'Nombres actualizados correctamente' });
      router.refresh();
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Nombres</h3>
      <p className="text-xs text-neutral-500">
        Nombres utilizados en las apuestas y contenido de la Página 2.
      </p>

      <form onSubmit={handleGuardar} className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nombre A
            </label>
            <input
              type="text"
              maxLength={30}
              required
              value={nombreA}
              onChange={(e) => setNombreA(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nombre B
            </label>
            <input
              type="text"
              maxLength={30}
              required
              value={nombreB}
              onChange={(e) => setNombreB(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="py-1.5 px-3 rounded text-xs bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar nombres'}
          </button>
        </div>
      </form>

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
