import { Ship, Bomb } from '../types/game';
import { CellType } from '../types/cell';

export const ALL_COLUMNS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф'];

export function generateColumns(count: number): string[] {
  return ALL_COLUMNS.slice(0, count);
}

export function generateRows(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

// Default values for backward compatibility
export const COLUMNS = generateColumns(10);
export const ROWS = generateRows(10);

export function getCellType(
  coordinate: string,
  ships: Ship[],
  bombs: Bomb[]
): { type: CellType; questionId?: string } {
  // Check if cell is a bomb
  const bomb = bombs.find(b => b.cell === coordinate);
  if (bomb) {
    return { type: 'bomb', questionId: bomb.questionId };
  }

  // Check if cell is part of a ship
  for (const ship of ships) {
    const cellIndex = ship.cells.indexOf(coordinate);
    if (cellIndex !== -1) {
      return { type: 'ship', questionId: ship.questionIds[cellIndex] };
    }
  }

  // Cell is empty
  return { type: 'empty' };
}

export function generateAllCoordinates(columns: string[] = COLUMNS, rows: number[] = ROWS): string[] {
  const coordinates: string[] = [];
  for (const col of columns) {
    for (const row of rows) {
      coordinates.push(`${col}${row}`);
    }
  }
  return coordinates;
}

export function isGameOver(clickedCells: string[], totalCells: number = 100): boolean {
  // Game is over when all cells are clicked
  return clickedCells.length >= totalCells;
}
