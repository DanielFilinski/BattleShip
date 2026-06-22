// ─────────────────────────────────────────────────────────────────────────────
// Клиент локального realtime-бэкенда (для игры БЕЗ интернета).
//
// Повторяет тот поднабор API firebase/database, который реально использует
// приложение: ref / set / get / onValue / remove / update / runTransaction /
// serverTimestamp. Общается с local-server.js по WebSocket (/rtdb).
//
// Используется только когда сборка сделана с VITE_BACKEND=local — выбор бэкенда
// происходит в ./rtdb.ts.
// ─────────────────────────────────────────────────────────────────────────────

type AnyValue = unknown;
type Listener = (snapshot: Snapshot) => void;

interface Snapshot {
  val(): AnyValue;
  exists(): boolean;
}

interface RefShim {
  path: string;
}

// ─── Состояние соединения ────────────────────────────────────────────────────
let socket: WebSocket | null = null;
let reqCounter = 0;
let subCounter = 0;

const pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();
const subs = new Map<string, { path: string; cb: Listener }>();
const outbox: string[] = [];

function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/rtdb`;
}

function connect(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  socket = new WebSocket(wsUrl());

  socket.onopen = () => {
    // Отправляем всё, что накопилось пока не было связи.
    for (const m of outbox.splice(0)) socket!.send(m);
    // Восстанавливаем подписки — сервер сразу пришлёт актуальные значения.
    for (const [subId, s] of subs) {
      socket!.send(JSON.stringify({ t: 'sub', subId, path: s.path }));
    }
  };

  socket.onmessage = (ev) => {
    let msg: any;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.t === 'ack') {
      const p = pending.get(msg.reqId);
      if (p) {
        pending.delete(msg.reqId);
        p.resolve(msg);
      }
    } else if (msg.t === 'val') {
      const s = subs.get(msg.subId);
      if (s) s.cb(makeSnapshot(msg.value));
    }
  };

  socket.onclose = () => {
    socket = null;
    // Авто-переподключение (Wi-Fi мог моргнуть).
    setTimeout(connect, 1000);
  };

  socket.onerror = () => {
    try {
      socket?.close();
    } catch {
      /* игнорируем */
    }
  };
}

function send(obj: unknown): void {
  const str = JSON.stringify(obj);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(str);
  } else {
    outbox.push(str);
    connect();
  }
}

function request(obj: Record<string, unknown>): Promise<any> {
  const reqId = `r${++reqCounter}`;
  return new Promise((resolve, reject) => {
    pending.set(reqId, { resolve, reject });
    send({ ...obj, reqId });
    setTimeout(() => {
      if (pending.has(reqId)) {
        pending.delete(reqId);
        reject(new Error('rtdb: превышено время ожидания ответа сервера'));
      }
    }, 10000);
  });
}

function makeSnapshot(value: AnyValue): Snapshot {
  return {
    val: () => (value === undefined ? null : value),
    exists: () => value !== null && value !== undefined,
  };
}

// ─── Публичный API (совместим с firebase/database) ───────────────────────────
export const localDb = { __local__: true };

export function ref(_db: unknown, path?: string): RefShim {
  return { path: path ?? '' };
}

export function serverTimestamp(): AnyValue {
  return { __serverts__: true };
}

export async function set(r: RefShim, value: AnyValue): Promise<void> {
  await request({ t: 'set', path: r.path, value });
}

export async function get(r: RefShim): Promise<Snapshot> {
  const res = await request({ t: 'get', path: r.path });
  return makeSnapshot(res.value);
}

export async function remove(r: RefShim): Promise<void> {
  await request({ t: 'remove', path: r.path });
}

export async function update(_r: RefShim, updates: Record<string, AnyValue>): Promise<void> {
  // В приложении update всегда вызывается от корня с полными путями в ключах.
  await request({ t: 'update', updates });
}

export function onValue(r: RefShim, cb: Listener): () => void {
  const subId = `s${++subCounter}`;
  subs.set(subId, { path: r.path, cb });
  connect();
  send({ t: 'sub', subId, path: r.path });
  return () => {
    subs.delete(subId);
    send({ t: 'unsub', subId });
  };
}

export async function runTransaction(
  r: RefShim,
  fn: (current: any) => any
): Promise<{ committed: boolean; snapshot: Snapshot }> {
  // Compare-and-set с повторами — повторяет семантику Firebase-транзакции.
  for (let i = 0; i < 25; i++) {
    const snap = await get(r);
    const current = snap.val();
    const next = fn(current);
    if (next === undefined) return { committed: false, snapshot: snap };
    const res = await request({ t: 'cas', path: r.path, expected: current, value: next });
    if (res.ok) return { committed: true, snapshot: makeSnapshot(next) };
    // версия изменилась — пробуем снова
  }
  throw new Error('runTransaction: слишком много повторов');
}

// Объект-обёртка, который ./rtdb.ts подставляет вместо namespace firebase/database.
export const firebaseShim = {
  ref,
  set,
  get,
  onValue,
  remove,
  update,
  runTransaction,
  serverTimestamp,
};
