import { useGameState } from '../hooks/useGameState';

// Color palette for teams
const TEAM_ACTIVE_STYLES = [
  'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 shadow-emerald-500/50',
  'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-blue-500/50',
  'bg-gradient-to-br from-violet-500 to-violet-600 border-violet-400 shadow-violet-500/50',
  'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 shadow-amber-500/50',
  'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 shadow-rose-500/50',
  'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400 shadow-cyan-500/50',
];
const TEAM_SCORE_COLORS = [
  'text-emerald-600',
  'text-blue-600',
  'text-violet-600',
  'text-amber-600',
  'text-rose-600',
  'text-cyan-600',
];

export function ScoreBoard() {
  const { teams, currentTurn } = useGameState();

  return (
    <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
      {teams.map((team, index) => {
        const isActive = currentTurn === index;
        return (
          <div
            key={index}
            className={`flex-1 min-w-[120px] rounded-2xl shadow-xl p-6 border-4 transition-all duration-300 ${
              isActive
                ? `${TEAM_ACTIVE_STYLES[index % TEAM_ACTIVE_STYLES.length]} scale-105 shadow-2xl`
                : 'bg-white border-ocean-200'
            }`}
          >
            <div className="text-center">
              <div className={`text-sm font-semibold mb-1 ${isActive ? 'text-white' : 'text-ocean-600'}`}>
                {isActive && '▶️ '}КОМАНДА {index + 1}
              </div>
              <div className={`text-2xl font-bold mb-2 ${isActive ? 'text-white' : 'text-ocean-800'}`}>
                {team.name}
              </div>
              <div className={`text-5xl font-black ${isActive ? 'text-white' : TEAM_SCORE_COLORS[index % TEAM_SCORE_COLORS.length]}`}>
                {team.score}
              </div>
              <div className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-ocean-500'}`}>БАЛЛОВ</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
