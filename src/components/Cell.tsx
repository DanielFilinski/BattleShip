import { CellStatus } from '../types/cell';

interface CellProps {
  coordinate: string;
  status: CellStatus;
  onClick: (coordinate: string) => void;
  disabled: boolean;
}

export function Cell({ coordinate, status, onClick, disabled }: CellProps) {
  const handleClick = () => {
    if (!disabled && status === 'untouched') {
      onClick(coordinate);
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'miss':
        return 'bg-ocean-100 border-ocean-300';
      case 'hit':
        return 'bg-red-500 border-red-600';
      case 'bomb':
        return 'bg-amber-500 border-amber-600';
      default:
        return 'bg-ocean-50 border-ocean-200 hover:bg-ocean-100 hover:border-ocean-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'miss':
        return (
          <span className="text-3xl text-ocean-600 animate-miss">✕</span>
        );
      case 'hit':
        return (
          <span className="text-3xl text-white animate-hit">🎯</span>
        );
      case 'bomb':
        return (
          <span className="text-3xl text-white animate-hit">💣</span>
        );
      default:
        return null;
    }
  };

  const isClickable = status === 'untouched' && !disabled;

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={`
        w-full aspect-square border-2 rounded-lg flex items-center justify-center
        transition-all duration-200 transform
        ${getStatusStyles()}
        ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'}
        ${status === 'untouched' ? 'hover:scale-105' : ''}
      `}
      aria-label={`Cell ${coordinate}`}
    >
      {getStatusIcon()}
    </button>
  );
}
