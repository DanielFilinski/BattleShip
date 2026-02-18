import { useState, useEffect, useRef } from 'react';
import { Question } from '../types/question';
import { MediaPlayer } from './MediaPlayer';
import { useModalSettings } from '../hooks/useModalSettings';
import { sendCurrentQuestion } from '../utils/storage';

interface QuestionModalProps {
  question: Question;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  onTransfer: () => void;
  onClose: () => void;
  team1Name: string;
  team2Name: string;
  onTeamAnswer: (teamNumber: 1 | 2 | 0) => void; // 0 = никому
  viewMode?: boolean;
  currentTurn: 1 | 2;
}

export function QuestionModal({
  question,
  onCorrect: _onCorrect,
  onWrong: _onWrong,
  onSkip,
  onTransfer,
  onClose,
  team1Name,
  team2Name,
  onTeamAnswer,
  viewMode = false,
  currentTurn,
}: QuestionModalProps) {
  const [showAnswer, setShowAnswer] = useState(viewMode);
  const [answered, setAnswered] = useState(false);
  const [answeringTeam, setAnsweringTeam] = useState<1 | 2 | 0 | null>(null);
  const { autoCloseModal } = useModalSettings();
  const timeoutRef = useRef<number | null>(null);

  // Auto-show answer in view mode
  useEffect(() => {
    if (viewMode) {
      setShowAnswer(true);
    }
  }, [viewMode]);

  // Save current question to localStorage and API for external display
  useEffect(() => {
    localStorage.setItem('currentQuestion', JSON.stringify(question));
    sendCurrentQuestion(question); // Отправляем на сервер
    
    return () => {
      // Clear when modal closes
      localStorage.removeItem('currentQuestion');
      sendCurrentQuestion(null); // Очищаем на сервере
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
    // НЕ закрываем модал - вопрос остается на экране
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleTeamAnswer = (teamNumber: 1 | 2 | 0) => {
    setAnswered(true);
    setAnsweringTeam(teamNumber);
    
    // Всегда вызываем onTeamAnswer для начисления баллов
    onTeamAnswer(teamNumber);

    // Автозакрытие только если включено
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

          {/* Question */}
          <div className="bg-ocean-50 rounded-2xl p-8 mb-6">
            <div className="text-3xl font-bold text-ocean-900 text-center leading-relaxed">
              {question.question}
            </div>
          </div>

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
                🤝 Совместное задание! Обе команды получат по {question.points} {question.points === 1 ? 'баллу' : 'балла'}!
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
              {answeringTeam !== null && (
                <div className="text-center mb-4 p-3 bg-white/50 rounded-xl">
                  <div className="text-lg font-bold text-ocean-800">
                    {answeringTeam === 1 ? `Отвечает: ${team1Name}` : answeringTeam === 2 ? `Отвечает: ${team2Name}` : 'Никто не ответил правильно'}
                  </div>
                </div>
              )}
              <div className="text-sm font-semibold text-ocean-600 mb-2 uppercase">
                Правильный ответ:
              </div>
              <div className="text-2xl font-bold text-ocean-900 mb-4">
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
                      className="rounded-xl overflow-hidden shadow-lg bg-white"
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
                  ))};
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
              {/* Show Answer Button - показывается когда ответ не показан */}
              {!showAnswer && (
                <div className="space-y-3">
                  <button
                    onClick={handleShowAnswer}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-2xl font-bold py-6 px-8 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    👁️ Показать ответ
                  </button>
                  
                  {/* Пропустить и Передать - когда вопрос показан */}
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

              {/* Team Answer Buttons - показывается после показа ответа */}
              {showAnswer && (
                <div className="space-y-3">
                  <div className="text-center text-ocean-700 font-semibold text-lg mb-2">
                    Кто ответил правильно?
                  </div>
                  {/* Кнопки команд в один ряд */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleTeamAnswer(1)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-2xl font-bold py-5 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      {currentTurn === 1 ? '✓ ' : ''}{team1Name}
                    </button>
                    <button
                      onClick={() => handleTeamAnswer(2)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-2xl font-bold py-5 px-4 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      {currentTurn === 2 ? '✓ ' : ''}{team2Name}
                    </button>
                  </div>
                  {/* Никому и Пропустить в один ряд */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleTeamAnswer(0)}
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
