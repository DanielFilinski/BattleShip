import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface VictoryAnimationProps {
  winnerName: string;
  winnerScore: number;
  loserName: string;
  loserScore: number;
  onClose: () => void;
}

export function VictoryAnimation({
  winnerName,
  winnerScore,
  loserName,
  loserScore,
  onClose,
}: VictoryAnimationProps) {
  const [showFireworks, setShowFireworks] = useState(true);

  useEffect(() => {
    // Launch confetti animation
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

      // Multiple confetti bursts from different positions
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

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-500">
      <div className="max-w-4xl w-full text-center">
        {/* Trophy Animation */}
        <div className="mb-8 animate-in zoom-in duration-700 delay-300">
          <div className="text-9xl mb-4 animate-bounce">🏆</div>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse">
            ПОБЕДА!
          </div>
        </div>

        {/* Winner Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl shadow-2xl p-8 mb-6 animate-in slide-in-from-bottom duration-700 delay-500">
          <div className="text-white">
            <div className="text-3xl font-bold mb-2">Победитель</div>
            <div className="text-7xl font-black mb-4">{winnerName}</div>
            <div className="text-5xl font-bold">
              {winnerScore} баллов
            </div>
          </div>
        </div>

        {/* Runner-up */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom duration-700 delay-700">
          <div className="text-white/80">
            <div className="text-xl font-semibold mb-2">2 место</div>
            <div className="text-4xl font-bold mb-2">{loserName}</div>
            <div className="text-3xl font-semibold">{loserScore} баллов</div>
          </div>
        </div>

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

        {/* Fireworks Indicator */}
        {showFireworks && (
          <div className="mt-6 text-yellow-400 text-lg animate-pulse">
            ✨ Салют! ✨
          </div>
        )}
      </div>
    </div>
  );
}
