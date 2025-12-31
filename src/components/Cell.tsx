import { CellStatus } from '../types/cell';

interface CellProps {
  coordinate: string;
  status: CellStatus;
  onClick: (coordinate: string) => void;
  disabled: boolean;
  questionId?: string;
}

export function Cell({ coordinate, status, onClick, disabled, questionId }: CellProps) {
  const handleClick = () => {
    if (!disabled && (status === 'untouched' || status === 'view-ship' || status === 'view-bomb')) {
      onClick(coordinate);
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'miss':
        return 'bg-ocean-100 border-ocean-300';
      case 'hit':
        return 'bg-red-500 border-red-600';
      case 'sunk':
        return 'bg-gray-700 border-gray-900';
      case 'bomb':
        return 'bg-amber-500 border-amber-600';
      case 'view-ship':
        return 'bg-blue-200 border-blue-400 hover:bg-blue-300 hover:border-blue-500';
      case 'view-bomb':
        return 'bg-amber-200 border-amber-400 hover:bg-amber-300 hover:border-amber-500';
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
          <span className="text-3xl text-white animate-hit"></span>
        );
      case 'sunk':
        return (
          <span className="text-3xl text-white animate-hit">❌</span>
        );
      case 'bomb':
        return (
          <span className="text-3xl text-white animate-hit">💣</span>
        );
      case 'view-ship':
        return (
          <span className="text-xs font-bold text-blue-800">{questionId}</span>
        );
      case 'view-bomb':
        return (
          <span className="text-2xl">💣</span>
        );
      default:
        return null;
    }
  };

  const isClickable = (status === 'untouched' || status === 'view-ship' || status === 'view-bomb') && !disabled;

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
