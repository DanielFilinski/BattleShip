import { Question } from '../types/question';
import { Ship, Bomb, GameMode } from '../types/game';
import { CUSTOM_MODE_PREFIX, listCustomModes, getCustomMode } from '../lib/editorStorage';

export async function loadGameModes(): Promise<GameMode[]> {
  try {
    const [staticResponse, customModes] = await Promise.all([
      fetch('/data/gameModes.json').then((r) => r.json()),
      listCustomModes().catch(() => []),
    ]);
    const staticModes: GameMode[] = staticResponse.modes ?? [];
    const customGameModes: GameMode[] = customModes.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      color: m.color,
    }));
    return [...staticModes, ...customGameModes];
  } catch (error) {
    console.error('Failed to load game modes:', error);
    return [];
  }
}

export async function loadQuestions(mode?: string): Promise<Question[]> {
  if (mode?.startsWith(CUSTOM_MODE_PREFIX)) {
    try {
      const data = await getCustomMode(mode);
      if (!data) return [];
      return Object.values(data.questions).map((q) => ({
        id: q.id,
        category: q.category,
        type: q.type as Question['type'],
        difficulty: q.difficulty as Question['difficulty'],
        points: q.points,
        question: q.question,
        answer: q.answer,
      }));
    } catch {
      return [];
    }
  }
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
  if (mode?.startsWith(CUSTOM_MODE_PREFIX)) {
    try {
      const data = await getCustomMode(mode);
      if (!data) return [];
      return Object.values(data.ships).map((s) => ({
        id: s.id,
        name: s.name,
        cells: s.cells,
        questionIds: s.questionIds,
      }));
    } catch {
      return [];
    }
  }
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

export async function loadBombs(mode?: string): Promise<Bomb[]> {
  if (mode?.startsWith(CUSTOM_MODE_PREFIX)) {
    try {
      const data = await getCustomMode(mode);
      if (!data) return [];
      return Object.values(data.bombs).map((b) => ({
        cell: b.cell,
        questionId: b.questionId,
      }));
    } catch {
      return [];
    }
  }
  try {
    const filename = mode ? `bombs-${mode}.json` : 'bombs.json';
    const response = await fetch(`/data/${filename}`);
    const data = await response.json();
    return data.bombs;
  } catch (error) {
    console.error('Failed to load bombs:', error);
    return [];
  }
}
