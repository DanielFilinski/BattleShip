interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Да',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmModalProps) {
  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          bgColor: 'from-red-600 to-red-500',
          hoverColor: 'hover:from-red-700 hover:to-red-600',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'from-blue-600 to-blue-500',
          hoverColor: 'hover:from-blue-700 hover:to-blue-600',
        };
      default:
        return {
          icon: '❓',
          bgColor: 'from-amber-600 to-amber-500',
          hoverColor: 'hover:from-amber-700 hover:to-amber-600',
        };
    }
  };

  const { icon, bgColor, hoverColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="text-6xl">{icon}</div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-ocean-900 text-center mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-lg text-ocean-700 text-center mb-8">
            {message}
          </p>

          {/* Buttons */}
          <div className={`flex gap-4 ${!cancelText ? 'justify-center' : ''}`}>
            {cancelText && (
              <button
                onClick={onCancel}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 text-white text-lg font-bold py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`${cancelText ? 'flex-1' : 'px-12'} bg-gradient-to-r ${bgColor} text-white text-lg font-bold py-4 px-6 rounded-xl ${hoverColor} transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
