'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/a/logout', {
        method: 'POST',
      });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="py-1.5 px-3 border border-neutral-300 text-neutral-700 text-xs rounded hover:bg-neutral-100 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Cerrar sesión'}
    </button>
  );
}

