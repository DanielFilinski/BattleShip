import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from './WelcomeScreen';
import { generateRoomId, createRoom, roomExists } from '../lib/rooms';
import { setAdminFlag } from '../lib/participant';
import { useGameState } from '../hooks/useGameState';
import type { Team } from '../types/game';

type LobbyMode = 'choose' | 'create' | 'join';

export function RoomLobby() {
  const navigate = useNavigate();
  const { startGame } = useGameState();
  const [mode, setMode] = useState<LobbyMode>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateRoom = async (teamNames: string[], gameMode: string, teamColors: string[]) => {
    if (creating) return;
    setCreating(true);
    try {
      const roomId = generateRoomId();
      const teams: Team[] = teamNames.map((name, i) => ({
        name,
        score: 0,
        color: teamColors[i],
      }));
      await createRoom(roomId, {
        teams,
        currentTurn: 0,
        clickedCells: [],
        answeredQuestions: [],
        gameStarted: true,
        gameMode,
        viewMode: false,
        editMode: false,
        timestamp: Date.now(),
      });
      setAdminFlag(roomId);
      // Mirror state locally so GameBoard has data immediately
      startGame(teamNames, gameMode, teamColors);
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.toUpperCase().trim();
    if (!code) return;
    setJoining(true);
    setJoinError('');
    try {
      const exists = await roomExists(code);
      if (!exists) {
        setJoinError('Комната не найдена. Проверьте код.');
        setJoining(false);
        return;
      }
      navigate(`/room/${code}`);
    } catch {
      setJoinError('Ошибка подключения. Попробуйте ещё раз.');
      setJoining(false);
    }
  };

  // "Create" mode — show full WelcomeScreen with online onCreate handler
  if (mode === 'create') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setMode('choose')}
            className="bg-white/90 backdrop-blur-sm text-ocean-700 font-semibold px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-colors"
          >
            ← Назад
          </button>
        </div>
        <WelcomeScreen onStartGame={handleCreateRoom} />
        {creating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <div className="text-4xl mb-3 animate-spin">⚓</div>
              <div className="text-xl font-semibold text-ocean-800">Создание комнаты...</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // "Join" mode — enter room code
  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-10 max-w-md w-full">
          <button
            onClick={() => setMode('choose')}
            className="mb-6 text-ocean-600 hover:text-ocean-800 font-semibold flex items-center gap-2 transition-colors"
          >
            ← Назад
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-ocean-800 mb-2">Войти в комнату</h2>
          <p className="text-ocean-600 mb-6 sm:mb-8 text-sm sm:text-base">Введите код комнаты, который показал ведущий</p>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 text-xl sm:text-2xl font-bold text-center tracking-widest border-2 border-ocean-300 rounded-xl focus:border-ocean-500 focus:outline-none transition-colors uppercase"
            placeholder="АРДУК7"
            maxLength={6}
            autoFocus
          />
          {joinError && (
            <p className="mt-3 text-red-600 text-sm font-semibold text-center">{joinError}</p>
          )}
          <button
            onClick={handleJoinRoom}
            disabled={joining || joinCode.trim().length === 0}
            className="mt-6 w-full bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-lg sm:text-xl font-bold py-3 sm:py-4 rounded-xl hover:from-ocean-700 hover:to-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {joining ? 'Подключение...' : 'Войти →'}
          </button>
        </div>
      </div>
    );
  }

  // Default — choose mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center">
        <div className="text-5xl sm:text-7xl mb-3 sm:mb-4">⚓</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ocean-800 mb-2">Морской Бой</h1>
        <p className="text-ocean-600 mb-6 sm:mb-10 text-base sm:text-lg">Онлайн-викторина для команд</p>

        <div className="space-y-4">
          <button
            onClick={() => setMode('create')}
            className="w-full bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-base sm:text-xl font-bold py-4 sm:py-5 rounded-xl hover:from-ocean-700 hover:to-ocean-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            🚀 Создать игру
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-base sm:text-xl font-semibold py-4 sm:py-5 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            🔗 Войти по коду
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-ocean-500 text-sm">
            Нажмите <kbd className="px-2 py-1 bg-ocean-100 rounded text-ocean-700">F11</kbd> для полноэкранного режима
          </p>
          <button
            onClick={() => navigate('/editor')}
            className="text-ocean-500 hover:text-ocean-700 text-sm font-medium transition-colors"
          >
            ✎ Редактор
          </button>
        </div>
      </div>
    </div>
  );
}
