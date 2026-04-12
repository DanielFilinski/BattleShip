import { ref, set, get, remove, update } from 'firebase/database';
import { db } from './firebase';

export const CUSTOM_MODE_PREFIX = 'custom_';

export interface CustomModeMeta {
  id: string;
  name: string;
  description: string;
  color: string;
  gridColumns: number;
  gridRows: number;
  createdAt: number;
}

export interface EditorShip {
  id: string;
  name: string;
  cells: string[];        // e.g. ["А1", "А2", "А3"]
  questionIds: string[];  // same length as cells; "" = unlinked
}

export interface EditorBomb {
  id: string;
  cell: string;
  questionId: string; // "" = unlinked
}

export interface EditorQuestion {
  id: string;
  category: string;
  type: string;
  difficulty: string;
  points: number;
  question: string;
  answer: string;
}

export interface CustomModeData {
  meta: CustomModeMeta;
  ships: Record<string, EditorShip>;
  bombs: Record<string, EditorBomb>;
  questions: Record<string, EditorQuestion>;
}

export function generateCustomModeId(): string {
  return `${CUSTOM_MODE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function generateItemId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function listCustomModes(): Promise<CustomModeMeta[]> {
  try {
    const snapshot = await get(ref(db, 'customModes'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val() as Record<string, CustomModeData>;
    return Object.values(data)
      .map((m) => m.meta)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getCustomMode(modeId: string): Promise<CustomModeData | null> {
  try {
    const snapshot = await get(ref(db, `customModes/${modeId}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return {
      meta: data.meta ?? {},
      ships: data.ships ?? {},
      bombs: data.bombs ?? {},
      questions: data.questions ?? {},
    };
  } catch {
    return null;
  }
}

export async function createCustomMode(
  meta: Omit<CustomModeMeta, 'id' | 'createdAt'>
): Promise<string> {
  const id = generateCustomModeId();
  const fullMeta: CustomModeMeta = { ...meta, id, createdAt: Date.now() };
  await set(ref(db, `customModes/${id}/meta`), fullMeta);
  await set(ref(db, `customModes/${id}/ships`), {});
  await set(ref(db, `customModes/${id}/bombs`), {});
  await set(ref(db, `customModes/${id}/questions`), {});
  return id;
}

export async function saveCustomMode(modeId: string, data: Partial<CustomModeData>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (data.meta) updates[`customModes/${modeId}/meta`] = data.meta;
  if (data.ships !== undefined) updates[`customModes/${modeId}/ships`] = data.ships;
  if (data.bombs !== undefined) updates[`customModes/${modeId}/bombs`] = data.bombs;
  if (data.questions !== undefined) updates[`customModes/${modeId}/questions`] = data.questions;
  await update(ref(db), updates);
}

export async function deleteCustomMode(modeId: string): Promise<void> {
  await remove(ref(db, `customModes/${modeId}`));
}
