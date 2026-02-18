import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Team } from '../types/game';

const PLACE_LABELS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

interface VictoryAnimationProps {
  teams: Team[]; // sorted by score descending
  onClose: () => void;
}

export function VictoryAnimation({ teams, onClose }: VictoryAnimationProps) {
  const [showFireworks, setShowFireworks] = useState(true);

  useEffect(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        setShowFireworks(false);
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const winner = teams[0];
  const rest = teams.slice(1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-4xl w-full text-center py-8">
        {/* Trophy Animation */}
        <div className="mb-8 animate-in zoom-in duration-700 delay-300">
          <div className="text-9xl mb-4 animate-bounce">🏆</div>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse">
            ПОБЕДА!
          </div>
        </div>

        {/* Winner Card */}
        {winner && (
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl shadow-2xl p-8 mb-6 animate-in slide-in-from-bottom duration-700 delay-500">
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">Победитель</div>
              <div className="text-7xl font-black mb-4">{winner.name}</div>
              <div className="text-5xl font-bold">
                {winner.score} баллов
              </div>
            </div>
          </div>
        )}

        {/* Other places */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-3 mb-8 animate-in slide-in-from-bottom duration-700 delay-700">
            {rest.map((team, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="text-white/80 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{PLACE_LABELS[index + 1] || `${index + 2}`}</span>
                    <span className="text-2xl font-bold">{team.name}</span>
                  </div>
                  <span className="text-2xl font-semibold">{team.score} баллов</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Celebration Messages */}
        <div className="text-white text-2xl font-semibold mb-8 animate-in slide-in-from-bottom duration-700 delay-1000">
          <p className="mb-2">🎉 Все корабли потоплены! 🎉</p>
          <p className="text-xl opacity-80">Поздравляем с победой!</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-2xl font-bold py-6 px-12 rounded-2xl hover:from-emerald-700 hover:to-emerald-600 transition-all transform hover:scale-105 active:scale-95 shadow-2xl animate-in slide-in-from-bottom duration-700 delay-1200"
        >
          🎊 Завершить игру
        </button>

        {showFireworks && (
          <div className="mt-6 text-yellow-400 text-lg animate-pulse">
            ✨ Салют! ✨
          </div>
        )}
      </div>
    </div>
  );
}
