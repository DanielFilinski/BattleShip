import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from './WelcomeScreen';
import { GameBoard } from './GameBoard';
import { useGameState } from '../hooks/useGameState';
import { loadQuestions, loadShips, loadBombs } from '../utils/loadData';
import type { Question } from '../types/question';
import type { Ship, Bomb } from '../types/game';

// ─────────────────────────────────────────────────────────────────────────────
// Локальный режим «ведущий за одним компьютером» (для трансляции экрана).
//
// Вся игра идёт в одном браузере: ведущий сам кликает по клеткам, а ответ
// показывается только после кнопки «👁️ Показать ответ». Никаких комнат,
// участников и синхронизации — поэтому GameBoard рендерится БЕЗ sync-пропсов
// (onWriteSession и т.п.), и QuestionModal работает в режиме офлайн-ведущего.
// ─────────────────────────────────────────────────────────────────────────────
export function SoloPage() {
  const navigate = useNavigate();
  const { gameStarted, gameMode, startGame } = useGameState();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные выбранного режима, когда игра запущена.
  useEffect(() => {
    if (!gameStarted || !gameMode) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setShips([]);
      setBombs([]);
      try {
        const [loadedQuestions, loadedShips, loadedBombs] = await Promise.all([
          loadQuestions(gameMode),
          loadShips(gameMode),
          loadBombs(gameMode),
        ]);
        if (cancelled) return;
        setQuestions(loadedQuestions);
        setShips(loadedShips);
        setBombs(loadedBombs);
        if (loadedQuestions.length === 0) {
          setError('Не удалось загрузить вопросы для этого режима');
        }
      } catch (err) {
        console.error('Failed to load game data:', err);
        if (!cancelled) setError('Ошибка загрузки данных игры');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameStarted, gameMode]);

  const handleStart = (teamNames: string[], mode: string, teamColors: string[]) => {
    startGame(teamNames, mode, teamColors);
  };

  // ── Настройка перед стартом: выбор команд и режима ──────────────────────────
  if (!gameStarted || !gameMode) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="bg-white/90 backdrop-blur-sm text-ocean-700 font-semibold px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-colors"
          >
            ← Назад
          </button>
        </div>
        <WelcomeScreen onStartGame={handleStart} />
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
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-ocean-600 text-white py-3 px-8 rounded-xl hover:bg-ocean-700 transition-colors font-semibold"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  // ── Игра. Без sync-пропсов → режим офлайн-ведущего (ответ по кнопке). ───────
  return <GameBoard questions={questions} ships={ships} bombs={bombs} />;
}
