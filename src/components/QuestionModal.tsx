import { useState, useEffect, useRef, useCallback } from 'react';
import { Question } from '../types/question';
import { MediaPlayer } from './MediaPlayer';
import { useModalSettings } from '../hooks/useModalSettings';
import { sendCurrentQuestion } from '../utils/storage'; // kept for offline/Electron mode
import { getTeamButtonStyle, getTeamColor } from '../utils/teamColors';

import type { RemoteQuestion } from '../hooks/useFirebaseSync';

interface QuestionModalProps {
  question: Question;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  onTransfer: () => void;
  onClose: () => void;
  teams: { name: string; score: number; color?: string }[];
  onTeamAnswer: (teamIndex: number | null) => void; // null = никому
  viewMode?: boolean;
  currentTurn: number;
  // Online multiplayer (optional)
  isAdmin?: boolean;
  roomId?: string;
  onWriteSession?: (q: RemoteQuestion) => Promise<void>;
  onClearSession?: () => Promise<void>;
}

export function QuestionModal({
  question,
  onCorrect: _onCorrect,
  onWrong: _onWrong,
  onSkip,
  onTransfer,
  onClose,
  teams,
  onTeamAnswer,
  viewMode = false,
  currentTurn,
  isAdmin = true,
  roomId: _roomId,
  onWriteSession,
  onClearSession: _onClearSession,
}: QuestionModalProps) {
  const [showAnswer, setShowAnswer] = useState(viewMode);
  const [answered, setAnswered] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [answeringTeamIndex, setAnsweringTeamIndex] = useState<number | null | -1>(-1); // -1 = not yet
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const { autoCloseModal, questionTimer, autoStartTimer } = useModalSettings();
  // Effective timer: use question's thinkingTime if set, otherwise fall back to settings
  const effectiveTimer = question.thinkingTime ?? questionTimer;
  const [timerStarted, setTimerStarted] = useState(!viewMode && effectiveTimer > 0 && autoStartTimer);
  const timeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeeps = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const beepCount = 5;
      const beepDuration = 0.15;
      const beepGap = 0.15;
      for (let i = 0; i < beepCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        const startAt = ctx.currentTime + i * (beepDuration + beepGap);
        gain.gain.setValueAtTime(0.5, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + beepDuration);
        osc.start(startAt);
        osc.stop(startAt + beepDuration);
      }
    } catch {
      // AudioContext not available
    }
  }, []);

  // Start countdown timer when timerStarted becomes true
  useEffect(() => {
    if (viewMode || effectiveTimer <= 0 || !timerStarted) return;

    setTimeLeft(effectiveTimer);
    setTimerExpired(false);

    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimerExpired(true);
          playBeeps();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [effectiveTimer, viewMode, playBeeps, timerStarted]);

  // Resume countdown after +30 when timer was expired
  useEffect(() => {
    if (!timerExpired || timerIntervalRef.current) return;
    if (timeLeft === null || timeLeft <= 0) return;
    // timeLeft was set > 0 by the +30 button while expired — restart interval
    setTimerExpired(false);
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimerExpired(true);
          playBeeps();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timeLeft, timerExpired, playBeeps]);

  // Stop timer when answer is shown or answered
  useEffect(() => {
    if ((showAnswer || answered) && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [showAnswer, answered]);

  // Auto-show answer in view mode
  useEffect(() => {
    if (viewMode) {
      setShowAnswer(true);
    }
  }, [viewMode]);

  // Save current question to localStorage and API for external display
  useEffect(() => {
    localStorage.setItem('currentQuestion', JSON.stringify(question));
    sendCurrentQuestion(question);

    return () => {
      localStorage.removeItem('currentQuestion');
      sendCurrentQuestion(null);
    };
  }, [question]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const handleTransfer = () => {
    onTransfer();
    // Don't close modal — question stays on screen
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleTeamAnswer = (teamIndex: number | null) => {
    setAnswered(true);
    setAnsweringTeamIndex(teamIndex === null ? -1 : teamIndex);

    onTeamAnswer(teamIndex);

    if (autoCloseModal) {
      timeoutRef.current = window.setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const getCategoryIcon = () => {
    const icons: { [key: string]: string } = {
      'История': '📚',
      'География': '🌍',
      'Наука': '🔬',
      'Литература': '📖',
      'Спорт': '⚽',
      'Кино': '🎬',
      'Музыка': '🎵',
      'Искусство': '🎨',
      'Технологии': '💻',
      'Еда': '🍕',
      'Животные': '🦁',
      'Математика': '🔢',
      'Творчество': '🎭',
      'Бонус': '💎',
      'Бомба': '💣',
    };
    return icons[question.category] || '❓';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Полный размер"
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-4xl font-bold leading-none hover:text-gray-300 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getCategoryIcon()}</span>
              <div>
                <div className="text-sm font-semibold text-ocean-600 uppercase">
                  {question.category}
                </div>
                <div className="text-2xl font-bold text-ocean-800">
                  {question.points} баллов
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Timer */}
              {!viewMode && effectiveTimer > 0 && !answered && !showAnswer && (
                <div className="flex items-center gap-2">
                  {timerStarted && timeLeft !== null && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTimeLeft(prev => prev !== null ? Math.max(0, prev - 30) : prev)}
                        className="w-8 h-8 rounded-full bg-ocean-100 hover:bg-ocean-200 text-ocean-700 font-bold text-sm flex items-center justify-center transition-colors"
                        title="-30 сек"
                      >
                        −
                      </button>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xl tabular-nums transition-colors ${
                        timerExpired
                          ? 'bg-red-600 text-white animate-pulse'
                          : timeLeft <= 10
                          ? 'bg-red-100 text-red-700'
                          : timeLeft <= 20
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-ocean-100 text-ocean-700'
                      }`}>
                        <span>⏱</span>
                        <span>{timerExpired ? '0' : timeLeft}</span>
                      </div>
                      <button
                        onClick={() => setTimeLeft(prev => prev !== null ? prev + 30 : prev)}
                        className="w-8 h-8 rounded-full bg-ocean-100 hover:bg-ocean-200 text-ocean-700 font-bold text-sm flex items-center justify-center transition-colors"
                        title="+30 сек"
                      >
                        +
                      </button>
                    </div>
                  )}
                  {!timerStarted && (
                    <button
                      onClick={() => setTimerStarted(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm bg-ocean-600 hover:bg-ocean-700 text-white transition-colors"
                    >
                      <span>▶</span>
                      <span>Старт</span>
                    </button>
                  )}
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  question.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : question.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {question.difficulty === 'easy'
                  ? 'Легкий'
                  : question.difficulty === 'medium'
                  ? 'Средний'
                  : 'Сложный'}
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-ocean-50 rounded-2xl p-8 mb-6">
            <div className="text-3xl font-bold text-ocean-900 text-center leading-relaxed whitespace-pre-line">
              {question.question}
            </div>
          </div>

          {/* Question Images */}
          {question.questionImages && (
            <div className={`mb-6 ${
              Array.isArray(question.questionImages) && question.questionImages.length > 1
                ? 'grid grid-cols-2 gap-4'
                : 'flex justify-center'
            }`}>
              {(Array.isArray(question.questionImages)
                ? question.questionImages
                : [question.questionImages]
              ).map((imagePath, index) => (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden shadow-lg bg-white cursor-zoom-in"
                  onClick={() => setLightboxSrc(`/media/${imagePath}`)}
                >
                  <img
                    src={`/media/${imagePath}`}
                    alt={`Вопрос ${index + 1}`}
                    className="w-full h-auto object-contain max-h-96"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Media Player */}
          {question.mediaPath && (
            <MediaPlayer type={question.type} mediaPath={question.mediaPath} />
          )}

          {/* Creative Task Hint */}
          {question.type === 'creative' && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <p className="text-center text-amber-800 font-semibold">
                🎭 Творческое задание! Оцените выступление команды.
              </p>
            </div>
          )}

          {/* Together Task Hint */}
          {question.type === 'together' && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4">
              <p className="text-center text-blue-800 font-semibold text-lg">
                🤝 Совместное задание! Все команды получат по {question.points} {question.points === 1 ? 'баллу' : 'балла'}!
              </p>
            </div>
          )}

          {/* Answer Section */}
          {showAnswer && (
            <div
              className={`mb-6 rounded-2xl p-6 animate-in slide-in-from-top duration-300 ${
                answered
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300'
                  : 'bg-ocean-50'
              }`}
            >
              {answeringTeamIndex !== -1 && (
                <div className="text-center mb-4 p-3 bg-white/50 rounded-xl">
                  <div className="text-lg font-bold text-ocean-800">
                    {answeringTeamIndex === null
                      ? 'Никто не ответил правильно'
                      : `Отвечает: ${teams[answeringTeamIndex as number]?.name}`}
                  </div>
                </div>
              )}
              <div className="text-sm font-semibold text-ocean-600 mb-2 uppercase">
                Правильный ответ:
              </div>
              <div className="text-2xl font-bold text-ocean-900 mb-4 whitespace-pre-line">
                {question.answer}
              </div>

              {/* Answer Images */}
              {question.answerImages && (
                <div className={`mt-4 ${
                  Array.isArray(question.answerImages) && question.answerImages.length > 1
                    ? 'grid grid-cols-2 gap-4'
                    : 'flex justify-center'
                }`}>
                  {(Array.isArray(question.answerImages)
                    ? question.answerImages
                    : [question.answerImages]
                  ).map((imagePath, index) => (
                    <div
                      key={index}
                      className="rounded-xl overflow-hidden shadow-lg bg-white cursor-zoom-in"
                      onClick={() => setLightboxSrc(`/media/${imagePath}`)}
                    >
                      <img
                        src={`/media/${imagePath}`}
                        alt={`Ответ ${index + 1}`}
                        className="w-full h-auto object-contain max-h-96"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Video */}
              {question.answerVideoPath && (
                <div className="mt-4">
                  <div className="rounded-xl overflow-hidden shadow-lg bg-white p-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-xl">🎬</span>
                      <span className="text-base font-semibold text-ocean-700">
                        Видео к ответу
                      </span>
                    </div>
                    <video
                      controls
                      className="w-full rounded-lg max-h-96"
                      src={`/media/${question.answerVideoPath}`}
                      preload="metadata"
                    >
                      Ваш браузер не поддерживает видео.
                    </video>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Host Controls */}
          {!answered && !viewMode && (
            <div className="space-y-4">
              {/* Show Answer Button */}
              {!showAnswer && (
                <div className="space-y-3">
                  <button
                    onClick={handleShowAnswer}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-2xl font-bold py-6 px-8 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    👁️ Показать ответ
                  </button>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSkip}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-400 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ⏭ Пропустить
                    </button>
                    <button
                      onClick={handleTransfer}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ↔ Передать
                    </button>
                  </div>
                </div>
              )}

              {/* "Show on display screen" button — only for admin in online mode, after answer is shown */}
              {isAdmin && showAnswer && onWriteSession && (
                <button
                  onClick={() => onWriteSession({
                    questionId: question.id,
                    coordinate: null,
                    cellType: null,
                    isOpen: true,
                    answerRevealed: true,
                  })}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  📺 Показать ответ на экране
                </button>
              )}

              {/* Team Answer Buttons */}
              {showAnswer && (
                <div className="space-y-3">
                  <div className="text-center text-ocean-700 font-semibold text-lg mb-2">
                    Кто ответил правильно?
                  </div>
                  {/* Team buttons — wrap in grid for many teams */}
                  <div className={`grid gap-3 ${teams.length <= 2 ? 'grid-cols-2' : teams.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {teams.map((team, index) => (
                      <button
                        key={index}
                        onClick={() => handleTeamAnswer(index)}
                        className="text-white text-xl font-bold py-5 px-4 rounded-xl transition-all transform hover:scale-105 hover:brightness-110 active:scale-95 shadow-lg"
                        style={getTeamButtonStyle(getTeamColor(team, index))}
                      >
                        {currentTurn === index ? '✓ ' : ''}{team.name}
                      </button>
                    ))}
                  </div>
                  {/* Nobody + Skip */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleTeamAnswer(null)}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 text-white text-xl font-bold py-4 px-4 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ✗ Никому
                    </button>
                    <button
                      onClick={handleSkip}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-400 text-white text-lg font-semibold py-3 px-4 rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ⏭ Пропустить
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Mode - Simple Close Button */}
          {viewMode && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-ocean-700 hover:to-ocean-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                ✓ Закрыть
              </button>
            </div>
          )}

          {/* Answered State */}
          {answered && (
            <div className="text-center">
              {autoCloseModal ? (
                <div className="text-ocean-600 text-lg font-semibold animate-pulse">
                  Закрывается автоматически...
                </div>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-ocean-700 hover:to-ocean-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  ✓ Закрыть
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
