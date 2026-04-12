import { useState, useEffect } from 'react';

const STORAGE_KEY = 'battleship-editor-auth';
const PIN = import.meta.env.VITE_EDITOR_PIN as string | undefined;

function isAuthenticated(): boolean {
  if (!PIN) return true; // No PIN set → open access (dev mode)
  return localStorage.getItem(STORAGE_KEY) === PIN;
}

interface EditorGuardProps {
  children: React.ReactNode;
}

export function EditorGuard({ children }: EditorGuardProps) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  if (authed) return <>{children}</>;

  const handleSubmit = () => {
    if (input === PIN) {
      localStorage.setItem(STORAGE_KEY, PIN);
      setAuthed(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-1">Редактор режимов</h2>
        <p className="text-slate-400 text-sm mb-6">Введите PIN-код для доступа</p>

        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className={`w-full bg-slate-700 border-2 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest focus:outline-none transition-colors ${
            error ? 'border-red-500 animate-pulse' : 'border-slate-600 focus:border-indigo-500'
          }`}
          placeholder="••••"
          autoFocus
        />

        {error && (
          <p className="text-red-400 text-sm mt-2">Неверный PIN</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!input}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Войти
        </button>
      </div>
    </div>
  );
}
