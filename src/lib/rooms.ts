import { db } from './firebase';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import type { GameState } from '../types/game';

// 6-character room ID from unambiguous Cyrillic letters + digits
const CHARSET = 'АБВГДЕИКМНОРСТ123456789';

export function generateRoomId(length = 6): string {
  return Array.from(
    { length },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
}

export async function createRoom(roomId: string, initialState: Omit<GameState, 'history'>): Promise<void> {
  await set(ref(db, `rooms/${roomId}/state`), {
    teams: initialState.teams,
    currentTurn: initialState.currentTurn,
    clickedCells: initialState.clickedCells,
    answeredQuestions: initialState.answeredQuestions,
    gameStarted: initialState.gameStarted,
    gameMode: initialState.gameMode,
    viewMode: initialState.viewMode,
    editMode: initialState.editMode,
    timestamp: serverTimestamp(),
    history: [],
  });
  await set(ref(db, `rooms/${roomId}/session`), {
    adminCreatedAt: serverTimestamp(),
    currentQuestion: {
      questionId: null,
      coordinate: null,
      cellType: null,
      isOpen: false,
      answerRevealed: false,
    },
  });
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snap = await get(ref(db, `rooms/${roomId}/session/adminCreatedAt`));
  return snap.exists();
}
