import { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { loadGameModes } from '../utils/loadData';
import { GameMode } from '../types/game';

interface WelcomeScreenProps {
  onModeSelect?: (mode: string) => void;
}

export function WelcomeScreen({ onModeSelect }: WelcomeScreenProps) {
  const [teamNames, setTeamNames] = useState<string[]>(['', '']);
  const [selectedMode, setSelectedMode] = useState<string>('choir');
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const { startGame, gameStarted, gameMode } = useGameState();

  // Check if there's a saved game from zustand persist
  const canResume = gameStarted;

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
    const validNames = teamNames.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNames.length >= 2) {
      if (onModeSelect) {
        onModeSelect(selectedMode);
      }
      startGame(validNames, selectedMode);
    }
  };

  const handleResume = () => {
    if (onModeSelect && gameMode) {
      onModeSelect(gameMode);
    }
  };

  const addTeam = () => {
    if (teamNames.length < 6) {
      setTeamNames([...teamNames, '']);
    }
  };

  const removeTeam = (index: number) => {
    if (teamNames.length > 2) {
      setTeamNames(teamNames.filter((_, i) => i !== index));
    }
  };

  const updateTeamName = (index: number, value: string) => {
    const updated = [...teamNames];
    updated[index] = value;
    setTeamNames(updated);
  };

  const canStart = teamNames.filter((n) => n.trim().length > 0).length >= 2;

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
          {/* Game mode selection */}
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

          {/* Teams */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-lg font-semibold text-ocean-700">
                Команды ({teamNames.length})
              </label>
              <button
                onClick={addTeam}
                disabled={teamNames.length >= 6}
                className="flex items-center gap-1 px-4 py-2 bg-ocean-100 hover:bg-ocean-200 disabled:opacity-40 disabled:cursor-not-allowed text-ocean-700 font-semibold rounded-xl transition-colors text-sm"
              >
                + Добавить команду
              </button>
            </div>
            <div className="space-y-3">
              {teamNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0`}
                    style={{
                      backgroundColor:
                        index === 0 ? '#10b981' :
                        index === 1 ? '#3b82f6' :
                        index === 2 ? '#8b5cf6' :
                        index === 3 ? '#f59e0b' :
                        index === 4 ? '#f43f5e' :
                        '#06b6d4'
                    }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateTeamName(index, e.target.value)}
                    className="flex-1 px-5 py-3 text-lg border-2 border-ocean-300 rounded-xl focus:border-ocean-500 focus:outline-none transition-colors"
                    placeholder={`Команда ${index + 1}`}
                    autoFocus={index === 0}
                  />
                  {teamNames.length > 2 && (
                    <button
                      onClick={() => removeTeam(index)}
                      className="w-10 h-10 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors font-bold text-lg flex-shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart}
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
