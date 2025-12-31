export type CellType = 'empty' | 'ship' | 'bomb';
export type CellStatus = 'untouched' | 'miss' | 'hit' | 'bomb' | 'sunk' | 'view-ship' | 'view-bomb';

export interface CellData {
  coordinate: string;
  type: CellType;
  status: CellStatus;
  questionId?: string;
}
