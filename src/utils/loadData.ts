import { Question } from '../types/question';
import { Ship, Bomb, GameMode } from '../types/game';

export async function loadGameModes(): Promise<GameMode[]> {
  try {
    const response = await fetch('/data/gameModes.json');
    const data = await response.json();
    return data.modes;
  } catch (error) {
    console.error('Failed to load game modes:', error);
    return [];
  }
}

export async function loadQuestions(mode?: string): Promise<Question[]> {
  try {
    const filename = mode ? `questions-${mode}.json` : 'questions.json';
    const response = await fetch(`/data/${filename}`);
    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}

export async function loadShips(mode?: string): Promise<Ship[]> {
  try {
    const filename = mode ? `ships-${mode}.json` : 'ships.json';
    const response = await fetch(`/data/${filename}`);
    const data = await response.json();
    return data.ships;
  } catch (error) {
    console.error('Failed to load ships:', error);
    return [];
  }
}

export async function loadBombs(mode: string = 'choir'): Promise<Bomb[]> {
  try {
    let filename = '/data/bombs.json';
    if (mode !== 'choir') {
      filename = `/data/bombs-${mode}.json`;
    }
    const response = await fetch(filename);
    const data = await response.json();
    return data.bombs;
  } catch (error) {
    console.error('Failed to load bombs:', error);
    return [];
  }
}
