'use client';

import { useState } from 'react';
import { FotoCard, FotoItem } from './FotoCard';

interface ListaFotosProps {
  fotos: FotoItem[];
  onActualizar: () => void;
  loading?: boolean;
}

export function ListaFotos({ fotos, onActualizar, loading }: ListaFotosProps) {
  const [reordering, setReordering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tiraA = fotos.filter((f) => f.tipo === 'tira_a');
  const tiraB = fotos.filter((f) => f.tipo === 'tira_b');
  const momentos = fotos.filter((f) => f.tipo === 'momento');

  async function handleReordenar(
    tipo: 'tira_a' | 'tira_b' | 'momento',
    currentIndex: number,
    direction: 'up' | 'down'
  ) {
    const list =
      tipo === 'tira_a'
        ? [...tiraA]
        : tipo === 'tira_b'
          ? [...tiraB]
          : [...momentos];

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    const ids = list.map((f) => f.id);
    setReordering(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/s/fotos/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, ids }),
      });

      if (!res.ok) {
        setErrorMsg('No se pudo guardar el nuevo orden.');
        return;
      }

      onActualizar();
    } catch {
      setErrorMsg('Error de red al intentar reordenar.');
    } finally {
      setReordering(false);
    }
  }

  function renderSeccion(
    titulo: string,
    subtitulo: string,
    tipo: 'tira_a' | 'tira_b' | 'momento',
    items: FotoItem[],
    limite?: number
  ) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">{titulo}</h3>
            <p className="text-xs text-neutral-500">{subtitulo}</p>
          </div>
          <span className="text-xs font-mono font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
            {limite ? `${items.length} / ${limite}` : `${items.length}`}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-4 text-center bg-neutral-50 rounded border border-dashed border-neutral-200">
            No hay fotos en esta sección.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((foto, index) => (
              <FotoCard
                key={foto.id}
                foto={foto}
                esPrimera={index === 0 || reordering}
                esUltima={index === items.length - 1 || reordering}
                onSubir={() => handleReordenar(tipo, index, 'up')}
                onBajar={() => handleReordenar(tipo, index, 'down')}
                onActualizada={onActualizar}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {errorMsg}
        </div>
      )}

      {loading && (
        <div className="text-xs text-neutral-500 italic">Cargando fotos...</div>
      )}

      <div className="text-xs text-neutral-500 flex justify-end">
        Total de fotos: {fotos.length} / 400
      </div>

      {renderSeccion(
        'Tira A (carrusel 2)',
        'Pasa por DEBAJO en la Página 2',
        'tira_a',
        tiraA,
        24
      )}

      {renderSeccion(
        'Tira B (carrusel 3)',
        'Pasa por ENCIMA en la Página 2',
        'tira_b',
        tiraB,
        24
      )}

      {renderSeccion(
        'Momentos destacados',
        'Momentos con descripción y fecha opcional',
        'momento',
        momentos
      )}
    </div>
  );
}
