import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game';

interface GameStore extends GameState {
  // Actions
  startGame: (team1Name: string, team2Name: string) => void;
  clickCell: (coordinate: string) => void;
  unclickCell: (coordinate: string) => void;
  answerCorrect: (points: number) => void;
  answerWrong: () => void;
  switchTurn: () => void;
  resetGame: () => void;
  loadSavedGame: (state: GameState) => void;
}

const initialState: GameState = {
  team1: { name: '', score: 0 },
  team2: { name: '', score: 0 },
  currentTurn: 1,
  clickedCells: [],
  gameStarted: false,
  timestamp: Date.now(),
};

export const useGameState = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      startGame: (team1Name: string, team2Name: string) =>
        set({
          team1: { name: team1Name, score: 0 },
          team2: { name: team2Name, score: 0 },
          currentTurn: 1,
          clickedCells: [],
          gameStarted: true,
          timestamp: Date.now(),
        }),

      clickCell: (coordinate: string) =>
        set((state) => ({
          clickedCells: [...state.clickedCells, coordinate],
          timestamp: Date.now(),
        })),

      unclickCell: (coordinate: string) =>
        set((state) => ({
          clickedCells: state.clickedCells.filter((cell) => cell !== coordinate),
          timestamp: Date.now(),
        })),

      answerCorrect: (points: number) =>
        set((state) => {
          if (state.currentTurn === 1) {
            return {
              team1: { ...state.team1, score: state.team1.score + points },
              timestamp: Date.now(),
            };
          } else {
            return {
              team2: { ...state.team2, score: state.team2.score + points },
              timestamp: Date.now(),
            };
          }
        }),

      answerWrong: () =>
        set((state) => ({
          currentTurn: state.currentTurn === 1 ? 2 : 1,
          timestamp: Date.now(),
        })),

      switchTurn: () =>
        set((state) => ({
          currentTurn: state.currentTurn === 1 ? 2 : 1,
          timestamp: Date.now(),
        })),

      resetGame: () =>
        set({
          ...initialState,
          timestamp: Date.now(),
        }),

      loadSavedGame: (state: GameState) => set(state),
    }),
    {
      name: 'battleship-game-state',
    }
  )
);
