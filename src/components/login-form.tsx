'use client';

import { useState } from 'react';

interface LoginFormProps {
  scope: 'o' | 's';
}

export function LoginForm({ scope }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/a/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scope, password }),
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.error || 'Credenciales inválidas');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xs mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="password" className="sr-only">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 bg-white"
          required
        />
        {error && (
          <p className="text-xs text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

