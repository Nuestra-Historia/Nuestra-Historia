'use client';

import { useState } from 'react';
import { DobleConfirmacionBoton } from '@/components/admin/DobleConfirmacionBoton';

export interface FotoItem {
  id: string;
  tipo: 'tira_a' | 'tira_b' | 'momento';
  descripcion: string | null;
  fecha: string | null;
  orden: number;
  ancho: number;
  alto: number;
  thumbUrl: string;
}

interface FotoCardProps {
  foto: FotoItem;
  esPrimera: boolean;
  esUltima: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onActualizada: () => void;
}

export function FotoCard({
  foto,
  esPrimera,
  esUltima,
  onSubir,
  onBajar,
  onActualizada,
}: FotoCardProps) {
  const [editando, setEditando] = useState(false);
  const [descripcion, setDescripcion] = useState(foto.descripcion || '');
  const [fecha, setFecha] = useState(foto.fecha || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleMoverTipo(nuevoTipo: 'tira_a' | 'tira_b' | 'momento') {
    if (nuevoTipo === foto.tipo) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/s/fotos/${foto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: nuevoTipo }),
      });

      if (res.status === 409) {
        setErrorMsg('Límite de tira alcanzado (máx. 24)');
        return;
      }

      if (!res.ok) {
        setErrorMsg('Error al mover foto');
        return;
      }

      onActualizada();
    } catch {
      setErrorMsg('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/s/fotos/${foto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: descripcion.trim() || null,
          fecha: fecha || null,
        }),
      });

      if (!res.ok) {
        setErrorMsg('Error al guardar');
        return;
      }

      setEditando(false);
      onActualizada();
    } catch {
      setErrorMsg('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrar() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/s/fotos/${foto.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setErrorMsg('Error al borrar');
        return;
      }

      onActualizada();
    } catch {
      setErrorMsg('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 border border-neutral-200 rounded bg-white text-xs">
      <div className="w-24 h-24 shrink-0 bg-neutral-100 rounded overflow-hidden flex items-center justify-center border border-neutral-200 self-center sm:self-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.thumbUrl}
          alt={foto.descripcion || 'Miniatura'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between gap-2">
        {editando ? (
          <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-2">
            <div>
              <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={1000}
                rows={2}
                className="w-full p-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
                placeholder="Descripción opcional..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="p-1 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="py-1 px-2.5 bg-neutral-800 text-white rounded text-xs hover:bg-neutral-900 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="py-1 px-2.5 bg-neutral-200 text-neutral-700 rounded text-xs hover:bg-neutral-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px]">
              <span>{foto.ancho} × {foto.alto} px</span>
              {foto.fecha && <span>{foto.fecha}</span>}
            </div>
            {foto.descripcion ? (
              <p className="text-neutral-800 text-xs">{foto.descripcion}</p>
            ) : (
              <p className="text-neutral-400 italic text-[11px]">(Sin descripción)</p>
            )}
          </div>
        )}

        {errorMsg && <p className="text-red-600 text-[11px]">{errorMsg}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSubir}
              disabled={esPrimera || loading}
              className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 disabled:opacity-30"
              title="Subir orden"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onBajar}
              disabled={esUltima || loading}
              className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 disabled:opacity-30"
              title="Bajar orden"
            >
              ▼
            </button>

            <select
              value={foto.tipo}
              disabled={loading}
              onChange={(e) =>
                handleMoverTipo(
                  e.target.value as 'tira_a' | 'tira_b' | 'momento'
                )
              }
              className="p-1 border border-neutral-200 rounded text-[11px] bg-white text-neutral-700 focus:outline-none"
            >
              <option value="tira_a">Tira A</option>
              <option value="tira_b">Tira B</option>
              <option value="momento">Momento</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {!editando && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                disabled={loading}
                className="py-1 px-2 text-neutral-600 hover:text-neutral-900 text-xs"
              >
                Editar
              </button>
            )}

            <DobleConfirmacionBoton
              label="Borrar"
              confirmLabel="¿Borrar?"
              onConfirm={handleBorrar}
              className="py-1 px-2 rounded text-xs border border-red-200 text-red-600 hover:bg-red-50"
              confirmClassName="py-1 px-2 rounded text-xs bg-red-600 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
