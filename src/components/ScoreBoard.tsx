import { useGameState } from '../hooks/useGameState';

export function ScoreBoard() {
  const { team1, team2, currentTurn } = useGameState();

  return (
    <div className="flex justify-between items-center gap-8 mb-8">
      {/* Team 1 */}
      <div
        className={`flex-1 bg-white rounded-2xl shadow-xl p-6 border-4 transition-all ${
          currentTurn === 1
            ? 'border-emerald-500 scale-105'
            : 'border-ocean-200'
        }`}
      >
        <div className="text-center">
          <div className="text-sm font-semibold text-ocean-600 mb-1">
            {currentTurn === 1 && '▶️ '}КОМАНДА 1
          </div>
          <div className="text-3xl font-bold text-ocean-800 mb-2">
            {team1.name}
          </div>
          <div className="text-5xl font-black text-emerald-600">
            {team1.score}
          </div>
          <div className="text-xs text-ocean-500 mt-1">БАЛЛОВ</div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex flex-col items-center">
        <div className="text-4xl font-black text-ocean-400">VS</div>
        <div className="text-xs text-ocean-500 mt-1">МОРСКОЙ БОЙ</div>
      </div>

      {/* Team 2 */}
      <div
        className={`flex-1 bg-white rounded-2xl shadow-xl p-6 border-4 transition-all ${
          currentTurn === 2
            ? 'border-emerald-500 scale-105'
            : 'border-ocean-200'
        }`}
      >
        <div className="text-center">
          <div className="text-sm font-semibold text-ocean-600 mb-1">
            {currentTurn === 2 && '▶️ '}КОМАНДА 2
          </div>
          <div className="text-3xl font-bold text-ocean-800 mb-2">
            {team2.name}
          </div>
          <div className="text-5xl font-black text-emerald-600">
            {team2.score}
          </div>
          <div className="text-xs text-ocean-500 mt-1">БАЛЛОВ</div>
        </div>
      </div>
    </div>
  );
}
