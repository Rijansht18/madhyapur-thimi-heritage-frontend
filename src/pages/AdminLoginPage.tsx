import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, user, init, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(identifier, password);
      navigate('/admin', { replace: true });
    } catch {
      // error is in store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-heritage-cream px-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-2xl text-heritage-maroon mb-1">
          Admin Login
        </h1>
        <p className="text-xs text-gray-500 mb-5">
          Madhyapur Thimi Heritage Tour
        </p>

        <label className="block mb-3">
          <span className="text-xs text-gray-600">Email or Username</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoFocus
            autoComplete="username"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            placeholder="super@mth.local"
          />
        </label>

        <label className="block mb-3">
          <span className="text-xs text-gray-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded px-2 py-1">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !identifier || !password}
          className="w-full bg-heritage-maroon text-white py-2 rounded text-sm disabled:opacity-50 hover:bg-heritage-maroon/90"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-gray-500 hover:underline">
            ← Back to site
          </Link>
        </div>
      </form>
    </div>
  );
}