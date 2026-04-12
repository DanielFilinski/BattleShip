import { useState } from 'react';
import type { EditorShip, EditorBomb, EditorQuestion } from '../../lib/editorStorage';

interface QuestionEditorProps {
  questions: Record<string, EditorQuestion>;
  ships: Record<string, EditorShip>;
  bombs: Record<string, EditorBomb>;
  onAddQuestion: () => string;
  onUpdateQuestion: (q: EditorQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onLinkToShipDeck: (qId: string, shipId: string, deckIndex: number) => void;
  onLinkToBomb: (qId: string, bombId: string) => void;
  onUnlink: (qId: string) => void;
}

type QuestionLink2 =
  | { type: 'ship'; shipId: string; shipName: string; deckIndex: number; cell: string }
  | { type: 'bomb'; bombId: string; cell: string }
  | null;

function getQuestionLink(
  qId: string,
  ships: Record<string, EditorShip>,
  bombs: Record<string, EditorBomb>
): QuestionLink2 {
  for (const ship of Object.values(ships)) {
    const idx = ship.questionIds.indexOf(qId);
    if (idx !== -1) {
      return {
        type: 'ship',
        shipId: ship.id,
        shipName: ship.name,
        deckIndex: idx,
        cell: ship.cells[idx] ?? '—',
      };
    }
  }
  for (const bomb of Object.values(bombs)) {
    if (bomb.questionId === qId) {
      return { type: 'bomb', bombId: bomb.id, cell: bomb.cell };
    }
  }
  return null;
}

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const TYPE_OPTIONS = ['text', 'image', 'audio', 'video', 'activity'];

interface QuestionFormProps {
  question: EditorQuestion;
  ships: Record<string, EditorShip>;
  bombs: Record<string, EditorBomb>;
  link: QuestionLink2;
  onSave: (q: EditorQuestion) => void;
  onDelete: () => void;
  onLinkToShipDeck: (shipId: string, deckIndex: number) => void;
  onLinkToBomb: (bombId: string) => void;
  onUnlink: () => void;
  onClose: () => void;
}

function QuestionForm({
  question,
  ships,
  bombs,
  link,
  onSave,
  onDelete,
  onLinkToShipDeck,
  onLinkToBomb,
  onUnlink,
  onClose,
}: QuestionFormProps) {
  const [draft, setDraft] = useState<EditorQuestion>({ ...question });
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  const shipList = Object.values(ships);
  const bombList = Object.values(bombs);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-16 overflow-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-white/10 mb-8">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Редактор вопроса</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Вопрос *</label>
            <textarea
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Текст вопроса..."
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Ответ *</label>
            <textarea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Правильный ответ..."
            />
          </div>

          {/* Row: category, type, difficulty, points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Категория</label>
              <input
                type="text"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                placeholder="Например: История"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Очки</label>
              <input
                type="number"
                value={draft.points}
                onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
                min={0}
                step={50}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Тип</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Сложность</label>
              <select
                value={draft.difficulty}
                onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Link to cell */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Привязка к клетке</label>
            {link ? (
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm flex-1">
                  {link.type === 'ship'
                    ? `⛵ ${link.shipName} — палуба ${link.deckIndex + 1} (${link.cell})`
                    : `💣 Бомба (${link.cell})`}
                </span>
                <button
                  onClick={() => setShowLinkPicker(!showLinkPicker)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={onUnlink}
                  className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg transition-colors"
                >
                  Отвязать
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLinkPicker(!showLinkPicker)}
                className="w-full border-2 border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 py-2.5 rounded-xl text-sm transition-colors"
              >
                + Привязать к палубе корабля или бомбе
              </button>
            )}

            {showLinkPicker && (
              <div className="mt-2 bg-slate-700 rounded-xl p-3 max-h-60 overflow-y-auto space-y-1">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Корабли</div>
                {shipList.length === 0 && (
                  <div className="text-slate-500 text-xs">Сначала добавьте и разместите корабли</div>
                )}
                {shipList.map((ship) =>
                  ship.cells.map((cell, di) => (
                    <button
                      key={`${ship.id}-${di}`}
                      onClick={() => {
                        onLinkToShipDeck(ship.id, di);
                        setShowLinkPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        link?.type === 'ship' && link.shipId === ship.id && link.deckIndex === di
                          ? 'bg-indigo-700 text-white'
                          : 'hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      ⛵ {ship.name} — палуба {di + 1} {cell ? `(${cell})` : '(не размещена)'}
                      {ship.questionIds[di] && ship.questionIds[di] !== draft.id && (
                        <span className="ml-2 text-xs text-amber-400">занята</span>
                      )}
                    </button>
                  ))
                )}

                {bombList.length > 0 && (
                  <>
                    <div className="text-slate-400 text-xs uppercase tracking-widest mt-3 mb-2">Бомбы</div>
                    {bombList.map((bomb) => (
                      <button
                        key={bomb.id}
                        onClick={() => {
                          onLinkToBomb(bomb.id);
                          setShowLinkPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          link?.type === 'bomb' && link.bombId === bomb.id
                            ? 'bg-orange-700 text-white'
                            : 'hover:bg-slate-600 text-slate-200'
                        }`}
                      >
                        💣 Бомба {bomb.cell}
                        {bomb.questionId && bomb.questionId !== draft.id && (
                          <span className="ml-2 text-xs text-amber-400">занята</span>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onDelete}
            className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 font-medium rounded-xl transition-colors text-sm"
          >
            Удалить
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Отмена
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            disabled={!draft.question.trim() || !draft.answer.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuestionEditor({
  questions,
  ships,
  bombs,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onLinkToShipDeck,
  onLinkToBomb,
  onUnlink,
}: QuestionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const questionList = Object.values(questions);
  const filtered = search.trim()
    ? questionList.filter(
        (q) =>
          q.question.toLowerCase().includes(search.toLowerCase()) ||
          q.answer.toLowerCase().includes(search.toLowerCase()) ||
          q.category.toLowerCase().includes(search.toLowerCase())
      )
    : questionList;

  const handleAdd = () => {
    const id = onAddQuestion();
    setEditingId(id);
  };

  const editingQuestion = editingId ? questions[editingId] : null;

  // Count linked/unlinked
  const linkedCount = questionList.filter((q) => getQuestionLink(q.id, ships, bombs) !== null).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск вопросов..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <div className="text-slate-500 text-sm whitespace-nowrap">
          {linkedCount}/{questionList.length} привязаны
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + Добавить вопрос
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          {questionList.length === 0 ? (
            <div>
              <div className="text-4xl mb-3">❓</div>
              <div className="text-lg font-medium text-slate-400">Вопросов пока нет</div>
              <div className="text-sm mt-1">Нажмите «Добавить вопрос» чтобы начать</div>
            </div>
          ) : (
            <div>Ничего не найдено</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((q) => {
            const link = getQuestionLink(q.id, ships, bombs);
            return (
              <div
                key={q.id}
                onClick={() => setEditingId(q.id)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium line-clamp-2 text-sm leading-snug">
                      {q.question || <span className="text-slate-500 italic">Без текста</span>}
                    </p>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">
                      Ответ: {q.answer || '—'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {/* Link badge */}
                    {link ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                        {link.type === 'ship'
                          ? `⛵ ${link.shipName} п.${link.deckIndex + 1}`
                          : `💣 ${link.cell}`}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-600/50">
                        не привязан
                      </span>
                    )}

                    {/* Meta badges */}
                    <div className="flex gap-1">
                      {q.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                          {q.category}
                        </span>
                      )}
                      {q.points > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-amber-400 rounded">
                          {q.points}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingQuestion && (
        <QuestionForm
          question={editingQuestion}
          ships={ships}
          bombs={bombs}
          link={getQuestionLink(editingQuestion.id, ships, bombs)}
          onSave={(q) => onUpdateQuestion(q)}
          onDelete={() => {
            onDeleteQuestion(editingQuestion.id);
            setEditingId(null);
          }}
          onLinkToShipDeck={(shipId, deckIndex) =>
            onLinkToShipDeck(editingQuestion.id, shipId, deckIndex)
          }
          onLinkToBomb={(bombId) => onLinkToBomb(editingQuestion.id, bombId)}
          onUnlink={() => onUnlink(editingQuestion.id)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
