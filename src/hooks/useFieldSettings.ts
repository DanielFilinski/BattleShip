import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FieldSettings {
  columns: number;
  rows: number;
  cellSize: number; // Size in pixels
}

interface FieldSettingsState extends FieldSettings {
  setFieldSize: (columns: number, rows: number) => void;
  setCellSize: (size: number) => void;
  getTotalCells: () => number;
}

export const useFieldSettings = create<FieldSettingsState>()(
  persist(
    (set, get) => ({
      columns: 10,
      rows: 10,
      cellSize: 60, // Default cell size in pixels
      setFieldSize: (columns: number, rows: number) => set({ columns, rows }),
      setCellSize: (size: number) => set({ cellSize: size }),
      getTotalCells: () => {
        const state = get();
        return state.columns * state.rows;
      },
    }),
    {
      name: 'battleship-field-settings',
    }
  )
);
