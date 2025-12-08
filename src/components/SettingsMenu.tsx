interface SettingsMenuProps {
  onOpenSettings: () => void;
  isFullscreen: boolean;
}

export function SettingsMenu({ onOpenSettings, isFullscreen }: SettingsMenuProps) {
  return (
    <button
      onClick={onOpenSettings}
      className={`${
        isFullscreen
          ? 'w-full px-3 py-2 text-left hover:bg-ocean-50 transition-colors flex items-center gap-2 rounded-lg'
          : 'bg-white/90 backdrop-blur-sm text-ocean-700 font-semibold py-2 px-4 rounded-xl hover:bg-white transition-all shadow-lg flex items-center gap-2'
      }`}
      title="Настройки"
    >
      <span className={isFullscreen ? 'text-lg' : 'text-xl'}>⚙️</span>
      <span className={isFullscreen ? 'text-sm font-semibold text-ocean-700' : 'hidden sm:inline'}>
        Настройки
      </span>
    </button>
  );
}
