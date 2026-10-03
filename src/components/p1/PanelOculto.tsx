'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface PanelOcultoProps {
  onClose: () => void;
  onAction1Success: () => void;
}

export default function PanelOculto({ onClose, onAction1Success }: PanelOcultoProps) {
  const [armed, setArmed] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearArmedTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearArmedTimer();
    };
  }, [clearArmedTimer]);

  const handleClose = () => {
    if (loading) return;
    clearArmedTimer();
    onClose();
  };

  const executeAction = async (action: 1 | 2) => {
    setLoading(true);
    try {
      const res = await fetch('/api/p/set', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ a: action }),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok === true) {
          if (action === 1) {
            onAction1Success();
            return;
          } else {
            window.location.reload();
            return;
          }
        }
      }
      onClose();
    } catch {
      onClose();
    }
  };

  const handleButtonClick = (num: 1 | 2) => {
    if (loading) return;

    if (armed !== num) {
      clearArmedTimer();
      setArmed(num);
      timerRef.current = setTimeout(() => {
        setArmed(null);
        timerRef.current = null;
      }, 3000);
    } else {
      clearArmedTimer();
      executeAction(num);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm select-none"
      onClick={(e) => {
        // Bloquear toques al contenido de abajo; si toca el fondo, cerrar
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <button
        type="button"
        onClick={handleClose}
        disabled={loading}
        className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-100 text-3xl font-light p-4 focus:outline-none disabled:opacity-50"
      >
        ×
      </button>

      <div className="flex items-center gap-6">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleButtonClick(1)}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-100 text-3xl font-light flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        >
          {armed === 1 ? '1?' : '1'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleButtonClick(2)}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-100 text-3xl font-light flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        >
          {armed === 2 ? '2?' : '2'}
        </button>
      </div>
    </div>
  );
}
