import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { gameStarted, gameMode, teams } = useGameState();
  const { isAdmin, myTeamIndex, userId, hasChosen } = useParticipant(roomId!);
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

  // Load game data when gameMode is known (synced from Firebase for viewers)
  useEffect(() => {
    if (!gameMode || questions.length > 0) return;
    loadGameData(gameMode);
  }, [gameMode]);

  const loadGameData = async (mode: string) => {
    try {
      setLoading(true);
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

// ─── Room code banner ─────────────────────────────────────────────────────────
function RoomCodeBanner({ roomId, isAdmin }: { roomId: string; isAdmin: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const shareUrl = `${window.location.origin}/room/${roomId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        </div>
      </div>

      {/* QR popover */}
      {showQr && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-ocean-800 font-bold text-lg mb-1">Отсканируй для входа</div>
            <div className="text-ocean-500 text-sm mb-4 font-mono">{roomId}</div>
            <img src={qrUrl} alt="QR код" className="w-48 h-48 mx-auto rounded-xl" />
            <p className="mt-4 text-xs text-ocean-400 break-all max-w-xs">{shareUrl}</p>
            <button
              onClick={() => setShowQr(false)}
              className="mt-4 bg-ocean-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-ocean-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
