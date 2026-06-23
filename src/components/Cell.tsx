import { CellStatus } from '../types/cell';

interface CellProps {
  coordinate: string;
  status: CellStatus;
  onClick: (coordinate: string) => void;
  disabled: boolean;
  questionId?: string;
  editMode?: boolean;
}

export function Cell({ coordinate, status, onClick, disabled, questionId, editMode = false }: CellProps) {
  const handleClick = () => {
    if (editMode && (status === 'view-ship' || status === 'view-bomb')) {
      onClick(coordinate);
    } else if (!disabled && (status === 'untouched' || status === 'view-ship' || status === 'view-bomb')) {
      onClick(coordinate);
    }
  };

  const getStatusStyles = () => {
    const baseStyle = (() => {
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
    })();

    if (editMode && (status === 'view-ship' || status === 'view-bomb')) {
      return `${baseStyle} ring-2 ring-purple-400 ring-offset-1`;
    }

    return baseStyle;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'miss':
        return (
          <span className="leading-none text-[70cqw] text-ocean-600 animate-miss">✕</span>
        );
      case 'hit':
        return (
          <span className="leading-none text-[70cqw] text-white animate-hit"></span>
        );
      case 'sunk':
        return (
          <span className="leading-none text-[62cqw] text-white animate-hit">❌</span>
        );
      case 'bomb':
        return (
          <span className="leading-none text-[62cqw] text-white animate-hit">💣</span>
        );
      case 'view-ship':
        return (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-blue-800">{questionId}</span>
            {editMode && <span className="text-xs">✏️</span>}
          </div>
        );
      case 'view-bomb':
        return (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-xl">💣</span>
            <span className="text-xs font-bold text-amber-800">{questionId}</span>
            {editMode && <span className="text-xs">✏️</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const isClickable = editMode
    ? (status === 'view-ship' || status === 'view-bomb')
    : (status === 'untouched' || status === 'view-ship' || status === 'view-bomb') && !disabled;

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      style={{ containerType: 'inline-size' }}
      className={`
        w-full aspect-square border-2 rounded-lg flex items-center justify-center overflow-hidden
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
