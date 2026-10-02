'use client';

import { useState } from 'react';
import { DobleConfirmacionBoton } from './DobleConfirmacionBoton';

export interface FraseItemData {
  id: string;
  orden: number;
  texto: string;
}

interface SeccionFrasesProps {
  frasesIniciales: FraseItemData[];
}

export function SeccionFrases({ frasesIniciales }: SeccionFrasesProps) {
  const [frases, setFrases] = useState<FraseItemData[]>(frasesIniciales);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoTexto.trim() || loading) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/o/frases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nuevoTexto.trim() }),
      });

      if (!res.ok) {
        setError('Error al crear frase');
        return;
      }

      const creada: FraseItemData = await res.json();
      setFrases((prev) => [...prev, creada]);
      setNuevoTexto('');
    } catch {
      setError('Error de conexión al crear frase');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarEdicion(id: string) {
    if (!textoEdicion.trim() || loading) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/o/frases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoEdicion.trim() }),
      });

      if (!res.ok) {
        setError('Error al editar frase');
        return;
      }

      setFrases((prev) =>
        prev.map((f) => (f.id === id ? { ...f, texto: textoEdicion.trim() } : f))
      );
      setEditandoId(null);
      setTextoEdicion('');
    } catch {
      setError('Error de conexión al editar frase');
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrar(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/o/frases/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('Error al eliminar frase');
        return;
      }

      setFrases((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError('Error de conexión al eliminar frase');
    }
  }

  async function handleMover(index: number, direccion: 'arriba' | 'abajo') {
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (nuevoIndex < 0 || nuevoIndex >= frases.length) return;

    const nuevas = [...frases];
    const temp = nuevas[index];
    nuevas[index] = nuevas[nuevoIndex];
    nuevas[nuevoIndex] = temp;

    setFrases(nuevas);

    try {
      const ids = nuevas.map((f) => f.id);
      await fetch('/api/o/frases/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch {
      setError('Error de conexión al reordenar');
    }
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">
          Frases ({frases.length})
        </h3>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Formulario de creación */}
      <form onSubmit={handleCrear} className="flex flex-col gap-2">
        <label htmlFor="nueva_frase" className="text-xs text-neutral-600 font-medium">
          Nueva frase (máx. 500 caracteres)
        </label>
        <textarea
          id="nueva_frase"
          value={nuevoTexto}
          maxLength={500}
          rows={2}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Escribí una frase..."
          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            {nuevoTexto.length}/500
          </span>
          <button
            type="submit"
            disabled={loading || !nuevoTexto.trim()}
            className="py-1.5 px-3 bg-neutral-900 text-white rounded text-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Agregando...' : 'Agregar frase'}
          </button>
        </div>
      </form>

      {/* Lista de frases */}
      <div className="flex flex-col gap-2">
        {frases.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">
            No hay frases creadas.
          </p>
        ) : (
          frases.map((frase, index) => {
            const isEditing = editandoId === frase.id;

            return (
              <div
                key={frase.id}
                className="p-3 border border-neutral-200 rounded bg-neutral-50 flex flex-col gap-2 text-xs"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={textoEdicion}
                      maxLength={500}
                      rows={2}
                      onChange={(e) => setTextoEdicion(e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(null);
                          setTextoEdicion('');
                        }}
                        className="py-1 px-2.5 border border-neutral-300 rounded text-[11px] text-neutral-600 hover:bg-neutral-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuardarEdicion(frase.id)}
                        disabled={loading || !textoEdicion.trim()}
                        className="py-1 px-2.5 bg-neutral-900 text-white rounded text-[11px] hover:bg-neutral-800"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-neutral-800 leading-relaxed font-normal">
                      {frase.texto}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-neutral-500">
                      <span className="text-[11px] font-mono text-neutral-400">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMover(index, 'arriba')}
                          className="p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                          title="Subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === frases.length - 1}
                          onClick={() => handleMover(index, 'abajo')}
                          className="p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                          title="Bajar"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoId(frase.id);
                            setTextoEdicion(frase.texto);
                          }}
                          className="py-0.5 px-2 rounded border border-neutral-300 text-[11px] text-neutral-700 hover:bg-white"
                        >
                          Editar
                        </button>
                        <DobleConfirmacionBoton
                          label="Borrar"
                          confirmLabel="¿Eliminar?"
                          onConfirm={() => handleBorrar(frase.id)}
                          className="py-0.5 px-2 rounded border border-red-200 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                          confirmClassName="py-0.5 px-2 rounded bg-red-600 text-white text-[11px] transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
