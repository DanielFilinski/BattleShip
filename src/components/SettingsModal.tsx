import { useState } from 'react';
import { useModalSettings } from '../hooks/useModalSettings';
import { useGameState } from '../hooks/useGameState';

interface SettingsModalProps {
  onToggleFullscreen: () => void;
  onOpenFieldSettings: () => void;
  onClose: () => void;
  isFullscreen: boolean;
}

export function SettingsModal({ onToggleFullscreen, onOpenFieldSettings, onClose, isFullscreen }: SettingsModalProps) {
  const { autoCloseModal, toggleAutoCloseModal, questionTimer, setQuestionTimer } = useModalSettings();
  const { viewMode, toggleViewMode, editMode, toggleEditMode } = useGameState();
  const [timerInput, setTimerInput] = useState(questionTimer.toString());

  const TIMER_PRESETS = [0, 30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-600 to-ocean-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span>
            Настройки
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => {
                onToggleFullscreen();
                onClose();
              }}
              className="w-full px-4 py-4 text-left hover:bg-ocean-50 transition-colors flex items-center gap-4 rounded-xl border-2 border-ocean-100 hover:border-ocean-300"
            >
              <span className="text-3xl">{isFullscreen ? '📊' : '⛶'}</span>
              <div className="flex-1">
                <div className="font-semibold text-ocean-700 text-lg">
                  {isFullscreen ? 'Показать панель' : 'Полный экран'}
                </div>
                <div className="text-sm text-ocean-500 mt-1">
                  {isFullscreen ? 'Вернуться к обычному виду' : 'Развернуть игровое поле'}
                </div>
              </div>
            </button>

            {/* Field Settings */}
            <button
              onClick={() => {
                onOpenFieldSettings();
                onClose();
              }}
              className="w-full px-4 py-4 text-left hover:bg-ocean-50 transition-colors flex items-center gap-4 rounded-xl border-2 border-ocean-100 hover:border-ocean-300"
            >
              <span className="text-3xl">📐</span>
              <div className="flex-1">
                <div className="font-semibold text-ocean-700 text-lg">Параметры поля</div>
                <div className="text-sm text-ocean-500 mt-1">Настроить размер игровой доски</div>
              </div>
            </button>

            {/* Auto Close Modal Toggle */}
            <button
              onClick={() => {
                toggleAutoCloseModal();
              }}
              className="w-full px-4 py-4 text-left hover:bg-ocean-50 transition-colors flex items-center gap-4 rounded-xl border-2 border-ocean-100 hover:border-ocean-300"
            >
              <span className="text-3xl">{autoCloseModal ? '⏱️' : '⏸️'}</span>
              <div className="flex-1">
                <div className="font-semibold text-ocean-700 text-lg">
                  Автозакрытие {autoCloseModal ? 'включено' : 'выключено'}
                </div>
                <div className="text-sm text-ocean-500 mt-1">
                  {autoCloseModal
                    ? 'Ответ закрывается автоматически через 2 сек'
                    : 'Ответ остается на экране'
                  }
                </div>
              </div>
            </button>

            {/* Question Timer */}
            <div className="px-4 py-4 rounded-xl border-2 border-ocean-100">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl">⏱</span>
                <div className="flex-1">
                  <div className="font-semibold text-ocean-700 text-lg">
                    Таймер вопроса
                  </div>
                  <div className="text-sm text-ocean-500">
                    {questionTimer === 0 ? 'Выключен' : `${questionTimer} сек — пикает по истечении`}
                  </div>
                </div>
              </div>
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {TIMER_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setQuestionTimer(preset);
                      setTimerInput(preset.toString());
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      questionTimer === preset
                        ? 'bg-ocean-600 text-white'
                        : 'bg-ocean-100 text-ocean-700 hover:bg-ocean-200'
                    }`}
                  >
                    {preset === 0 ? 'Выкл' : `${preset}с`}
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={timerInput}
                  onChange={e => setTimerInput(e.target.value)}
                  onBlur={() => {
                    const val = Math.max(0, Math.min(600, parseInt(timerInput) || 0));
                    setQuestionTimer(val);
                    setTimerInput(val.toString());
                  }}
                  className="w-24 border-2 border-ocean-200 rounded-lg px-3 py-1.5 text-ocean-800 font-semibold text-center focus:outline-none focus:border-ocean-500"
                />
                <span className="text-ocean-600 text-sm">сек (своё значение)</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <button
              onClick={() => {
                toggleViewMode();
              }}
              className="w-full px-4 py-4 text-left hover:bg-ocean-50 transition-colors flex items-center gap-4 rounded-xl border-2 border-ocean-100 hover:border-ocean-300"
            >
              <span className="text-3xl">{viewMode ? '👁️' : '🔒'}</span>
              <div className="flex-1">
                <div className="font-semibold text-ocean-700 text-lg">
                  Режим просмотра {viewMode ? 'включен' : 'выключен'}
                </div>
                <div className="text-sm text-ocean-500 mt-1">
                  {viewMode
                    ? 'Все корабли и бомбы видны'
                    : 'Корабли и бомбы скрыты'
                  }
                </div>
              </div>
            </button>

            {/* Edit Mode Toggle */}
            <button
              onClick={() => {
                toggleEditMode();
              }}
              className="w-full px-4 py-4 text-left hover:bg-ocean-50 transition-colors flex items-center gap-4 rounded-xl border-2 border-ocean-100 hover:border-ocean-300"
            >
              <span className="text-3xl">{editMode ? '✏️' : '🔐'}</span>
              <div className="flex-1">
                <div className="font-semibold text-ocean-700 text-lg">
                  Режим редактирования {editMode ? 'включен' : 'выключен'}
                </div>
                <div className="text-sm text-ocean-500 mt-1">
                  {editMode
                    ? 'Можно перемещать корабли и менять вопросы'
                    : 'Редактирование недоступно'
                  }
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ocean-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-ocean-600 text-white px-6 py-2 rounded-lg hover:bg-ocean-700 transition-colors font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
