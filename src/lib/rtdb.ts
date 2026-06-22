// ─────────────────────────────────────────────────────────────────────────────
// Единая точка доступа к realtime-базе. Выбирает бэкенд во время сборки:
//
//   VITE_BACKEND=local  → локальный сервер по WebSocket (игра без интернета)
//   (по умолчанию)      → Firebase Realtime Database (онлайн, деплой на Vercel)
//
// Весь остальной код импортирует ref/set/get/onValue/... отсюда, а не напрямую
// из 'firebase/database', поэтому переключение режима не требует правок логики.
// ─────────────────────────────────────────────────────────────────────────────

import * as fb from 'firebase/database';
import { db as fbDb } from './firebase';
import { firebaseShim, localDb } from './localBackend';

const isLocal = import.meta.env.VITE_BACKEND === 'local';

// firebaseShim повторяет нужные функции один-в-один; типы берём от firebase.
const impl = (isLocal ? firebaseShim : fb) as unknown as typeof fb;

export const db = (isLocal ? (localDb as unknown) : fbDb) as fb.Database;
export const ref = impl.ref;
export const set = impl.set;
export const get = impl.get;
export const onValue = impl.onValue;
export const remove = impl.remove;
export const update = impl.update;
export const runTransaction = impl.runTransaction;
export const serverTimestamp = impl.serverTimestamp;
