'use client';

import { useState, useRef } from 'react';
import { procesarImagen } from '@/lib/imagen-cliente';

export interface TareaSubida {
  id: string;
  file: File;
  estado: 'procesando' | 'subiendo' | 'registrando' | 'listo' | 'error';
  errorMensaje?: string;
}

interface SubidaFotosProps {
  tipoPorDefecto?: 'tira_a' | 'tira_b' | 'momento';
  onSubidaExitosa: () => void;
}

export function SubidaFotos({
  tipoPorDefecto = 'tira_a',
  onSubidaExitosa,
}: SubidaFotosProps) {
  const [tipo, setTipo] = useState<'tira_a' | 'tira_b' | 'momento'>(tipoPorDefecto);
  const [tareas, setTareas] = useState<TareaSubida[]>([]);
  const [enProgreso, setEnProgreso] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ejecutar cola con concurrencia máxima 2
  async function procesarCola(tareasAProcesar: TareaSubida[], tipoDestino: 'tira_a' | 'tira_b' | 'momento') {
    setEnProgreso(true);

    const ejecutarTarea = async (tarea: TareaSubida) => {
      // 1. Procesar imagen en cliente
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tarea.id ? { ...t, estado: 'procesando', errorMensaje: undefined } : t
        )
      );

      let imagenProcesada;
      try {
        imagenProcesada = await procesarImagen(tarea.file);
      } catch (err) {
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tarea.id
              ? {
                  ...t,
                  estado: 'error',
                  errorMensaje:
                    err instanceof Error ? err.message : 'Error al procesar imagen',
                }
              : t
          )
        );
        return;
      }

      // 2. Obtener URLs prefirmadas
      setTareas((prev) =>
        prev.map((t) => (t.id === tarea.id ? { ...t, estado: 'subiendo' } : t))
      );

      let urlsData;
      try {
        const res = await fetch('/api/s/fotos/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formato: imagenProcesada.formato,
            fullBytes: imagenProcesada.full.size,
            thumbBytes: imagenProcesada.thumb.size,
          }),
        });

        if (res.status === 409) {
          throw new Error('Límite total de fotos alcanzado');
        }

        if (!res.ok) {
          throw new Error('Error al solicitar URL de subida');
        }

        urlsData = await res.json();
      } catch (err) {
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tarea.id
              ? {
                  ...t,
                  estado: 'error',
                  errorMensaje: err instanceof Error ? err.message : 'Error de subida',
                }
              : t
          )
        );
        return;
      }

      // 3. PUT directo a R2 (full y thumb)
      try {
        const [putFullRes, putThumbRes] = await Promise.all([
          fetch(urlsData.full.url, {
            method: 'PUT',
            headers: { 'Content-Type': urlsData.full.contentType },
            body: imagenProcesada.full,
          }),
          fetch(urlsData.thumb.url, {
            method: 'PUT',
            headers: { 'Content-Type': urlsData.thumb.contentType },
            body: imagenProcesada.thumb,
          }),
        ]);

        if (!putFullRes.ok || !putThumbRes.ok) {
          throw new Error('Fallo al subir archivo a R2');
        }
      } catch (err) {
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tarea.id
              ? {
                  ...t,
                  estado: 'error',
                  errorMensaje: err instanceof Error ? err.message : 'Fallo en la subida',
                }
              : t
          )
        );
        return;
      }

      // 4. Registrar en base de datos
      setTareas((prev) =>
        prev.map((t) => (t.id === tarea.id ? { ...t, estado: 'registrando' } : t))
      );

      try {
        const regRes = await fetch('/api/s/fotos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: urlsData.id,
            formato: imagenProcesada.formato,
            tipo: tipoDestino,
            ancho: imagenProcesada.ancho,
            alto: imagenProcesada.alto,
          }),
        });

        if (regRes.status === 409) {
          const errData = await regRes.json();
          throw new Error(errData.error || 'Límite de tira alcanzado');
        }

        if (!regRes.ok) {
          throw new Error('Error al registrar foto en la base de datos');
        }

        setTareas((prev) =>
          prev.map((t) => (t.id === tarea.id ? { ...t, estado: 'listo' } : t))
        );
        onSubidaExitosa();
      } catch (err) {
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tarea.id
              ? {
                  ...t,
                  estado: 'error',
                  errorMensaje: err instanceof Error ? err.message : 'Error al registrar',
                }
              : t
          )
        );
      }
    };

    // Concurrencia de 2 tareas simultáneas
    const pendientes = [...tareasAProcesar];
    const trabajadores: Promise<void>[] = [];

    async function trabajador() {
      while (pendientes.length > 0) {
        const tarea = pendientes.shift();
        if (tarea) {
          await ejecutarTarea(tarea);
        }
      }
    }

    trabajadores.push(trabajador());
    trabajadores.push(trabajador());

    await Promise.all(trabajadores);
    setEnProgreso(false);
  }

  function handleArchivosSeleccionados(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Máximo 20 por tanda
    const limitados = files.slice(0, 20);
    const nuevasTareas: TareaSubida[] = limitados.map((file) => ({
      id: crypto.randomUUID(),
      file,
      estado: 'procesando',
    }));

    setTareas((prev) => [...nuevasTareas, ...prev]);
    procesarCola(nuevasTareas, tipo);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function reintentarTarea(tarea: TareaSubida) {
    procesarCola([tarea], tipo);
  }

  function limpiarCompletadas() {
    setTareas((prev) => prev.filter((t) => t.estado !== 'listo'));
  }

  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Subir fotos</h3>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-600">Destino:</label>
          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as 'tira_a' | 'tira_b' | 'momento')
            }
            disabled={enProgreso}
            className="p-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-800 focus:outline-none"
          >
            <option value="tira_a">Tira A (carrusel 2)</option>
            <option value="tira_b">Tira B (carrusel 3)</option>
            <option value="momento">Momentos</option>
          </select>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={enProgreso}
            onChange={handleArchivosSeleccionados}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
          />
        </div>
      </div>

      <p className="text-[11px] text-neutral-400">
        Formatos soportados: JPG, PNG, WebP (máx. 20 fotos por tanda, 40 MB por archivo).
      </p>

      {tareas.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">
              Progreso ({tareas.filter((t) => t.estado === 'listo').length} / {tareas.length})
            </span>
            <button
              type="button"
              onClick={limpiarCompletadas}
              className="text-[11px] text-neutral-500 hover:text-neutral-800"
            >
              Limpiar completadas
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className="flex items-center justify-between text-xs p-2 rounded bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate max-w-[180px] font-mono text-[11px]">
                    {tarea.file.name}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    ({Math.round(tarea.file.size / 1024)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tarea.estado === 'procesando' && (
                    <span className="text-neutral-500 text-[11px]">Procesando...</span>
                  )}
                  {tarea.estado === 'subiendo' && (
                    <span className="text-blue-600 text-[11px]">Subiendo a R2...</span>
                  )}
                  {tarea.estado === 'registrando' && (
                    <span className="text-amber-600 text-[11px]">Registrando...</span>
                  )}
                  {tarea.estado === 'listo' && (
                    <span className="text-emerald-600 text-[11px] font-medium">✓ Listo</span>
                  )}
                  {tarea.estado === 'error' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-600 text-[11px]">
                        {tarea.errorMensaje || 'Error'}
                      </span>
                      <button
                        type="button"
                        onClick={() => reintentarTarea(tarea)}
                        className="py-0.5 px-1.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px]"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
