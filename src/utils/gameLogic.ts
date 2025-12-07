import { Ship, Bomb } from '../types/game';
import { CellType } from '../types/cell';

export const COLUMNS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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

export function generateAllCoordinates(): string[] {
  const coordinates: string[] = [];
  for (const col of COLUMNS) {
    for (const row of ROWS) {
      coordinates.push(`${col}${row}`);
    }
  }
  return coordinates;
}

export function isGameOver(clickedCells: string[]): boolean {
  // Game is over when all 100 cells are clicked
  return clickedCells.length >= 100;
}
