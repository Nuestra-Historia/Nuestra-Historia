'use client';

import { useState, useEffect, useCallback } from 'react';
import { DobleConfirmacionBoton } from '@/components/admin/DobleConfirmacionBoton';

interface Apuesta {
  id: string;
  titulo: string;
  apuesta_a: string | null;
  apuesta_b: string | null;
  premio: string | null;
  fecha: string | null;
  estado: 'pendiente' | 'resuelta';
  ganador: 'a' | 'b' | null;
  pagada: boolean;
  created_at: string;
}

interface ApuestasProps {
  nombreA: string;
  nombreB: string;
}

const estadoLabel: Record<string, { text: string; cls: string }> = {
  pendiente: { text: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  resuelta: { text: 'Resuelta', cls: 'bg-blue-100 text-blue-700' },
};

export function Apuestas({ nombreA, nombreB }: ApuestasProps) {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formApuestaA, setFormApuestaA] = useState('');
  const [formApuestaB, setFormApuestaB] = useState('');
  const [formPremio, setFormPremio] = useState('');
  const [formFecha, setFormFecha] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Confirm resolver state
  const [confirmResolve, setConfirmResolve] = useState<{ id: string; ganador: 'a' | 'b' } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/s/apuestas');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApuestas(data);
    } catch {
      setErrorMsg('Error al cargar apuestas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/s/apuestas')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setApuestas(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setErrorMsg('Error al cargar apuestas');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  function limpiarForm() {
    setEditandoId(null);
    setFormTitulo('');
    setFormApuestaA('');
    setFormApuestaB('');
    setFormPremio('');
    setFormFecha('');
    setFormError(null);
  }

  function iniciarEdicion(a: Apuesta) {
    setEditandoId(a.id);
    setFormTitulo(a.titulo);
    setFormApuestaA(a.apuesta_a || '');
    setFormApuestaB(a.apuesta_b || '');
    setFormPremio(a.premio || '');
    setFormFecha(a.fecha || '');
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setFormError('El título es obligatorio');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    const body = {
      titulo: formTitulo.trim(),
      apuesta_a: formApuestaA.trim() || null,
      apuesta_b: formApuestaB.trim() || null,
      premio: formPremio.trim() || null,
      fecha: formFecha || null,
    };

    try {
      const url = editandoId
        ? `/api/s/apuestas/${editandoId}`
        : '/api/s/apuestas';
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setFormError('Error al guardar la apuesta');
        return;
      }

      limpiarForm();
      await cargar();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleResolver(id: string, ganador: 'a' | 'b') {
    try {
      const res = await fetch(`/api/s/apuestas/${id}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ganador }),
      });

      if (res.status === 409) {
        setErrorMsg('Conflicto: la apuesta ya fue resuelta');
        await cargar();
        return;
      }

      if (!res.ok) throw new Error();
      setConfirmResolve(null);
      await cargar();
    } catch {
      setErrorMsg('Error al resolver apuesta');
    }
  }

  async function handleDeshacer(id: string) {
    try {
      const res = await fetch(`/api/s/apuestas/${id}/deshacer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setErrorMsg('Error al deshacer resolución');
    }
  }

  async function handlePagada(id: string, pagada: boolean) {
    try {
      const res = await fetch(`/api/s/apuestas/${id}/pagada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagada }),
      });

      if (res.status === 409) {
        setErrorMsg('La apuesta no está resuelta');
        await cargar();
        return;
      }

      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setErrorMsg('Error al actualizar pago');
    }
  }

  async function handleBorrar(id: string) {
    try {
      const res = await fetch(`/api/s/apuestas/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setErrorMsg('Error al borrar apuesta');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formulario */}
      <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-800 mb-3">
          {editandoId ? 'Editar apuesta' : 'Nueva apuesta'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formTitulo}
              onChange={(e) => setFormTitulo(e.target.value)}
              maxLength={200}
              required
              className="w-full p-2 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
              placeholder="Ej: Quién cocina el domingo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Apuesta {nombreA}
              </label>
              <input
                type="text"
                value={formApuestaA}
                onChange={(e) => setFormApuestaA(e.target.value)}
                maxLength={300}
                className="w-full p-2 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
                placeholder="Qué apuesta..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Apuesta {nombreB}
              </label>
              <input
                type="text"
                value={formApuestaB}
                onChange={(e) => setFormApuestaB(e.target.value)}
                maxLength={300}
                className="w-full p-2 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
                placeholder="Qué apuesta..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Premio
              </label>
              <input
                type="text"
                value={formPremio}
                onChange={(e) => setFormPremio(e.target.value)}
                maxLength={200}
                className="w-full p-2 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
                placeholder="Ej: Cena para dos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-red-600 text-xs">{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={formLoading}
              className="py-1.5 px-3 bg-neutral-900 text-white rounded text-xs hover:bg-neutral-800 disabled:opacity-50"
            >
              {formLoading ? '...' : editandoId ? 'Guardar cambios' : 'Crear apuesta'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={limpiarForm}
                className="py-1.5 px-3 bg-neutral-200 text-neutral-700 rounded text-xs hover:bg-neutral-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error global */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-neutral-800">
          Apuestas ({apuestas.length})
        </h3>

        {loading && (
          <p className="text-xs text-neutral-500 italic">Cargando...</p>
        )}

        {!loading && apuestas.length === 0 && (
          <p className="text-xs text-neutral-400 italic py-4 text-center bg-neutral-50 rounded border border-dashed border-neutral-200">
            No hay apuestas todavía.
          </p>
        )}

        {apuestas.map((a) => {
          const badge = estadoLabel[a.estado] || estadoLabel.pendiente;
          return (
            <div
              key={a.id}
              className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-neutral-800">{a.titulo}</h4>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}>
                      {badge.text}
                    </span>
                    {a.pagada && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Pagada
                      </span>
                    )}
                  </div>

                  {(a.apuesta_a || a.apuesta_b) && (
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-neutral-600">
                      {a.apuesta_a && (
                        <span>
                          <strong className="text-neutral-500">{nombreA}:</strong> {a.apuesta_a}
                        </span>
                      )}
                      {a.apuesta_b && (
                        <span>
                          <strong className="text-neutral-500">{nombreB}:</strong> {a.apuesta_b}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-400">
                    {a.premio && <span>Premio: {a.premio}</span>}
                    {a.fecha && <span>{a.fecha}</span>}
                    {a.estado === 'resuelta' && a.ganador && (
                      <span className="text-blue-600 font-medium">
                        Ganó: {a.ganador === 'a' ? nombreA : nombreB}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation dialog for resolver */}
              {confirmResolve?.id === a.id && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs flex flex-col gap-2">
                  <p className="font-medium text-amber-800">
                    ¿Confirmar que ganó {confirmResolve.ganador === 'a' ? nombreA : nombreB}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolver(a.id, confirmResolve.ganador)}
                      className="py-1 px-2.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                    >
                      Sí, confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResolve(null)}
                      className="py-1 px-2.5 bg-neutral-200 text-neutral-700 rounded text-xs hover:bg-neutral-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs">
                {a.estado === 'pendiente' && confirmResolve?.id !== a.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmResolve({ id: a.id, ganador: 'a' })}
                      className="py-1 px-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      Ganó {nombreA}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResolve({ id: a.id, ganador: 'b' })}
                      className="py-1 px-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      Ganó {nombreB}
                    </button>
                  </>
                )}

                {a.estado === 'resuelta' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeshacer(a.id)}
                      className="py-1 px-2.5 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
                    >
                      Deshacer
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePagada(a.id, !a.pagada)}
                      className={`py-1 px-2.5 rounded ${
                        a.pagada
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {a.pagada ? 'Marcar como no pagada' : 'Marcar como pagada'}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => iniciarEdicion(a)}
                  className="py-1 px-2 text-neutral-600 hover:text-neutral-900"
                >
                  Editar
                </button>

                <DobleConfirmacionBoton
                  label="Borrar"
                  confirmLabel="¿Borrar?"
                  onConfirm={() => handleBorrar(a.id)}
                  className="py-1 px-2 rounded text-xs border border-red-200 text-red-600 hover:bg-red-50"
                  confirmClassName="py-1 px-2 rounded text-xs bg-red-600 text-white"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
