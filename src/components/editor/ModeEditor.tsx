import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCustomMode,
  saveCustomMode,
  generateItemId,
  type CustomModeData,
  type CustomModeMeta,
  type EditorShip,
  type EditorBomb,
  type EditorQuestion,
} from '../../lib/editorStorage';
import { EditorGrid } from './EditorGrid';
import { QuestionEditor } from './QuestionEditor';

type Tab = 'field' | 'questions';

const EMPTY_MODE: CustomModeData = {
  meta: {
    id: '',
    name: '',
    description: '',
    color: '#0891B2',
    gridColumns: 10,
    gridRows: 10,
    createdAt: 0,
  },
  ships: {},
  bombs: {},
  questions: {},
};

export function ModeEditor() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();

  const [mode, setMode] = useState<CustomModeData>(EMPTY_MODE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('field');
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState<CustomModeMeta>(EMPTY_MODE.meta);

  useEffect(() => {
    if (!modeId) return;
    getCustomMode(modeId).then((data) => {
      if (data) {
        setMode(data);
      }
      setLoading(false);
    });
  }, [modeId]);

  const save = useCallback(async () => {
    if (!modeId) return;
    setSaving(true);
    try {
      await saveCustomMode(modeId, mode);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }, [modeId, mode]);

  // ─── Ship helpers ──────────────────────────────────────────────────────────

  const setShips = (ships: Record<string, EditorShip>) =>
    setMode((prev) => ({ ...prev, ships }));

  const setBombs = (bombs: Record<string, EditorBomb>) =>
    setMode((prev) => ({ ...prev, bombs }));

  const addShip = (name: string, size: number) => {
    const id = generateItemId('ship');
    const newShip: EditorShip = {
      id,
      name,
      cells: [],
      questionIds: Array(size).fill(''),
    };
    setMode((prev) => ({
      ...prev,
      ships: { ...prev.ships, [id]: newShip },
    }));
    return id;
  };

  const deleteShip = (shipId: string) => {
    setMode((prev) => {
      const ships = { ...prev.ships };
      delete ships[shipId];
      return { ...prev, ships };
    });
  };

  const addQuestion = () => {
    const id = generateItemId('q');
    const newQ: EditorQuestion = {
      id,
      category: '',
      type: 'text',
      difficulty: 'medium',
      points: 100,
      question: '',
      answer: '',
    };
    setMode((prev) => ({
      ...prev,
      questions: { ...prev.questions, [id]: newQ },
    }));
    return id;
  };

  const updateQuestion = (q: EditorQuestion) => {
    setMode((prev) => ({
      ...prev,
      questions: { ...prev.questions, [q.id]: q },
    }));
  };

  const deleteQuestion = (qId: string) => {
    setMode((prev) => {
      // Unlink from all ships
      const ships = Object.fromEntries(
        Object.entries(prev.ships).map(([sid, ship]) => [
          sid,
          {
            ...ship,
            questionIds: ship.questionIds.map((id) => (id === qId ? '' : id)),
          },
        ])
      );
      // Unlink from bombs
      const bombs = Object.fromEntries(
        Object.entries(prev.bombs).map(([bid, bomb]) => [
          bid,
          { ...bomb, questionId: bomb.questionId === qId ? '' : bomb.questionId },
        ])
      );
      const questions = { ...prev.questions };
      delete questions[qId];
      return { ...prev, ships, bombs, questions };
    });
  };

  // Link a question to a ship deck: sets ship.questionIds[deckIndex] = qId
  // and removes qId from any other place it was linked
  const linkQuestionToShipDeck = (qId: string, shipId: string, deckIndex: number) => {
    setMode((prev) => {
      const ships = Object.fromEntries(
        Object.entries(prev.ships).map(([sid, ship]) => {
          const ids = [...ship.questionIds];
          // Remove this question from current ship
          const clearIdx = ids.indexOf(qId);
          if (clearIdx !== -1) ids[clearIdx] = '';
          // Set it on the target ship/deck
          if (sid === shipId && deckIndex < ids.length) {
            // Clear whoever was in this deck before
            const prevQ = ids[deckIndex];
            ids[deckIndex] = qId;
            // Remove the displaced question from elsewhere (already done by unlink step above if same ship)
            // If prevQ was something else, it's now unlinked from this deck but may be elsewhere — fine
            void prevQ;
          }
          return [sid, { ...ship, questionIds: ids }];
        })
      );
      // Also unlink from bombs
      const bombs = Object.fromEntries(
        Object.entries(prev.bombs).map(([bid, bomb]) => [
          bid,
          { ...bomb, questionId: bomb.questionId === qId ? '' : bomb.questionId },
        ])
      );
      return { ...prev, ships, bombs };
    });
  };

  const linkQuestionToBomb = (qId: string, bombId: string) => {
    setMode((prev) => {
      // Remove from ships
      const ships = Object.fromEntries(
        Object.entries(prev.ships).map(([sid, ship]) => [
          sid,
          {
            ...ship,
            questionIds: ship.questionIds.map((id) => (id === qId ? '' : id)),
          },
        ])
      );
      // Remove from other bombs, set on target
      const bombs = Object.fromEntries(
        Object.entries(prev.bombs).map(([bid, bomb]) => [
          bid,
          {
            ...bomb,
            questionId:
              bid === bombId
                ? qId
                : bomb.questionId === qId
                ? ''
                : bomb.questionId,
          },
        ])
      );
      return { ...prev, ships, bombs };
    });
  };

  const unlinkQuestion = (qId: string) => {
    setMode((prev) => {
      const ships = Object.fromEntries(
        Object.entries(prev.ships).map(([sid, ship]) => [
          sid,
          {
            ...ship,
            questionIds: ship.questionIds.map((id) => (id === qId ? '' : id)),
          },
        ])
      );
      const bombs = Object.fromEntries(
        Object.entries(prev.bombs).map(([bid, bomb]) => [
          bid,
          { ...bomb, questionId: bomb.questionId === qId ? '' : bomb.questionId },
        ])
      );
      return { ...prev, ships, bombs };
    });
  };

  // ─── Meta edit ─────────────────────────────────────────────────────────────

  const openMetaEdit = () => {
    setMetaDraft({ ...mode.meta });
    setEditingMeta(true);
  };

  const saveMetaEdit = () => {
    setMode((prev) => ({ ...prev, meta: metaDraft }));
    setEditingMeta(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-lg">
        Загрузка режима...
      </div>
    );
  }

  const shipList = Object.values(mode.ships);
  const bombList = Object.values(mode.bombs);
  const questionList = Object.values(mode.questions);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/editor')}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Режимы
        </button>

        <button
          onClick={openMetaEdit}
          className="flex items-center gap-2 group"
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: mode.meta.color }}
          />
          <span className="text-white font-semibold group-hover:text-indigo-300 transition-colors">
            {mode.meta.name || 'Без названия'}
          </span>
          <span className="text-slate-500 text-xs">✎</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          {savedAt && !saving && (
            <span className="text-slate-500 text-xs">
              Сохранено {new Date(savedAt).toLocaleTimeString('ru')}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 flex gap-0">
        {(['field', 'questions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              tab === t
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {t === 'field' ? `🗺 Поле (${shipList.length} кораблей, ${bombList.length} бомб)` : `❓ Вопросы (${questionList.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === 'field' && (
          <EditorGrid
            ships={mode.ships}
            bombs={mode.bombs}
            questions={mode.questions}
            gridCols={mode.meta.gridColumns}
            gridRows={mode.meta.gridRows}
            onShipsChange={setShips}
            onBombsChange={setBombs}
            onAddShip={addShip}
            onDeleteShip={deleteShip}
          />
        )}
        {tab === 'questions' && (
          <QuestionEditor
            questions={mode.questions}
            ships={mode.ships}
            bombs={mode.bombs}
            onAddQuestion={addQuestion}
            onUpdateQuestion={updateQuestion}
            onDeleteQuestion={deleteQuestion}
            onLinkToShipDeck={linkQuestionToShipDeck}
            onLinkToBomb={linkQuestionToBomb}
            onUnlink={unlinkQuestion}
          />
        )}
      </div>

      {/* Meta edit modal */}
      {editingMeta && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditingMeta(false)}
        >
          <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Настройки режима</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Название</label>
                <input
                  type="text"
                  value={metaDraft.name}
                  onChange={(e) => setMetaDraft({ ...metaDraft, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Описание</label>
                <input
                  type="text"
                  value={metaDraft.description}
                  onChange={(e) => setMetaDraft({ ...metaDraft, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-300 text-sm font-medium mb-1">Столбцы</label>
                  <input
                    type="number"
                    min={5}
                    max={20}
                    value={metaDraft.gridColumns}
                    onChange={(e) => setMetaDraft({ ...metaDraft, gridColumns: Number(e.target.value) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-300 text-sm font-medium mb-1">Строки</label>
                  <input
                    type="number"
                    min={5}
                    max={15}
                    value={metaDraft.gridRows}
                    onChange={(e) => setMetaDraft({ ...metaDraft, gridRows: Number(e.target.value) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingMeta(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={saveMetaEdit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
