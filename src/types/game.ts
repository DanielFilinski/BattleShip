export interface Team {
  name: string;
  score: number;
}

export interface GameState {
  team1: Team;
  team2: Team;
  currentTurn: 1 | 2;
  clickedCells: string[];
  gameStarted: boolean;
  timestamp: number;
}

export interface Ship {
  id: string;
  name: string;
  cells: string[];
  questionIds: string[];
}

export interface Bomb {
  cell: string;
  questionId: string;
}

export interface GameData {
  questions: any[];
  ships: Ship[];
  bombs: Bomb[];
}
