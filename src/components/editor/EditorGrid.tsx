import { useState, useCallback } from 'react';
import { ALL_COLUMNS } from '../../utils/gameLogic';
import { generateItemId, type EditorShip, type EditorBomb, type EditorQuestion } from '../../lib/editorStorage';

interface EditorGridProps {
  ships: Record<string, EditorShip>;
  bombs: Record<string, EditorBomb>;
  questions: Record<string, EditorQuestion>;
  gridCols: number;
  gridRows: number;
  onShipsChange: (ships: Record<string, EditorShip>) => void;
  onBombsChange: (bombs: Record<string, EditorBomb>) => void;
  onAddShip: (name: string, size: number) => string;
  onDeleteShip: (id: string) => void;
}

type Mode = 'idle' | 'placing' | 'bomb';

const SHIP_TEMPLATES = [
  { label: '4 палубы', size: 4, icon: '🚢' },
  { label: '3 палубы', size: 3, icon: '⛵' },
  { label: '2 палубы', size: 2, icon: '🛥' },
  { label: '1 палуба', size: 1, icon: '⛵' },
];

const SHIP_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#0EA5E9', '#EC4899', '#14B8A6',
];

function coordToIndex(coord: string, cols: string[]): { col: number; row: number } | null {
  const col = cols.indexOf(coord.slice(0, 1));
  const row = parseInt(coord.slice(1), 10) - 1;
  if (col === -1 || isNaN(row)) return null;
  return { col, row };
}

function indexToCoord(col: number, row: number, cols: string[]): string {
  return `${cols[col]}${row + 1}`;
}

function getPlacementCells(
  anchorCol: number,
  anchorRow: number,
  size: number,
  horizontal: boolean,
  cols: string[],
  rows: number
): string[] | null {
  const cells: string[] = [];
  for (let i = 0; i < size; i++) {
    const c = horizontal ? anchorCol + i : anchorCol;
    const r = horizontal ? anchorRow : anchorRow + i;
    if (c >= cols.length || r >= rows) return null;
    cells.push(indexToCoord(c, r, cols));
  }
  return cells;
}

function getShipColor(shipId: string, ships: Record<string, EditorShip>): string {
  const ids = Object.keys(ships).sort();
  const idx = ids.indexOf(shipId);
  return SHIP_COLORS[idx % SHIP_COLORS.length];
}

