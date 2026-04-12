import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { loadQuestions } from '../utils/loadData';
import type { Question } from '../types/question';
import type { Team } from '../types/game';
import type { RemoteQuestion } from '../hooks/useFirebaseSync';

const CATEGORY_ICONS: Record<string, string> = {
  'История': '📚', 'Музыка': '🎵', 'Природа': '🌿', 'Спорт': '⚽',
  'Наука': '🔬', 'Кино': '🎬', 'Еда': '🍕', 'Технологии': '💻',
  'Бомба': '💣', 'Творческое': '🎨',
};

export function DisplayScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const [remoteQuestion, setRemoteQuestion] = useState<RemoteQuestion | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameMode, setGameMode] = useState<string>('');

  // Subscribe to session/currentQuestion
  useEffect(() => {
    const sessionRef = ref(db, `rooms/${roomId}/session/currentQuestion`);
    const unsub = onValue(sessionRef, snapshot => {
      setRemoteQuestion(snapshot.val() ?? null);
    });
    return unsub;
  }, [roomId]);

  // Subscribe to game state (teams, scores, currentTurn, gameMode)
  useEffect(() => {
    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsub = onValue(stateRef, snapshot => {
      const state = snapshot.val();
      if (!state) return;
      setTeams(state.teams ?? []);
      setCurrentTurn(state.currentTurn ?? 0);
      if (state.gameMode && state.gameMode !== gameMode) {
        setGameMode(state.gameMode);
      }
    });
    return unsub;
  }, [roomId]);

  // Load questions when gameMode is known
  useEffect(() => {
    if (!gameMode) return;
    loadQuestions(gameMode).then(setQuestions);
  }, [gameMode]);

  const currentQuestion = remoteQuestion?.questionId
    ? questions.find(q => q.id === remoteQuestion.questionId) ?? null
    : null;

  // ─── Scoreboard (shown when no question is open) ──────────────────────────
  if (!remoteQuestion?.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex flex-col items-center justify-center p-8">
        <div className="text-white/60 text-xl mb-8 font-semibold tracking-widest uppercase">Морской Бой — Комната {roomId}</div>
        <div className="flex flex-wrap gap-6 justify-center max-w-4xl">
          {teams.map((team, i) => {
            const isActive = i === currentTurn;
            return (
              <div
                key={i}
                className={`bg-white/95 rounded-3xl p-8 text-center shadow-2xl transition-all ${isActive ? 'scale-110 ring-4 ring-white' : 'opacity-80'}`}
                style={{ minWidth: 200 }}
              >
                <div className="text-ocean-500 text-sm font-semibold mb-1">{isActive ? '▶ ХОД' : `КОМАНДА ${i + 1}`}</div>
                <div className="text-2xl font-bold text-ocean-800 mb-2">{team.name}</div>
                <div className="text-6xl font-black" style={{ color: team.color }}>{team.score}</div>
                <div className="text-ocean-400 text-sm mt-1">баллов</div>
              </div>
            );
          })}
        </div>
        <div className="mt-12 text-white/40 text-lg">Ожидание следующего вопроса...</div>
      </div>
    );
  }

  // ─── Question shown (answer not yet revealed) ─────────────────────────────
  if (remoteQuestion.isOpen && !remoteQuestion.answerRevealed) {
    const categoryIcon = currentQuestion ? (CATEGORY_ICONS[currentQuestion.category] ?? '❓') : '❓';
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex flex-col items-center justify-center p-12">
        {currentQuestion && (
          <div className="max-w-4xl w-full">
            {/* Category + points */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-5xl">{categoryIcon}</span>
              <span className="text-white/80 text-2xl font-semibold">{currentQuestion.category}</span>
              <span className="bg-white/20 text-white font-black text-2xl px-4 py-2 rounded-xl">{currentQuestion.points} балл(а)</span>
            </div>
            {/* Question text */}
            <div className="bg-white/95 rounded-3xl p-12 shadow-2xl text-center">
              <div className="text-4xl font-bold text-ocean-900 leading-tight">{currentQuestion.question}</div>
              {currentQuestion.questionImages && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {(Array.isArray(currentQuestion.questionImages)
                    ? currentQuestion.questionImages
                    : [currentQuestion.questionImages]
                  ).map((src, i) => (
                    <img key={i} src={src} alt="" className="max-h-64 rounded-xl object-contain shadow" />
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 text-center text-white/50 text-xl animate-pulse">Ожидание ответа...</div>
          </div>
        )}
      </div>
    );
  }

  // ─── Answer revealed ──────────────────────────────────────────────────────
  if (remoteQuestion.isOpen && remoteQuestion.answerRevealed && currentQuestion) {
    const categoryIcon = CATEGORY_ICONS[currentQuestion.category] ?? '❓';
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex flex-col items-center justify-center p-12">
        <div className="max-w-4xl w-full">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-5xl">{categoryIcon}</span>
            <span className="text-white/80 text-2xl font-semibold">{currentQuestion.category}</span>
          </div>
          {/* Question */}
          <div className="bg-white/20 rounded-2xl p-6 text-center mb-6">
            <div className="text-white/80 text-2xl">{currentQuestion.question}</div>
          </div>
          {/* Answer */}
          <div className="bg-white rounded-3xl p-10 shadow-2xl text-center animate-in zoom-in duration-500">
            <div className="text-ocean-500 text-lg font-semibold mb-3 uppercase tracking-wide">Правильный ответ</div>
            <div className="text-4xl font-black text-ocean-900 leading-tight">{currentQuestion.answer}</div>
            {currentQuestion.answerImages && (
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                {(Array.isArray(currentQuestion.answerImages)
                  ? currentQuestion.answerImages
                  : [currentQuestion.answerImages]
                ).map((src, i) => (
                  <img key={i} src={src} alt="" className="max-h-64 rounded-xl object-contain shadow" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
