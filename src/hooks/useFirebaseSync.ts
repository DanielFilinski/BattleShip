import { useEffect, useState, useCallback } from 'react';
import { ref, set, onValue, serverTimestamp, runTransaction } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameState } from './useGameState';
import { useFieldSettings } from './useFieldSettings';

export interface RemoteQuestion {
  questionId: string | null;
  coordinate: string | null;
  cellType: 'ship' | 'bomb' | 'empty' | null;
  isOpen: boolean;
  answerRevealed: boolean;
}

const EMPTY_REMOTE_QUESTION: RemoteQuestion = {
  questionId: null,
  coordinate: null,
  cellType: null,
  isOpen: false,
  answerRevealed: false,
};

interface UseFirebaseSyncOptions {
  roomId: string;
  isAdmin: boolean;
}

interface UseFirebaseSyncResult {
  remoteQuestion: RemoteQuestion;
  writeSession: (q: RemoteQuestion) => Promise<void>;
  clearSession: () => Promise<void>;
  /** For participant: writes coordinate + cellType to Firebase to trigger admin's modal */
  participantShoot: (coordinate: string, cellType: 'ship' | 'bomb' | 'empty', questionId: string | null) => Promise<void>;
}

export function useFirebaseSync({ roomId, isAdmin }: UseFirebaseSyncOptions): UseFirebaseSyncResult {
  const [remoteQuestion, setRemoteQuestion] = useState<RemoteQuestion>(EMPTY_REMOTE_QUESTION);

  // ─── Admin: subscribe to Zustand state changes → write to Firebase ───────────
  useEffect(() => {
    if (!isAdmin) return;

    // useGameState.subscribe() runs outside React render cycle — no infinite loop risk
    const unsub = useGameState.subscribe((state) => {
      const { columns, rows } = useFieldSettings.getState();
      const stateRef = ref(db, `rooms/${roomId}/state`);
      set(stateRef, {
        teams: state.teams,
        currentTurn: state.currentTurn,
        clickedCells: state.clickedCells,
        answeredQuestions: state.answeredQuestions,
        gameStarted: state.gameStarted,
        gameMode: state.gameMode,
        viewMode: state.viewMode,
        editMode: state.editMode,
        fieldColumns: columns,
        fieldRows: rows,
        timestamp: serverTimestamp(),
        history: [], // never sync history — admin keeps it locally
      }).catch(console.error);
    });

    return unsub;
  }, [isAdmin, roomId]);

  // ─── Viewer/Participant: subscribe to Firebase state → update Zustand ─────────
  useEffect(() => {
    if (isAdmin) return;

    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsub = onValue(stateRef, (snapshot) => {
      const remote = snapshot.val();
      if (!remote) return;

      // Directly set Zustand state (bypasses actions to avoid triggering admin subscriber)
      useGameState.setState({
        teams: remote.teams ?? [],
        currentTurn: remote.currentTurn ?? 0,
        clickedCells: remote.clickedCells ?? [],
        answeredQuestions: remote.answeredQuestions ?? [],
        gameStarted: remote.gameStarted ?? false,
        gameMode: remote.gameMode ?? '',
        viewMode: remote.viewMode ?? false,
        editMode: remote.editMode ?? false,
        timestamp: remote.timestamp ?? Date.now(),
        history: [], // viewers never need history
      });

      // Sync field dimensions so participants see the same grid as the admin
      if (remote.fieldColumns && remote.fieldRows) {
        useFieldSettings.getState().setFieldSize(remote.fieldColumns, remote.fieldRows);
      }
    });

    return unsub; // Firebase v9: onValue returns unsubscribe function
  }, [isAdmin, roomId]);

  // ─── Both: subscribe to session/currentQuestion ───────────────────────────────
  useEffect(() => {
    const sessionRef = ref(db, `rooms/${roomId}/session/currentQuestion`);
    const unsub = onValue(sessionRef, (snapshot) => {
      const q = snapshot.val();
      if (!q) {
        setRemoteQuestion(EMPTY_REMOTE_QUESTION);
        return;
      }
      setRemoteQuestion({
        questionId: q.questionId ?? null,
        coordinate: q.coordinate ?? null,
        cellType: q.cellType ?? null,
        isOpen: q.isOpen ?? false,
        answerRevealed: q.answerRevealed ?? false,
      });
    });

    return unsub;
  }, [roomId]);

  // ─── Helper: admin writes session (e.g. to reveal answer) ────────────────────
  const writeSession = useCallback(async (q: RemoteQuestion) => {
    await set(ref(db, `rooms/${roomId}/session/currentQuestion`), q);
  }, [roomId]);

  const clearSession = useCallback(async () => {
    await set(ref(db, `rooms/${roomId}/session/currentQuestion`), EMPTY_REMOTE_QUESTION);
  }, [roomId]);

  // ─── Participant shoot: write coordinate to Firebase session ─────────────────
  // Admin's GameBoard watches remoteQuestion changes and processes the shot
  const participantShoot = useCallback(async (
    coordinate: string,
    cellType: 'ship' | 'bomb' | 'empty',
    questionId: string | null
  ) => {
    // Use transaction on clickedCells to prevent double-click race condition
    const clickedRef = ref(db, `rooms/${roomId}/state/clickedCells`);
    const committed = await runTransaction(clickedRef, (current: string[] | null) => {
      if (current && current.includes(coordinate)) return; // abort: already clicked
      return [...(current ?? []), coordinate];
    });

    if (!committed.committed) return; // Another client won the race

    // Signal the admin via session
    await set(ref(db, `rooms/${roomId}/session/currentQuestion`), {
      questionId,
      coordinate,
      cellType,
      isOpen: cellType !== 'empty',
      answerRevealed: false,
    });
  }, [roomId]);

  return { remoteQuestion, writeSession, clearSession, participantShoot };
}
