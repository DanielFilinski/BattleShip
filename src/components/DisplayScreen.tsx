import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ref, onValue, db } from '../lib/rtdb';
import { loadQuestions, loadShips, loadBombs } from '../utils/loadData';
import { Cell } from './Cell';
import {
  generateColumns,
  generateRows,
  getCellType,
  isShipSunk,
  getShipByCell,
  getSurroundingCells,
  getSurroundingCellsForCoordinate,
} from '../utils/gameLogic';
import type { Question } from '../types/question';
import type { Team, Ship, Bomb } from '../types/game';
import type { CellStatus } from '../types/cell';
import type { RemoteQuestion } from '../hooks/useFirebaseSync';

const CATEGORY_ICONS: Record<string, string> = {
  'История': '📚', 'Музыка': '🎵', 'Природа': '🌿', 'Спорт': '⚽',
  'Наука': '🔬', 'Кино': '🎬', 'Еда': '🍕', 'Технологии': '💻',
  'Бомба': '💣', 'Творческое': '🎨',
};

export function DisplayScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const [remoteQuestion, setRemoteQuestion] = useState<RemoteQuestion | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [gameMode, setGameMode] = useState<string>('');
  const [clickedCells, setClickedCells] = useState<string[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [fieldColumns, setFieldColumns] = useState(10);
  const [fieldRows, setFieldRows] = useState(10);

  // Подписка на текущий вопрос сессии
  useEffect(() => {
    const sessionRef = ref(db, `rooms/${roomId}/session/currentQuestion`);
    const unsub = onValue(sessionRef, snapshot => {
      setRemoteQuestion(snapshot.val() ?? null);
    });
    return unsub;
  }, [roomId]);

  // Подписка на состояние игры (счёт, ход, поле, открытые клетки, режим)
  useEffect(() => {
    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsub = onValue(stateRef, snapshot => {
      const state = snapshot.val();
      if (!state) return;
      setTeams(state.teams ?? []);
      setCurrentTurn(state.currentTurn ?? 0);
      setClickedCells(state.clickedCells ?? []);
      setAnsweredQuestions(state.answeredQuestions ?? []);
      if (state.fieldColumns) setFieldColumns(state.fieldColumns);
      if (state.fieldRows) setFieldRows(state.fieldRows);
      setGameMode(prev => (state.gameMode && state.gameMode !== prev ? state.gameMode : prev));
    });
    return unsub;
  }, [roomId]);

  // Загрузка данных режима (вопросы/корабли/бомбы)
  useEffect(() => {
    if (!gameMode) return;
    loadQuestions(gameMode).then(setQuestions);
    loadShips(gameMode).then(setShips);
    loadBombs(gameMode).then(setBombs);
  }, [gameMode]);

  const COLUMNS = useMemo(() => generateColumns(fieldColumns), [fieldColumns]);
  const ROWS = useMemo(() => generateRows(fieldRows), [fieldRows]);

  const currentQuestion = remoteQuestion?.questionId
    ? questions.find(q => q.id === remoteQuestion.questionId) ?? null
    : null;

  // Статус клетки — публичный вид (как видят зрители): без раскрытия позиций кораблей.
  const getCellStatus = (coordinate: string): CellStatus => {
    const { type } = getCellType(coordinate, ships, bombs);

    if (!clickedCells.includes(coordinate)) {
      const nearSunkShip = ships.some(
        ship => isShipSunk(ship, clickedCells) && getSurroundingCells(ship, COLUMNS, ROWS).includes(coordinate)
      );
      if (nearSunkShip) return 'miss';
      const nearBomb = bombs.some(
        bomb => clickedCells.includes(bomb.cell) &&
          getSurroundingCellsForCoordinate(bomb.cell, COLUMNS, ROWS).includes(coordinate)
      );
      if (nearBomb) return 'miss';
      return 'untouched';
    }

    if (type === 'empty') return 'miss';
    if (type === 'bomb') return 'bomb';
    if (type === 'ship') {
      const ship = getShipByCell(coordinate, ships);
      return ship && isShipSunk(ship, clickedCells) ? 'sunk' : 'hit';
    }
    return 'hit';
  };

  const stats = useMemo(() => {
    const foundBombs = bombs.filter(b => clickedCells.includes(b.cell)).length;
    const remainingShips = ships.filter(ship => !ship.cells.every(c => clickedCells.includes(c))).length;
    const allQuestionIds = [
      ...ships.flatMap(s => s.questionIds),
      ...bombs.map(b => b.questionId),
    ];
    const remainingQuestions = allQuestionIds.filter(q => q && !answeredQuestions.includes(q)).length;
    return {
      ships: remainingShips,
      bombs: bombs.length - foundBombs,
      questions: remainingQuestions,
    };
  }, [ships, bombs, clickedCells, answeredQuestions]);

  const noop = () => {};
  const categoryIcon = currentQuestion ? (CATEGORY_ICONS[currentQuestion.category] ?? '❓') : '❓';

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex flex-col lg:flex-row p-4 gap-4">
      {/* ─── Поле ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
          <div className="text-white/50 text-sm font-semibold tracking-widest uppercase">
            Морской Бой — комната {roomId}
          </div>
          <RoomQrButton roomId={roomId!} />
        </div>
        <div className="flex-1 bg-white/95 rounded-3xl shadow-2xl p-4 flex items-center justify-center">
          <div className="w-full max-w-[min(72vw,1000px)]">
            {/* Заголовки колонок */}
            <div className="flex mb-1">
              <div className="w-8 shrink-0" />
              {COLUMNS.map(col => (
                <div key={col} className="flex-1 min-w-0 text-center font-bold text-ocean-700 text-xl">
                  {col}
                </div>
              ))}
            </div>
            {/* Ряды */}
            {ROWS.map(row => (
              <div key={row} className="flex mb-1 items-center">
                <div className="w-8 shrink-0 flex items-center justify-center font-bold text-ocean-700 text-xl">
                  {row}
                </div>
                {COLUMNS.map(col => {
                  const coordinate = `${col}${row}`;
                  return (
                    <div key={coordinate} className="flex-1 min-w-0 px-0.5">
                      <Cell
                        coordinate={coordinate}
                        status={getCellStatus(coordinate)}
                        onClick={noop}
                        disabled
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Боковая панель: счёт + статистика ────────────────────────────── */}
      <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
        {/* Команды */}
        <div className="flex flex-row lg:flex-col gap-3 flex-wrap">
          {teams.map((team, i) => {
            const isActive = i === currentTurn;
            return (
              <div
                key={i}
                className={`flex-1 bg-white/95 rounded-2xl p-4 text-center shadow-xl transition-all ${
                  isActive ? 'ring-4 ring-white scale-[1.02]' : 'opacity-85'
                }`}
                style={{ minWidth: 140 }}
              >
                <div className="text-ocean-500 text-xs font-semibold mb-1">
                  {isActive ? '▶ ХОД' : `КОМАНДА ${i + 1}`}
                </div>
                <div className="text-lg font-bold text-ocean-800 truncate">{team.name}</div>
                <div className="text-5xl font-black leading-tight" style={{ color: team.color }}>
                  {team.score}
                </div>
                <div className="text-ocean-400 text-xs">баллов</div>
              </div>
            );
          })}
        </div>

        {/* Статистика */}
        <div className="bg-white/90 rounded-2xl p-4 shadow-xl">
          <div className="text-center text-sm font-bold text-ocean-800 mb-3">ОСТАЛОСЬ</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-ocean-700">🚢 Кораблей</span>
              <span className="text-2xl font-black text-blue-600">{stats.ships}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-ocean-700">💣 Бомб</span>
              <span className="text-2xl font-black text-red-600">{stats.bombs}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-ocean-700">❓ Вопросов</span>
              <span className="text-2xl font-black text-purple-600">{stats.questions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Вопрос (поверх поля), ответ скрыт до раскрытия ведущим ────────── */}
      {remoteQuestion?.isOpen && !remoteQuestion.answerRevealed && currentQuestion && (
        <div className="fixed inset-0 z-40 bg-ocean-900/80 backdrop-blur-sm flex items-center justify-center p-8 sm:p-12">
          <div className="max-w-4xl w-full">
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-5xl">{categoryIcon}</span>
              <span className="text-white/80 text-2xl font-semibold">{currentQuestion.category}</span>
              <span className="bg-white/20 text-white font-black text-2xl px-4 py-2 rounded-xl">
                {currentQuestion.points} балл(а)
              </span>
            </div>
            <div className="bg-white/95 rounded-3xl p-12 shadow-2xl text-center">
              <div className="text-4xl font-bold text-ocean-900 leading-tight whitespace-pre-line">
                {currentQuestion.question}
              </div>
              {currentQuestion.questionImages && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {(Array.isArray(currentQuestion.questionImages)
                    ? currentQuestion.questionImages
                    : [currentQuestion.questionImages]
                  ).map((src, i) => (
                    <img key={i} src={`/media/${src}`} alt="" className="max-h-64 rounded-xl object-contain shadow" />
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 text-center text-white/50 text-xl animate-pulse">Ожидание ответа...</div>
          </div>
        </div>
      )}

      {/* ─── Ответ (поверх поля) ──────────────────────────────────────────── */}
      {remoteQuestion?.isOpen && remoteQuestion.answerRevealed && currentQuestion && (
        <div className="fixed inset-0 z-40 bg-ocean-900/80 backdrop-blur-sm flex items-center justify-center p-8 sm:p-12">
          <div className="max-w-4xl w-full">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-5xl">{categoryIcon}</span>
              <span className="text-white/80 text-2xl font-semibold">{currentQuestion.category}</span>
            </div>
            <div className="bg-white/20 rounded-2xl p-6 text-center mb-6">
              <div className="text-white/80 text-2xl whitespace-pre-line">{currentQuestion.question}</div>
            </div>
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center animate-in zoom-in duration-500">
              <div className="text-ocean-500 text-lg font-semibold mb-3 uppercase tracking-wide">Правильный ответ</div>
              <div className="text-4xl font-black text-ocean-900 leading-tight whitespace-pre-line">
                {currentQuestion.answer}
              </div>
              {currentQuestion.answerImages && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {(Array.isArray(currentQuestion.answerImages)
                    ? currentQuestion.answerImages
                    : [currentQuestion.answerImages]
                  ).map((src, i) => (
                    <img key={i} src={`/media/${src}`} alt="" className="max-h-64 rounded-xl object-contain shadow" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Кнопка QR-кода для подключения к комнате (режим наблюдателя) ──────────────
// QR ведёт на страницу входа /room/{roomId} и открывается на весь экран,
// чтобы участники в зале могли отсканировать его с проектора.
function RoomQrButton({ roomId }: { roomId: string }) {
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState(window.location.origin);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // В офлайн-режиме наблюдатель может быть открыт через localhost — тогда ссылка
  // бесполезна для телефонов. Спрашиваем у локального сервера его адрес в Wi-Fi.
  useEffect(() => {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return;
    fetch('/api/server-info')
      .then(r => (r.ok ? r.json() : null))
      .then(info => {
        if (info?.host) setOrigin(`${window.location.protocol}//${info.host}:${info.port}`);
      })
      .catch(() => {
        /* офлайн-сервер недоступен — оставляем как есть */
      });
  }, []);

  const shareUrl = `${origin}/room/${roomId}`;

  // QR генерируется локально (работает офлайн). Большое разрешение — чтобы
  // оставался чётким на весь экран.
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 1024, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [shareUrl]);

  return (
    <>
      <button
        onClick={() => setShowQr(true)}
        className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
        title="QR-код для подключения к комнате"
      >
        📱 QR
      </button>

      {/* QR на весь экран */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-4 sm:p-8"
          onClick={() => setShowQr(false)}
        >
          {/* Закрыть — в углу */}
          <button
            onClick={() => setShowQr(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-ocean-400 hover:text-ocean-700 text-4xl font-bold leading-none transition-colors"
            title="Закрыть"
          >
            ✕
          </button>

          <div className="text-ocean-800 font-bold text-2xl sm:text-3xl mb-1">Отсканируй для входа</div>
          <div className="text-ocean-500 text-lg sm:text-xl mb-4 font-mono tracking-widest">{roomId}</div>

          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR код"
              className="w-[80vmin] h-[80vmin] max-w-[680px] max-h-[680px] object-contain rounded-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="w-[80vmin] h-[80vmin] max-w-[680px] max-h-[680px] rounded-2xl bg-ocean-50 flex items-center justify-center text-ocean-400 text-xl">
              Генерация QR…
            </div>
          )}

          <p className="mt-4 text-base sm:text-lg text-ocean-500 break-all text-center max-w-xl px-4">{shareUrl}</p>
          <div className="mt-2 text-ocean-400 text-sm">Нажми в любом месте, чтобы закрыть</div>
        </div>
      )}
    </>
  );
}
