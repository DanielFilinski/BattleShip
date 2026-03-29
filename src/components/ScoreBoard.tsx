import { useGameState } from '../hooks/useGameState';
import { getTeamActiveStyle, getTeamColor } from '../utils/teamColors';

export function ScoreBoard() {
  const { teams, currentTurn, setTurn, adjustScore } = useGameState();

  return (
    <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
      {teams.map((team, index) => {
        const isActive = currentTurn === index;
        const color = getTeamColor(team, index);
        return (
          <div
            key={index}
            className={`flex-1 min-w-[120px] rounded-2xl shadow-xl p-6 border-4 transition-all duration-300 ${
              isActive ? 'scale-105 shadow-2xl' : 'bg-white border-ocean-200 hover:shadow-2xl hover:border-ocean-400 hover:bg-ocean-50'
            }`}
            style={isActive ? getTeamActiveStyle(color) : undefined}
          >
            <div
              className="text-center cursor-pointer"
              onClick={() => setTurn(index)}
              title={isActive ? 'Текущий ход' : 'Передать ход этой команде'}
            >
              <div className={`text-sm font-semibold mb-1 ${isActive ? 'text-white' : 'text-ocean-600'}`}>
                {isActive && '▶️ '}КОМАНДА {index + 1}
              </div>
              <div className={`text-2xl font-bold mb-2 ${isActive ? 'text-white' : 'text-ocean-800'}`}>
                {team.name}
              </div>
              <div
                className={`text-5xl font-black ${isActive ? 'text-white' : ''}`}
                style={!isActive ? { color } : undefined}
              >
                {team.score}
              </div>
              <div className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-ocean-500'}`}>БАЛЛОВ</div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => adjustScore(index, -1)}
                className={`w-8 h-8 rounded-lg font-bold text-xl leading-none transition-colors ${
                  isActive
                    ? 'bg-white/20 hover:bg-white/40 text-white'
                    : 'bg-ocean-100 hover:bg-ocean-200 text-ocean-700'
                }`}
                title="Отнять 1 балл"
              >
                −
              </button>
              <button
                onClick={() => adjustScore(index, 1)}
                className={`w-8 h-8 rounded-lg font-bold text-xl leading-none transition-colors ${
                  isActive
                    ? 'bg-white/20 hover:bg-white/40 text-white'
                    : 'bg-ocean-100 hover:bg-ocean-200 text-ocean-700'
                }`}
                title="Добавить 1 балл"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
