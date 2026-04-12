import { checkIsAdmin, getOrCreateUserId, getParticipantState } from '../lib/participant';

export interface ParticipantInfo {
  isAdmin: boolean;
  myTeamIndex: number; // -1 = viewer only, -99 = admin (always can click)
  userId: string;
  roomId: string;
  hasChosen: boolean; // whether user has gone through TeamJoinModal
}

export function useParticipant(roomId: string): ParticipantInfo {
  const userId = getOrCreateUserId();
  const adminFlag = checkIsAdmin(roomId);
  const saved = getParticipantState(roomId);

  return {
    isAdmin: adminFlag,
    myTeamIndex: adminFlag ? -99 : (saved?.teamIndex ?? -1),
    userId,
    roomId,
    hasChosen: adminFlag || saved !== null,
  };
}
