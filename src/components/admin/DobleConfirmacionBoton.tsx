'use client';

import { useState, useEffect, useRef } from 'react';

interface DobleConfirmacionBotonProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  confirmClassName?: string;
  disabled?: boolean;
}

export function DobleConfirmacionBoton({
  label,
  confirmLabel = 'Confirmar',
  onConfirm,
  className = 'py-1.5 px-3 rounded text-xs bg-neutral-900 text-white hover:bg-neutral-800 transition-colors',
  confirmClassName = 'py-1.5 px-3 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors animate-pulse',
  disabled = false,
}: DobleConfirmacionBotonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleClick() {
    if (disabled || loading) return;

    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => {
        setConfirming(false);
      }, 3000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setConfirming(false);
      setLoading(true);
      try {
        await onConfirm();
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={confirming ? confirmClassName : className}
    >
      {loading ? '...' : confirming ? confirmLabel : label}
    </button>
  );
}
