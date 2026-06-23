import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { setCoHostFlag } from '../lib/participant';
import QRCode from 'qrcode';
import { useGameState } from '../hooks/useGameState';
import { useParticipant } from '../hooks/useParticipant';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { GameBoard } from './GameBoard';
import { TeamJoinModal } from './TeamJoinModal';
import { loadQuestions, loadShips, loadBombs } from '../utils/loadData';
import type { Question } from '../types/question';
import type { Ship, Bomb } from '../types/game';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Open /room/{code}?host=1 to join as the second presenter (co-host).
  // Persist synchronously (lazy init runs once, before useParticipant reads it),
  // so a refresh keeps co-host mode.
  useState(() => {
    if (roomId && searchParams.get('host') === '1') setCoHostFlag(roomId);
    return null;
  });
  const { gameStarted, gameMode, teams } = useGameState();
  const { isAdmin, isCoHost, myTeamIndex, userId, hasChosen } = useParticipant(roomId!);
  const { remoteQuestion, writeSession, clearSession, participantShoot } = useFirebaseSync({
    roomId: roomId!,
    isAdmin,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(!hasChosen);

  // Load game data whenever gameMode is known or changes (re-sync from Firebase)
  useEffect(() => {
    if (!gameMode) return;
    loadGameData(gameMode);
  }, [gameMode]);

  const loadGameData = async (mode: string) => {
    try {
      setLoading(true);
      // Clear stale data from previous mode before loading new
      setQuestions([]);
      setShips([]);
      setBombs([]);
      const [loadedQuestions, loadedShips, loadedBombs] = await Promise.all([
        loadQuestions(mode),
        loadShips(mode),
        loadBombs(mode),
      ]);
      setQuestions(loadedQuestions);
      setShips(loadedShips);
      setBombs(loadedBombs);
      if (loadedQuestions.length === 0) {
        setError('Не удалось загрузить вопросы для этого режима');
      }
    } catch (err) {
      console.error('Failed to load game data:', err);
      setError('Ошибка загрузки данных игры');
    } finally {
      setLoading(false);
    }
  };

  const updateShipCell = (shipId: string, cellIndex: number, newCell: string, newQuestionId: string) => {
    setShips(prev => prev.map(ship =>
      ship.id === shipId
        ? { ...ship, cells: ship.cells.map((c, i) => i === cellIndex ? newCell : c), questionIds: ship.questionIds.map((q, i) => i === cellIndex ? newQuestionId : q) }
        : ship
    ));
  };

  const updateBomb = (oldCell: string, newCell: string, newQuestionId: string) => {
    setBombs(prev => prev.map(bomb =>
      bomb.cell === oldCell ? { cell: newCell, questionId: newQuestionId } : bomb
    ));
  };

  const exportGameData = () => {
    const data = { ships, bombs };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-data-edited.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Waiting for Firebase sync: viewers see loading until gameMode arrives
  if (!gameMode || (!gameStarted && !isAdmin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⚓</div>
          <div className="text-2xl font-semibold">Подключение к комнате...</div>
          <div className="text-ocean-200 mt-2 font-mono text-lg">{roomId}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⚓</div>
          <div className="text-2xl font-semibold">Загрузка игры...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки</h1>
          <p className="text-ocean-700">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 bg-ocean-600 text-white py-3 px-8 rounded-xl hover:bg-ocean-700 transition-colors font-semibold">
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Team selection modal for new participants */}
      {showTeamModal && !isAdmin && (
        <TeamJoinModal
          teams={teams}
          roomId={roomId!}
          userId={userId}
          onJoin={() => setShowTeamModal(false)}
        />
      )}

      {/* Room code banner */}
      <RoomCodeBanner roomId={roomId!} isAdmin={isAdmin} />

      {/* Main game */}
      <GameBoard
        questions={questions}
        ships={ships}
        bombs={bombs}
        onUpdateShipCell={updateShipCell}
        onUpdateBomb={updateBomb}
        onExportData={exportGameData}
        isAdmin={isAdmin}
        isCoHost={isCoHost}
        myTeamIndex={myTeamIndex}
        roomId={roomId!}
        remoteQuestion={remoteQuestion}
        onWriteSession={writeSession}
        onClearSession={clearSession}
        onParticipantShoot={participantShoot}
      />
    </>
  );
}

// Запасное копирование для http-адресов, где navigator.clipboard недоступен.
function fallbackCopy(text: string, onDone: () => void) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onDone();
  } catch {
    /* совсем не вышло — пользователь скопирует ссылку вручную из QR-окна */
  }
}

// ─── Room code banner ─────────────────────────────────────────────────────────
function RoomCodeBanner({ roomId, isAdmin }: { roomId: string; isAdmin: boolean }) {
  const [copied, setCopied] = useState(false);
  const [coHostCopied, setCoHostCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState(window.location.origin);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Если ведущий открыл игру через localhost, ссылка/QR были бы бесполезны для
  // телефонов. Спрашиваем у локального сервера его адрес в Wi-Fi сети.
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
  const coHostUrl = `${shareUrl}?host=1`;

  // QR генерируется локально (работает офлайн, без внешних сервисов).
  // Большое разрешение — чтобы оставался чётким на весь экран.
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 1024, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [shareUrl]);

  const copyUrl = (url: string, markCopied: () => void) => {
    // navigator.clipboard доступен только в защищённом контексте (https/localhost).
    // По локальной сети (http://192.168.x.x) его нет — нужен запасной способ.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(markCopied).catch(() => fallbackCopy(url, markCopied));
    } else {
      fallbackCopy(url, markCopied);
    }
  };

  const handleCopy = () => {
    copyUrl(shareUrl, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyCoHost = () => {
    copyUrl(coHostUrl, () => {
      setCoHostCopied(true);
      setTimeout(() => setCoHostCopied(false), 2000);
    });
  };

  if (!isAdmin) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-30 bg-ocean-900/95 backdrop-blur-sm border-b border-ocean-700 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-ocean-300 text-sm font-semibold">КОД:</span>
          <span className="text-white font-black text-xl tracking-widest font-mono">{roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQr(v => !v)}
            className="bg-ocean-700 hover:bg-ocean-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            title="QR-код для участников"
          >
            QR
          </button>
          <a
            href={`/room/${roomId}/display`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            📺 Экран
          </a>
          <button
            onClick={handleCopy}
            className="bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? '✓ Скопировано!' : '🔗 Ссылка'}
          </button>
          <button
            onClick={handleCopyCoHost}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            title="Ссылка для второго ведущего — он будет видеть ответы"
          >
            {coHostCopied ? '✓ Скопировано!' : '👁 Соведущий'}
          </button>
        </div>
      </div>

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
