'use client';

import { useState } from 'react';
import { isoToBuenosAiresInput, buenosAiresInputToIso, isDateInFuture } from '@/lib/fechas';

interface SeccionFechasProps {
  fechaHablarIso: string | null;
  fechaParejaIso: string | null;
  fechaAceptadoIso: string | null;
}

export function SeccionFechas({
  fechaHablarIso,
  fechaParejaIso,
  fechaAceptadoIso,
}: SeccionFechasProps) {
  const [fechaHablar, setFechaHablar] = useState(() => isoToBuenosAiresInput(fechaHablarIso));
  const [fechaPareja, setFechaPareja] = useState(() => isoToBuenosAiresInput(fechaParejaIso));
  const [fechaAceptado, setFechaAceptado] = useState(() => isoToBuenosAiresInput(fechaAceptadoIso));
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    const isoHablar = buenosAiresInputToIso(fechaHablar);
    const isoPareja = buenosAiresInputToIso(fechaPareja);
    const isoAceptado = buenosAiresInputToIso(fechaAceptado);

    // Validación en el cliente de no futuro para hablar y pareja
    if (isoHablar && isDateInFuture(isoHablar)) {
      setMensaje({ tipo: 'error', texto: 'La fecha de empezar a hablar no puede estar en el futuro' });
      return;
    }

    if (isoPareja && isDateInFuture(isoPareja)) {
      setMensaje({ tipo: 'error', texto: 'La fecha de pareja no puede estar en el futuro' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/o/fechas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_hablar: isoHablar,
          fecha_pareja: isoPareja,
          fecha_aceptado: isoAceptado,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMensaje({ tipo: 'error', texto: data?.error || 'Error al guardar fechas' });
        return;
      }

      setMensaje({ tipo: 'ok', texto: 'Fechas actualizadas correctamente' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de red al guardar fechas' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Fechas (Buenos Aires, UTC-3)</h3>

      <form onSubmit={handleGuardar} className="flex flex-col gap-3 text-xs">
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_hablar" className="text-neutral-600 font-medium">
            Empezamos a hablar
          </label>
          <input
            id="fecha_hablar"
            type="datetime-local"
            value={fechaHablar}
            onChange={(e) => setFechaHablar(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-300 rounded text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_pareja" className="text-neutral-600 font-medium">
            Somos algo más que amigos
          </label>
          <input
            id="fecha_pareja"
            type="datetime-local"
            value={fechaPareja}
            onChange={(e) => setFechaPareja(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-300 rounded text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_aceptado" className="text-neutral-600 font-medium">
            Fecha de aceptación
          </label>
          <input
            id="fecha_aceptado"
            type="datetime-local"
            value={fechaAceptado}
            onChange={(e) => setFechaAceptado(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-300 rounded text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        {mensaje && (
          <p
            className={`text-xs mt-1 ${
              mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start py-1.5 px-4 bg-neutral-900 text-white rounded text-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors mt-1"
        >
          {loading ? 'Guardando...' : 'Guardar fechas'}
        </button>
      </form>
    </div>
  );
}
