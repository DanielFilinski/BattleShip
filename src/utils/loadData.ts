import { Question } from '../types/question';
import { Ship, Bomb } from '../types/game';

export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('/data/questions.json');
    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}

export async function loadShips(): Promise<Ship[]> {
  try {
    const response = await fetch('/data/ships.json');
    const data = await response.json();
    return data.ships;
  } catch (error) {
    console.error('Failed to load ships:', error);
    return [];
  }
}

export async function loadBombs(): Promise<Bomb[]> {
  try {
    const response = await fetch('/data/bombs.json');
    const data = await response.json();
    return data.bombs;
  } catch (error) {
    console.error('Failed to load bombs:', error);
    return [];
  }
}
