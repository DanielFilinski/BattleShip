import { GameState } from '../types/game';
import { Question } from '../types/question';

const STORAGE_KEY = 'battleship-game-state';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Функции для работы с API сервером
export async function sendCurrentQuestion(question: Question | null): Promise<void> {
  try {
    if (question) {
      await fetch(`${API_URL}/api/current-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, gameStarted: true })
      });
    } else {
      await fetch(`${API_URL}/api/current-question`, {
        method: 'DELETE'
      });
    }
  } catch (error) {
    console.warn('Failed to send question to API:', error);
  }
}

export async function sendGameStatus(started: boolean): Promise<void> {
  try {
    await fetch(`${API_URL}/api/game-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ started })
    });
  } catch (error) {
    console.warn('Failed to send game status to API:', error);
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return null;
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
