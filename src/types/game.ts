export interface Team {
  name: string;
  score: number;
}

export interface GameState {
  team1: Team;
  team2: Team;
  currentTurn: 1 | 2;
  clickedCells: string[];
  answeredQuestions: string[]; // IDs of questions that have been answered
  gameStarted: boolean;
  viewMode: boolean; // View mode to show all ships and bombs
  editMode: boolean; // Edit mode to move ships and reassign questions
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

export interface GameMode {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface GameData {
  questions: any[];
  ships: Ship[];
  bombs: Bomb[];
}
