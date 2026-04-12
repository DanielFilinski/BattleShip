// Generates a persistent anonymous userId per browser session
export function getOrCreateUserId(): string {
  const existing = localStorage.getItem('battleship-userId');
  if (existing) return existing;
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem('battleship-userId', id);
  return id;
}

// Per-room admin flag
export function setAdminFlag(roomId: string): void {
  localStorage.setItem(`admin_${roomId}`, 'true');
}

export function checkIsAdmin(roomId: string): boolean {
  return localStorage.getItem(`admin_${roomId}`) === 'true';
}

// Per-room participant state
export interface ParticipantState {
  teamIndex: number; // -1 = viewer only
  userId: string;
}

export function getParticipantState(roomId: string): ParticipantState | null {
  const raw = localStorage.getItem(`participant_${roomId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParticipantState;
  } catch {
    return null;
  }
}

export function setParticipantState(roomId: string, state: ParticipantState): void {
  localStorage.setItem(`participant_${roomId}`, JSON.stringify(state));
}
