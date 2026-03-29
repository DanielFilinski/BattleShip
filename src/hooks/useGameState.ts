import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameSnapshot, Team } from '../types/game';
import { DEFAULT_TEAM_COLORS } from '../utils/teamColors';

interface GameStore extends GameState {
  // Actions
  startGame: (teamNames: string[], gameMode: string, teamColors?: string[]) => void;
  clickCell: (coordinate: string) => void;
  unclickCell: (coordinate: string) => void;
  answerCorrect: (points: number) => void;
  answerCorrectAllTeams: (points: number) => void;
  answerCorrectSpecificTeam: (teamIndex: number, points: number) => void;
  answerWrong: () => void;
  switchTurn: () => void;
  setTurn: (teamIndex: number) => void;
  resetGame: () => void;
  markQuestionAnswered: (questionId: string) => void;
  toggleViewMode: () => void;
  toggleEditMode: () => void;
  saveSnapshot: () => void;
  undoLastAction: () => void;
}

const DEFAULT_TEAMS: Team[] = [
  { name: '', score: 0, color: DEFAULT_TEAM_COLORS[0] },
  { name: '', score: 0, color: DEFAULT_TEAM_COLORS[1] },
];

const initialState: GameState = {
  teams: DEFAULT_TEAMS,
  currentTurn: 0,
  clickedCells: [],
  answeredQuestions: [],
  gameStarted: false,
  gameMode: 'choir',
  viewMode: false,
  editMode: false,
  timestamp: Date.now(),
  history: [],
};

export const useGameState = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      startGame: (teamNames: string[], gameMode: string, teamColors?: string[]) =>
        set({
          teams: teamNames.map((name, i) => ({
            name,
            score: 0,
            color: teamColors?.[i] || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length],
          })),
          currentTurn: 0,
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
          const newTeams = state.teams.map((team, idx) =>
            idx === state.currentTurn ? { ...team, score: team.score + points } : team
          );
          return { ...state, teams: newTeams, timestamp: Date.now() };
        }),

      answerCorrectAllTeams: (points: number) =>
        set((state) => ({
          ...state,
          teams: state.teams.map((team) => ({ ...team, score: team.score + points })),
          timestamp: Date.now(),
        })),

      answerCorrectSpecificTeam: (teamIndex: number, points: number) =>
        set((state) => {
          const newTeams = state.teams.map((team, idx) =>
            idx === teamIndex ? { ...team, score: team.score + points } : team
          );
          return { ...state, teams: newTeams, timestamp: Date.now() };
        }),

      answerWrong: () =>
        set((state) => ({
          currentTurn: (state.currentTurn + 1) % state.teams.length,
          timestamp: Date.now(),
        })),

      switchTurn: () =>
        set((state) => ({
          currentTurn: (state.currentTurn + 1) % state.teams.length,
          timestamp: Date.now(),
        })),

      setTurn: (teamIndex: number) =>
        set({
          currentTurn: teamIndex,
          timestamp: Date.now(),
        }),

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

      saveSnapshot: () =>
        set((state) => {
          const snapshot: GameSnapshot = {
            teams: state.teams,
            currentTurn: state.currentTurn,
            clickedCells: state.clickedCells,
            answeredQuestions: state.answeredQuestions,
          };
          const newHistory = [...state.history, snapshot];
          if (newHistory.length > 20) newHistory.shift();
          return { history: newHistory };
        }),

      undoLastAction: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const snapshot = newHistory.pop()!;
          return {
            ...snapshot,
            history: newHistory,
            timestamp: Date.now(),
          };
        }),
    }),
    {
      name: 'battleship-game-state',
    }
  )
);
