import { checkIsAdmin, checkIsCoHost, getOrCreateUserId, getParticipantState } from '../lib/participant';

export interface ParticipantInfo {
  isAdmin: boolean;
  isCoHost: boolean; // second presenter: sees answers, but view-only (doesn't write state)
  myTeamIndex: number; // -1 = viewer only, -99 = admin (always can click)
  userId: string;
  roomId: string;
  hasChosen: boolean; // whether user has gone through TeamJoinModal
}

export function useParticipant(roomId: string): ParticipantInfo {
  const userId = getOrCreateUserId();
  const adminFlag = checkIsAdmin(roomId);
  const coHostFlag = !adminFlag && checkIsCoHost(roomId);
  const saved = getParticipantState(roomId);

  return {
    isAdmin: adminFlag,
    isCoHost: coHostFlag,
    myTeamIndex: adminFlag ? -99 : (saved?.teamIndex ?? -1),
    userId,
    roomId,
    // Co-host skips team selection — they only watch with answers visible.
    hasChosen: adminFlag || coHostFlag || saved !== null,
  };
}
