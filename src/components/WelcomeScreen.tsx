import { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { hasSavedGame, loadGameState } from '../utils/storage';
import { loadGameModes } from '../utils/loadData';
import { GameMode } from '../types/game';

interface WelcomeScreenProps {
  onModeSelect?: (mode: string) => void;
}

export function WelcomeScreen({ onModeSelect }: WelcomeScreenProps) {
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('choir');
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const { startGame, loadSavedGame } = useGameState();
  const canResume = hasSavedGame();

  useEffect(() => {
    async function loadModes() {
      const modes = await loadGameModes();
      setGameModes(modes);
      if (modes.length > 0) {
        setSelectedMode(modes[0].id);
      }
    }
    loadModes();
  }, []);

  const handleStart = () => {
    if (team1Name.trim() && team2Name.trim()) {
      if (onModeSelect) {
        onModeSelect(selectedMode);
      }
      startGame(team1Name.trim(), team2Name.trim(), selectedMode);
    }
  };

  const handleResume = () => {
    const savedState = loadGameState();
    if (savedState) {
      loadSavedGame(savedState);
      // Notify parent about saved mode to load game data
      if (onModeSelect && savedState.gameMode) {
        onModeSelect(savedState.gameMode);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-6xl font-bold text-ocean-800 text-center mb-4">
          ⚓ Морской Бой
        </h1>
        <p className="text-2xl text-ocean-600 text-center mb-12">
          Викторина для команд
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-ocean-700 mb-2">
              Выберите режим игры
            </label>
            <div className="grid grid-cols-2 gap-3">
              {gameModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedMode === mode.id
                      ? 'border-ocean-500 bg-ocean-50 shadow-md transform scale-105'
                      : 'border-gray-300 bg-white hover:border-ocean-300'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: mode.color }}
                  ></div>
                  <div className="font-bold text-ocean-800">{mode.name}</div>
                  <div className="text-xs text-ocean-600 mt-1">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-ocean-700 mb-2">
              Название первой команды
            </label>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="w-full px-6 py-4 text-xl border-2 border-ocean-300 rounded-xl focus:border-ocean-500 focus:outline-none transition-colors"
              placeholder="Команда 1"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-ocean-700 mb-2">
              Название второй команды
            </label>
            <input
              type="text"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              className="w-full px-6 py-4 text-xl border-2 border-ocean-300 rounded-xl focus:border-ocean-500 focus:outline-none transition-colors"
              placeholder="Команда 2"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!team1Name.trim() || !team2Name.trim()}
            className="w-full bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-2xl font-bold py-5 px-8 rounded-xl hover:from-ocean-700 hover:to-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            🚀 Начать игру
          </button>

          {canResume && (
            <button
              onClick={handleResume}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xl font-semibold py-4 px-8 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              ♻️ Продолжить игру
            </button>
          )}
        </div>

        <div className="mt-12 text-center text-ocean-600">
          <p className="text-sm">
            Нажмите клавишу <kbd className="px-2 py-1 bg-ocean-100 rounded">F11</kbd> для полноэкранного режима
          </p>
        </div>
      </div>
    </div>
  );
}
