import { useGameState } from '../hooks/useGameState';

export function ScoreBoard() {
  const { team1, team2, currentTurn } = useGameState();

  return (
    <div className="flex justify-between items-center gap-8 mb-8">
      {/* Team 1 */}
      <div
        className={`flex-1 rounded-2xl shadow-xl p-6 border-4 transition-all duration-300 ${
          currentTurn === 1
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 scale-105 shadow-2xl shadow-emerald-500/50'
            : 'bg-white border-ocean-200'
        }`}
      >
        <div className="text-center">
          <div className={`text-sm font-semibold mb-1 ${
            currentTurn === 1 ? 'text-white' : 'text-ocean-600'
          }`}>
            {currentTurn === 1 && '▶️ '}КОМАНДА 1
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            currentTurn === 1 ? 'text-white' : 'text-ocean-800'
          }`}>
            {team1.name}
          </div>
          <div className={`text-5xl font-black ${
            currentTurn === 1 ? 'text-white' : 'text-emerald-600'
          }`}>
            {team1.score}
          </div>
          <div className={`text-xs mt-1 ${
            currentTurn === 1 ? 'text-emerald-100' : 'text-ocean-500'
          }`}>БАЛЛОВ</div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex flex-col items-center">
        <div className="text-4xl font-black text-ocean-400">VS</div>
        <div className="text-xs text-ocean-500 mt-1">МОРСКОЙ БОЙ</div>
      </div>

      {/* Team 2 */}
      <div
        className={`flex-1 rounded-2xl shadow-xl p-6 border-4 transition-all duration-300 ${
          currentTurn === 2
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 scale-105 shadow-2xl shadow-blue-500/50'
            : 'bg-white border-ocean-200'
        }`}
      >
        <div className="text-center">
          <div className={`text-sm font-semibold mb-1 ${
            currentTurn === 2 ? 'text-white' : 'text-ocean-600'
          }`}>
            {currentTurn === 2 && '▶️ '}КОМАНДА 2
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            currentTurn === 2 ? 'text-white' : 'text-ocean-800'
          }`}>
            {team2.name}
          </div>
          <div className={`text-5xl font-black ${
            currentTurn === 2 ? 'text-white' : 'text-blue-600'
          }`}>
            {team2.score}
          </div>
          <div className={`text-xs mt-1 ${
            currentTurn === 2 ? 'text-blue-100' : 'text-ocean-500'
          }`}>БАЛЛОВ</div>
        </div>
      </div>
    </div>
  );
}
