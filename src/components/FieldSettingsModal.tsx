import { useState } from 'react';

interface FieldSettingsModalProps {
  currentColumns: number;
  currentRows: number;
  currentCellSize: number;
  onSave: (columns: number, rows: number, cellSize: number) => void;
  onClose: () => void;
}

export function FieldSettingsModal({ currentColumns, currentRows, currentCellSize, onSave, onClose }: FieldSettingsModalProps) {
  const [columns, setColumns] = useState(currentColumns);
  const [rows, setRows] = useState(currentRows);
  const [cellSize, setCellSize] = useState(currentCellSize);

  const handleSave = () => {
    if (columns >= 5 && columns <= 20 && rows >= 5 && rows <= 20 && cellSize >= 30 && cellSize <= 100) {
      onSave(columns, rows, cellSize);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-ocean-700 flex items-center gap-2">
            <span>📐</span>
            Параметры поля
          </h2>
          <button
            onClick={handleCancel}
            className="text-ocean-400 hover:text-ocean-600 transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <p className="text-ocean-600 mb-6">
          Настройте размер игрового поля и размер ячеек в полноэкранном режиме. Изменения применятся при следующей игре.
        </p>

        {/* Columns Setting */}
        <div className="mb-6">
          <label className="block text-ocean-700 font-semibold mb-2">
            Количество столбцов: {columns}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            className="w-full h-2 bg-ocean-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-ocean-500 mt-1">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        {/* Rows Setting */}
        <div className="mb-6">
          <label className="block text-ocean-700 font-semibold mb-2">
            Количество строк: {rows}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="w-full h-2 bg-ocean-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-ocean-500 mt-1">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        {/* Cell Size Setting */}
        <div className="mb-6">
          <label className="block text-ocean-700 font-semibold mb-2">
            Размер ячейки (полный экран): {cellSize}px
          </label>
          <input
            type="range"
            min="30"
            max="100"
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
            className="w-full h-2 bg-ocean-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-ocean-500 mt-1">
            <span>30px (компактно)</span>
            <span>100px (крупно)</span>
          </div>
          <p className="text-xs text-ocean-500 mt-2">
            Максимальный размер ячеек в полноэкранном режиме
          </p>
        </div>

        {/* Preview */}
        <div className="bg-ocean-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-ocean-600 mb-2">Информация о поле:</div>
          <div className="text-2xl font-bold text-ocean-700 mb-2">
            {columns} × {rows} = {columns * rows} ячеек
          </div>
          <div className="text-sm text-ocean-600">
            Макс. размер в полноэкранном режиме: {columns * cellSize}px × {rows * cellSize}px
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-ocean-100 text-ocean-700 font-semibold py-3 px-6 rounded-xl hover:bg-ocean-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-ocean-600 to-ocean-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-ocean-700 hover:to-ocean-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Сохранить
          </button>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0e7490;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0e7490;
          cursor: pointer;
          border: none;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
