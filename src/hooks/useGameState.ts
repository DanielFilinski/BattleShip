import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game';

interface GameStore extends GameState {
  // Actions
  startGame: (team1Name: string, team2Name: string, gameMode: string) => void;
  clickCell: (coordinate: string) => void;
  unclickCell: (coordinate: string) => void;
  answerCorrect: (points: number) => void;
  answerCorrectBothTeams: (points: number) => void;
  answerCorrectSpecificTeam: (teamNumber: 1 | 2, points: number) => void;
  answerWrong: () => void;
  switchTurn: () => void;
  resetGame: () => void;
  loadSavedGame: (state: GameState) => void;
  markQuestionAnswered: (questionId: string) => void;
  toggleViewMode: () => void;
  toggleEditMode: () => void;
}

const initialState: GameState = {
  team1: { name: '', score: 0 },
  team2: { name: '', score: 0 },
  currentTurn: 1,
  clickedCells: [],
  answeredQuestions: [],
  gameStarted: false,
  gameMode: 'choir',
  viewMode: false,
  editMode: false,
  timestamp: Date.now(),
};

export const useGameState = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      startGame: (team1Name: string, team2Name: string, gameMode: string) =>
        set({
          team1: { name: team1Name, score: 0 },
          team2: { name: team2Name, score: 0 },
          currentTurn: 1,
          clickedCells: [],
          answeredQuestions: [],
          gameStarted: true,
          gameMode: gameMode,
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
              ...state,
              team1: { ...state.team1, score: state.team1.score + points },
              timestamp: Date.now(),
            };
          } else {
            return {
              ...state,
              team2: { ...state.team2, score: state.team2.score + points },
              timestamp: Date.now(),
            };
          }
        }),

      answerCorrectBothTeams: (points: number) =>
        set((state) => ({
          ...state,
          team1: { ...state.team1, score: state.team1.score + points },
          team2: { ...state.team2, score: state.team2.score + points },
          timestamp: Date.now(),
        })),

      answerCorrectSpecificTeam: (teamNumber: 1 | 2, points: number) =>
        set((state) => {
          if (teamNumber === 1) {
            return {
              ...state,
              team1: { ...state.team1, score: state.team1.score + points },
              timestamp: Date.now(),
            };
          } else {
            return {
              ...state,
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

      markQuestionAnswered: (questionId: string) =>
        set((state) => ({
          answeredQuestions: [...state.answeredQuestions, questionId],
          timestamp: Date.now(),
        })),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: !state.viewMode,
          timestamp: Date.now(),
        })),

      toggleEditMode: () =>
        set((state) => ({
          editMode: !state.editMode,
          // Auto-enable viewMode when enabling editMode
          viewMode: !state.editMode ? true : state.viewMode,
          timestamp: Date.now(),
        })),

      loadSavedGame: (state: GameState) => set(state),
    }),
    {
      name: 'battleship-game-state',
    }
  )
);
