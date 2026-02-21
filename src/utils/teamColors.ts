import { CSSProperties } from 'react';

export const TEAM_COLOR_OPTIONS = [
  { hex: '#10b981', name: 'Изумрудный' },
  { hex: '#3b82f6', name: 'Синий' },
  { hex: '#8b5cf6', name: 'Фиолетовый' },
  { hex: '#f59e0b', name: 'Янтарный' },
  { hex: '#f43f5e', name: 'Розовый' },
  { hex: '#06b6d4', name: 'Голубой' },
  { hex: '#ef4444', name: 'Красный' },
  { hex: '#f97316', name: 'Оранжевый' },
  { hex: '#ec4899', name: 'Фуксия' },
  { hex: '#6366f1', name: 'Индиго' },
  { hex: '#14b8a6', name: 'Бирюзовый' },
  { hex: '#84cc16', name: 'Лаймовый' },
];

// Default colors assigned by team index
export const DEFAULT_TEAM_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('');
}

function adjustBrightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

export function getTeamActiveStyle(color: string): CSSProperties {
  const darker = adjustBrightness(color, -30);
  const lighter = adjustBrightness(color, 30);
  return {
    background: `linear-gradient(to bottom right, ${color}, ${darker})`,
    borderColor: lighter,
    boxShadow: `0 25px 50px -12px ${color}80`,
  };
}

export function getTeamButtonStyle(color: string): CSSProperties {
  const darker = adjustBrightness(color, -20);
  return {
    background: `linear-gradient(to right, ${darker}, ${color})`,
  };
}

export function getTeamColor(team: { color?: string }, index: number): string {
  return team.color || DEFAULT_TEAM_COLORS[index % DEFAULT_TEAM_COLORS.length];
}