export function EditorGrid({
  ships,
  bombs,
  questions,
  gridCols,
  gridRows,
  onShipsChange,
  onBombsChange,
  onAddShip,
  onDeleteShip,
}: EditorGridProps) {
  const cols = ALL_COLUMNS.slice(0, gridCols);
  const rows = Array.from({ length: gridRows }, (_, i) => i);

  const [editorMode, setEditorMode] = useState<Mode>('idle');
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null); // ship being placed/moved
  const [pendingSize, setPendingSize] = useState<number>(0); // size of ship being placed (if new)
  const [pendingName, setPendingName] = useState<string>(''); // name of new ship
  const [horizontal, setHorizontal] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addSize, setAddSize] = useState(3);

  // Build cell map for quick lookup
  const cellMap: Record<string, { type: 'ship'; shipId: string; deckIndex: number } | { type: 'bomb'; bombId: string }> = {};
  for (const [sid, ship] of Object.entries(ships)) {
    ship.cells.forEach((cell, di) => {
      cellMap[cell] = { type: 'ship', shipId: sid, deckIndex: di };
    });
  }
  for (const [bid, bomb] of Object.entries(bombs)) {
    cellMap[bomb.cell] = { type: 'bomb', bombId: bid };
  }

  // Preview cells for current hover
  const previewCells: Set<string> = new Set();
  let previewValid = false;
  if (editorMode === 'placing' && selectedShipId && hoveredCell) {
    const anchor = coordToIndex(hoveredCell, cols);
    const ship = ships[selectedShipId];
    const size = ship ? ship.questionIds.length : pendingSize;
    if (anchor) {
      const cells = getPlacementCells(anchor.col, anchor.row, size, horizontal, cols, gridRows);
      if (cells) {
        const occupiedByOther = cells.some((c) => {
          const entry = cellMap[c];
          return entry && !(entry.type === 'ship' && entry.shipId === selectedShipId);
        });
        if (!occupiedByOther) {
          cells.forEach((c) => previewCells.add(c));
          previewValid = true;
        }
      }
    }
  }

  const handleCellClick = useCallback(
    (coord: string) => {
      if (editorMode === 'bomb') {
        const existing = cellMap[coord];
        if (existing?.type === 'bomb') {
          // Remove bomb
          const newBombs = { ...bombs };
          delete newBombs[existing.bombId];
          onBombsChange(newBombs);
        } else if (!existing) {
          // Add bomb
          const id = generateItemId('bomb');
          onBombsChange({ ...bombs, [id]: { id, cell: coord, questionId: '' } });
        }
        return;
      }

      if (editorMode === 'placing' && selectedShipId) {
        const anchor = coordToIndex(coord, cols);
        const ship = ships[selectedShipId];
        const size = ship ? ship.questionIds.length : pendingSize;
        if (!anchor) return;
        const cells = getPlacementCells(anchor.col, anchor.row, size, horizontal, cols, gridRows);
        if (!cells) return;
        const occupiedByOther = cells.some((c) => {
          const entry = cellMap[c];
          return entry && !(entry.type === 'ship' && entry.shipId === selectedShipId);
        });
        if (occupiedByOther) return;

        const newShips = { ...ships };
        newShips[selectedShipId] = {
          ...newShips[selectedShipId],
          cells,
        };
        onShipsChange(newShips);
        setEditorMode('idle');
        setSelectedShipId(null);
        return;
      }

      // Idle: click on ship cell to select it for moving
      const entry = cellMap[coord];
      if (entry?.type === 'ship') {
        setSelectedShipId(entry.shipId);
        setEditorMode('placing');
      }
    },
    [editorMode, selectedShipId, ships, bombs, cols, gridRows, horizontal, cellMap, onShipsChange, onBombsChange, pendingSize]
  );

  const startPlacingNewShip = (name: string, size: number) => {
    const id = onAddShip(name, size);
    setSelectedShipId(id);
    setPendingSize(size);
    setPendingName(name);
    setEditorMode('placing');
    setShowAddForm(false);
  };

  const startPlacingExistingShip = (shipId: string) => {
    setSelectedShipId(shipId);
    setEditorMode('placing');
  };

  const cancelPlacing = () => {
    setEditorMode('idle');
    setSelectedShipId(null);
  };

  const getCellStyle = (coord: string) => {
    const entry = cellMap[coord];
    const isPreview = previewCells.has(coord);
    const isSelected = entry?.type === 'ship' && entry.shipId === selectedShipId;

    if (isPreview) {
      return previewValid
        ? 'bg-indigo-500/60 border-indigo-400'
        : 'bg-red-500/40 border-red-400';
    }
    if (entry?.type === 'bomb') {
      return 'bg-orange-500/80 border-orange-400 text-white';
    }
    if (entry?.type === 'ship') {
      return isSelected ? 'border-2 border-white/80' : '';
    }
    return 'bg-slate-700/40 border-slate-600/40 hover:bg-slate-600/50';
  };

  const getCellBgColor = (coord: string): string | undefined => {
    const entry = cellMap[coord];
    if (entry?.type === 'ship' && !previewCells.has(coord)) {
      return getShipColor(entry.shipId, ships);
    }
    return undefined;
  };

  const getCellContent = (coord: string): string => {
    const entry = cellMap[coord];
    if (entry?.type === 'bomb') return '💣';
    if (entry?.type === 'ship') {
      const ship = ships[entry.shipId];
      const qId = ship?.questionIds[entry.deckIndex];
      const hasQ = qId && questions[qId];
      return hasQ ? '❓' : '';
    }
    return '';
  };

  const shipList = Object.values(ships);
  const unplacedShips = shipList.filter((s) => s.cells.length === 0);
  const placedShips = shipList.filter((s) => s.cells.length > 0);

  return (
    <div className="flex gap-0 h-full min-h-0">
      {/* Left panel: ship palette */}
      <div className="w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto flex flex-col gap-4">
        {/* Mode controls */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setEditorMode(editorMode === 'bomb' ? 'idle' : 'bomb');
              setSelectedShipId(null);
            }}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              editorMode === 'bomb'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            💣 {editorMode === 'bomb' ? 'Режим бомб (активен)' : 'Режим бомб'}
          </button>

          {editorMode === 'placing' && (
            <div className="flex gap-2">
              <button
                onClick={() => setHorizontal(!horizontal)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
              >
                {horizontal ? '→ Горизонт.' : '↓ Верт.'}
              </button>
              <button
                onClick={cancelPlacing}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        {editorMode === 'placing' && selectedShipId && (
          <div className="text-indigo-300 text-xs bg-indigo-950/50 rounded-lg px-3 py-2">
            Кликните на поле для размещения корабля «{ships[selectedShipId]?.name ?? pendingName}»
          </div>
        )}
        {editorMode === 'bomb' && (
          <div className="text-orange-300 text-xs bg-orange-950/50 rounded-lg px-3 py-2">
            Кликайте по пустым клеткам чтобы добавить бомбы. По бомбе — удалить.
          </div>
        )}

        {/* Add ship */}
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Корабли</div>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-indigo-700/50 hover:bg-indigo-700 text-indigo-200 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              + Добавить корабль
            </button>
          ) : (
            <div className="bg-slate-700 rounded-xl p-3 space-y-2">
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Название корабля"
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex gap-2 items-center">
                <span className="text-slate-400 text-xs">Размер:</span>
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setAddSize(s)}
                      className={`flex-1 py-1.5 rounded text-sm font-bold transition-colors ${
                        addSize === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setAddName(''); }}
                  className="flex-1 bg-slate-600 text-slate-300 text-sm py-1.5 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (addName.trim()) {
                      startPlacingNewShip(addName.trim(), addSize);
                      setAddName('');
                    }
                  }}
                  disabled={!addName.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm py-1.5 rounded-lg transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ship templates for quick add */}
        <div className="flex flex-col gap-1">
          {SHIP_TEMPLATES.map((t) => (
            <button
              key={t.size}
              onClick={() => {
                const name = `${t.icon} ${t.label}`;
                startPlacingNewShip(name, t.size);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
            >
              <span className="flex gap-0.5">
                {Array(t.size).fill(0).map((_, i) => (
                  <span key={i} className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />
                ))}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Placed ships list */}
        {placedShips.length > 0 && (
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Размещены</div>
            <div className="flex flex-col gap-1.5">
              {placedShips.map((ship) => (
                <div
                  key={ship.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedShipId === ship.id && editorMode === 'placing'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getShipColor(ship.id, ships) }}
                  />
                  <span className="flex-1 truncate font-medium">{ship.name}</span>
                  <span className="text-slate-500">{ship.cells.length}п</span>
                  <button
                    onClick={() => startPlacingExistingShip(ship.id)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Переместить"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => {
                      if (selectedShipId === ship.id) cancelPlacing();
                      onDeleteShip(ship.id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unplaced ships */}
        {unplacedShips.length > 0 && (
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Не размещены</div>
            <div className="flex flex-col gap-1.5">
              {unplacedShips.map((ship) => (
                <div key={ship.id} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg text-xs">
                  <span className="flex-1 truncate text-slate-400">{ship.name}</span>
                  <button
                    onClick={() => startPlacingExistingShip(ship.id)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Разместить
                  </button>
                  <button
                    onClick={() => onDeleteShip(ship.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto text-slate-500 text-xs space-y-0.5 border-t border-slate-700 pt-3">
          <div>Кораблей: {shipList.length} (размещено: {placedShips.length})</div>
          <div>Бомб: {Object.keys(bombs).length}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        <div>
          {/* Column headers */}
          <div className="flex mb-1">
            <div className="w-8" />
            {cols.map((col) => (
              <div
                key={col}
                className="w-10 h-6 flex items-center justify-center text-slate-400 text-xs font-bold"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((rowIdx) => (
            <div key={rowIdx} className="flex mb-0.5">
              {/* Row header */}
              <div className="w-8 h-10 flex items-center justify-center text-slate-400 text-xs font-bold">
                {rowIdx + 1}
              </div>

              {/* Cells */}
              {cols.map((col) => {
                const coord = `${col}${rowIdx + 1}`;
                const isPreview = previewCells.has(coord);
                const bgColor = getCellBgColor(coord);
                const content = getCellContent(coord);

                return (
                  <div
                    key={coord}
                    className={`w-10 h-10 border rounded-sm flex items-center justify-center text-base cursor-pointer select-none transition-colors mr-0.5 ${getCellStyle(coord)}`}
                    style={bgColor ? { backgroundColor: bgColor + 'cc', borderColor: bgColor } : undefined}
                    onMouseEnter={() => setHoveredCell(coord)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(coord)}
                  >
                    {isPreview ? (
                      <div className="w-full h-full" />
                    ) : (
                      <span className="text-xs leading-none">{content}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
