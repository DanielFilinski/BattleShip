import { useState } from 'react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';
import { setParticipantState } from '../lib/participant';
import { getTeamColor } from '../utils/teamColors';
import type { Team } from '../types/game';

interface TeamJoinModalProps {
  teams: Team[];
  roomId: string;
  userId: string;
  onJoin: (teamIndex: number) => void;
}

export function TeamJoinModal({ teams, roomId, userId, onJoin }: TeamJoinModalProps) {
  const [saving, setSaving] = useState(false);

  const handleJoin = async (teamIndex: number) => {
    setSaving(true);
    try {
      setParticipantState(roomId, { teamIndex, userId });
      await set(ref(db, `rooms/${roomId}/participants/${userId}`), {
        teamIndex,
        joinedAt: serverTimestamp(),
      });
      onJoin(teamIndex);
    } catch (err) {
      console.error('Failed to join:', err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚓</div>
          <h2 className="text-2xl font-bold text-ocean-800">Добро пожаловать!</h2>
          <p className="text-ocean-600 mt-2">Выберите свою роль в игре</p>
        </div>

        <div className="space-y-3">
          {/* Team buttons */}
          {teams.map((team, index) => {
            const color = getTeamColor(team, index);
            return (
              <button
                key={index}
                onClick={() => handleJoin(index)}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-current transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                <div className="text-2xl">🎯</div>
                <div className="text-left">
                  <div className="font-bold text-lg">{team.name}</div>
                  <div className="text-sm opacity-80">Стрелять за эту команду</div>
                </div>
              </button>
            );
          })}

          {/* Viewer button */}
          <button
            onClick={() => handleJoin(-1)}
            disabled={saving}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-ocean-200 bg-ocean-50 hover:bg-ocean-100 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-ocean-700"
          >
            <div className="text-2xl">👁️</div>
            <div className="text-left">
              <div className="font-bold text-lg">Смотреть</div>
              <div className="text-sm text-ocean-500">Наблюдать за игрой</div>
            </div>
          </button>
        </div>

        {saving && (
          <div className="mt-4 text-center text-ocean-500 text-sm animate-pulse">
            Подключение...
          </div>
        )}
      </div>
    </div>
  );
}
