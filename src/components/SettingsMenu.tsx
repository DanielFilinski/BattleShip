import { useState, useRef, useEffect } from 'react';
import { useModalSettings } from '../hooks/useModalSettings';

interface SettingsMenuProps {
  onToggleFullscreen: () => void;
  onOpenFieldSettings: () => void;
  isFullscreen: boolean;
}

export function SettingsMenu({ onToggleFullscreen, onOpenFieldSettings, isFullscreen }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { autoCloseModal, toggleAutoCloseModal } = useModalSettings();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  return (
    <div className="relative" ref={menuRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm text-ocean-700 font-semibold py-2 px-4 rounded-xl hover:bg-white transition-all shadow-lg flex items-center gap-2"
        title="Настройки"
      >
        <span className="text-xl">⚙️</span>
        <span className="hidden sm:inline">Настройки</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-ocean-100">
          <div className="py-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => {
                onToggleFullscreen();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-ocean-50 transition-colors flex items-center gap-3"
            >
              <span className="text-xl">{isFullscreen ? '📊' : '⛶'}</span>
              <div>
                <div className="font-semibold text-ocean-700">
                  {isFullscreen ? 'Показать панель' : 'Полный экран'}
                </div>
                <div className="text-xs text-ocean-500">
                  {isFullscreen ? 'Вернуться к обычному виду' : 'Развернуть игровое поле'}
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-ocean-100 my-1"></div>

            {/* Field Settings */}
            <button
              onClick={() => {
                onOpenFieldSettings();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-ocean-50 transition-colors flex items-center gap-3"
            >
              <span className="text-xl">📐</span>
              <div>
                <div className="font-semibold text-ocean-700">Параметры поля</div>
                <div className="text-xs text-ocean-500">Настроить размер игровой доски</div>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-ocean-100 my-1"></div>

            {/* Auto Close Modal Toggle */}
            <button
              onClick={() => {
                toggleAutoCloseModal();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-ocean-50 transition-colors flex items-center gap-3"
            >
              <span className="text-xl">{autoCloseModal ? '⏱️' : '⏸️'}</span>
              <div>
                <div className="font-semibold text-ocean-700">
                  Автозакрытие {autoCloseModal ? 'включено' : 'выключено'}
                </div>
                <div className="text-xs text-ocean-500">
                  {autoCloseModal
                    ? 'Ответ закрывается автоматически через 2 сек'
                    : 'Ответ остается на экране'
                  }
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
