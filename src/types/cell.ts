export type CellType = 'empty' | 'ship' | 'bomb';
export type CellStatus = 'untouched' | 'miss' | 'hit' | 'bomb';

export interface CellData {
  coordinate: string;
  type: CellType;
  status: CellStatus;
  questionId?: string;
}
