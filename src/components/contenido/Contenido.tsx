'use client';

import { useState, useCallback, useEffect } from 'react';
import { SubidaFotos } from './SubidaFotos';
import { ListaFotos } from './ListaFotos';
import { Apuestas } from './Apuestas';
import type { FotoItem } from './FotoCard';

interface ContenidoProps {
  nombreA: string;
  nombreB: string;
}

export function Contenido({ nombreA, nombreB }: ContenidoProps) {
  const [tab, setTab] = useState<'fotos' | 'apuestas'>('fotos');
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(true);

  const cargarFotos = useCallback(async () => {
    try {
      const res = await fetch('/api/s/fotos');
      if (!res.ok) return;
      const data = await res.json();
      setFotos(data);
    } catch {
      // silent
    } finally {
      setLoadingFotos(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/s/fotos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (mounted) {
          setFotos(data);
          setLoadingFotos(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadingFotos(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab('fotos')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'fotos'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Fotos
        </button>
        <button
          type="button"
          onClick={() => setTab('apuestas')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'apuestas'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Apuestas
        </button>
      </div>

      {/* Content */}
      {tab === 'fotos' && (
        <div className="flex flex-col gap-6">
          <SubidaFotos onSubidaExitosa={cargarFotos} />
          <ListaFotos
            fotos={fotos}
            onActualizar={cargarFotos}
            loading={loadingFotos}
          />
        </div>
      )}

      {tab === 'apuestas' && (
        <Apuestas nombreA={nombreA} nombreB={nombreB} />
      )}
    </div>
  );
}
