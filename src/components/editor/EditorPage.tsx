import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listCustomModes,
  createCustomMode,
  deleteCustomMode,
  CUSTOM_MODE_PREFIX,
  type CustomModeMeta,
} from '../../lib/editorStorage';
import { loadGameModes } from '../../utils/loadData';
import type { GameMode } from '../../types/game';

const COLOR_OPTIONS = [
  '#0891B2', '#8B5CF6', '#059669', '#DC2626',
  '#2563EB', '#F59E0B', '#7C3AED', '#EA580C',
  '#0D9488', '#B45309', '#DB2777', '#65A30D',
];

export function EditorPage() {
  const navigate = useNavigate();
  const [staticModes, setStaticModes] = useState<GameMode[]>([]);
  const [customModes, setCustomModes] = useState<CustomModeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newCols, setNewCols] = useState(10);
  const [newRows, setNewRows] = useState(10);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadGameModes(), listCustomModes()]).then(([sm, cm]) => {
      setStaticModes(sm);
      setCustomModes(cm);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createCustomMode({
        name: newName.trim(),
        description: newDesc.trim(),
        color: newColor,
        gridColumns: newCols,
        gridRows: newRows,
      });
      navigate(`/editor/${id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить режим "${name}"? Это действие нельзя отменить.`)) return;
    setDeletingId(id);
    await deleteCustomMode(id);
    setCustomModes((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            ← Главная
          </button>
          <h1 className="text-3xl font-bold text-white">Редактор режимов</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg"
          >
            + Создать режим
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-20 text-lg">Загрузка...</div>
        ) : (
          <>
            {/* Custom modes */}
            {customModes.length > 0 && (
              <section className="mb-8">
                <h2 className="text-slate-300 font-semibold uppercase text-xs tracking-widest mb-3">
                  Пользовательские режимы
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customModes.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: m.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{m.name}</p>
                          {m.description && (
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{m.description}</p>
                          )}
                          <p className="text-slate-500 text-xs mt-2">
                            {m.gridColumns}×{m.gridRows} клеток
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => navigate(`/editor/${m.id}`)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          disabled={deletingId === m.id}
                          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                          {deletingId === m.id ? '...' : '✕'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Static modes — read-only */}
            <section>
              <h2 className="text-slate-300 font-semibold uppercase text-xs tracking-widest mb-3">
                Встроенные режимы (только просмотр)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staticModes.filter((m) => !m.id.startsWith(CUSTOM_MODE_PREFIX)).map((m) => (
                  <div
                    key={m.id}
                    className="bg-white/5 rounded-2xl p-5 border border-white/10 opacity-70"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <div>
                        <p className="text-white font-semibold">{m.name}</p>
                        {m.description && (
                          <p className="text-slate-400 text-sm mt-1">{m.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Новый режим</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="Например: Новый год 2025"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">
                  Описание
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="Краткое описание режима"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Цвет
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-300 text-sm font-medium mb-1">
                    Столбцы
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={20}
                    value={newCols}
                    onChange={(e) => setNewCols(Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-300 text-sm font-medium mb-1">
                    Строки
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={15}
                    value={newRows}
                    onChange={(e) => setNewRows(Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
