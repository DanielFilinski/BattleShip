// ─────────────────────────────────────────────────────────────────────────────
// Локальный сервер для игры БЕЗ интернета.
//
// Делает две вещи:
//   1. Раздаёт собранное приложение из dist/ (как обычный веб-сервер).
//   2. Поднимает мини-аналог Firebase Realtime Database по WebSocket (/rtdb):
//      хранит дерево данных в памяти, рассылает изменения подписчикам.
//
// Запуск:  node local-server.js [порт]     (по умолчанию 3000)
// Сборку приложения под локальный режим даёт:  npm run build:local
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.argv[2] || 3000);
const DATA_DIR = path.join(__dirname, 'local-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, 'dist');

// ─── In-memory дерево данных (аналог корня Firebase) ─────────────────────────
let tree = {};
if (existsSync(DB_FILE)) {
  try {
    tree = JSON.parse(readFileSync(DB_FILE, 'utf8'));
    console.log(`📂 Загружено сохранённое состояние: ${DB_FILE}`);
  } catch (e) {
    console.warn(`⚠️  Не удалось прочитать ${DB_FILE}: ${e.message}`);
  }
}

let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(DB_FILE, JSON.stringify(tree));
    } catch (e) {
      console.warn(`⚠️  Ошибка сохранения состояния: ${e.message}`);
    }
  }, 300);
}

// ─── Работа с путями вида "rooms/АБ123/state/clickedCells" ───────────────────
function splitPath(p) {
  return (p || '').split('/').filter(Boolean);
}

function getAt(p) {
  let node = tree;
  for (const s of splitPath(p)) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[s];
  }
  return node;
}

function setAt(p, value) {
  const segs = splitPath(p);
  if (segs.length === 0) {
    tree = value == null ? {} : value;
    return;
  }
  let node = tree;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (node[s] == null || typeof node[s] !== 'object') node[s] = {};
    node = node[s];
  }
  const last = segs[segs.length - 1];
  if (value == null) delete node[last];
  else node[last] = value;
}

// serverTimestamp(): на клиенте превращается в { __serverts__: true },
// здесь подставляем реальное время сервера.
function resolveTimestamps(value) {
  if (value && typeof value === 'object') {
    if (value.__serverts__ === true) return Date.now();
    if (Array.isArray(value)) return value.map(resolveTimestamps);
    const out = {};
    for (const k of Object.keys(value)) out[k] = resolveTimestamps(value[k]);
    return out;
  }
  return value;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a == b; // null == undefined → true (оба «пусто»)
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
  return true;
}

// ─── Подписки. У каждого сокета своя карта subId → path ──────────────────────
const clients = new Set();

// Пути «пересекаются», если один является префиксом другого (или равны):
// слушатель на rooms/X/state должен реагировать и на запись в rooms/X/state/clickedCells.
function pathsOverlap(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false;
  return true;
}

function notify(changedPath) {
  const changed = splitPath(changedPath);
  for (const ws of clients) {
    if (ws.readyState !== ws.OPEN) continue;
    for (const [subId, subPath] of ws.subs) {
      if (pathsOverlap(changed, splitPath(subPath))) {
        const val = getAt(subPath);
        ws.send(JSON.stringify({ t: 'val', subId, value: val === undefined ? null : val }));
      }
    }
  }
}

function applySet(p, value) {
  setAt(p, resolveTimestamps(value));
  persist();
  notify(p);
}

function applyUpdate(updates) {
  const paths = Object.keys(updates || {});
  for (const up of paths) setAt(up, resolveTimestamps(updates[up]));
  persist();
  for (const up of paths) notify(up);
}

function applyRemove(p) {
  setAt(p, null);
  persist();
  notify(p);
}

// ─── HTTP: раздача приложения ────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(DIST_DIR));

// Адрес сервера в локальной сети — чтобы ссылка/QR указывали на реальный IP,
// а не на localhost, даже если ведущий открыл игру по адресу localhost.
app.get('/api/server-info', (req, res) => {
  res.json({ host: bestLanAddress(), port: PORT, urls: lanAddresses() });
});

// SPA-fallback: любые маршруты отдают index.html
app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));

const server = createServer(app);

// ─── WebSocket: rtdb-протокол ────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/rtdb' });

wss.on('connection', (ws) => {
  ws.subs = new Map();
  clients.add(ws);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.t) {
      case 'get': {
        const v = getAt(msg.path);
        ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, value: v === undefined ? null : v }));
        break;
      }
      case 'set': {
        applySet(msg.path, msg.value);
        ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, ok: true }));
        break;
      }
      case 'update': {
        applyUpdate(msg.updates);
        ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, ok: true }));
        break;
      }
      case 'remove': {
        applyRemove(msg.path);
        ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, ok: true }));
        break;
      }
      case 'cas': {
        // Compare-and-set: основа транзакций (защита от двойного клика).
        const current = getAt(msg.path);
        const cur = current === undefined ? null : current;
        const exp = msg.expected === undefined ? null : msg.expected;
        if (deepEqual(cur, exp)) {
          applySet(msg.path, msg.value);
          ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, ok: true }));
        } else {
          ws.send(JSON.stringify({ t: 'ack', reqId: msg.reqId, ok: false }));
        }
        break;
      }
      case 'sub': {
        ws.subs.set(msg.subId, msg.path);
        const v = getAt(msg.path);
        ws.send(JSON.stringify({ t: 'val', subId: msg.subId, value: v === undefined ? null : v }));
        break;
      }
      case 'unsub': {
        ws.subs.delete(msg.subId);
        break;
      }
    }
  });

  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

// ─── Запуск ───────────────────────────────────────────────────────────────────
function lanAddresses() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

// Самый вероятный адрес домашней Wi-Fi сети: 192.168.* и 10.* приоритетнее,
// docker-сети 172.16–31.* — в самый низ.
function ipRank(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return 3;
  return 2;
}

function bestLanAddress() {
  const addrs = lanAddresses();
  if (addrs.length === 0) return 'localhost';
  return addrs.slice().sort((a, b) => ipRank(a) - ipRank(b))[0];
}

server.listen(PORT, '0.0.0.0', () => {
  if (!existsSync(DIST_DIR)) {
    console.warn('\n⚠️  Папка dist/ не найдена. Сначала собери приложение: npm run build:local\n');
  }
  console.log(`\n✅ Локальный сервер запущен (порт ${PORT})`);
  const addrs = lanAddresses();
  if (addrs.length === 0) {
    console.log(`📡 http://localhost:${PORT}  (других сетевых адресов не найдено)`);
  } else {
    const best = bestLanAddress();
    console.log('📡 Адрес для участников (открой этот на телефоне):');
    console.log(`   ➜  http://${best}:${PORT}`);
    const others = addrs.filter(ip => ip !== best);
    if (others.length > 0) {
      console.log('   другие адреса этой машины:');
      for (const ip of others) console.log(`      http://${ip}:${PORT}`);
    }
  }
  console.log('\nИнтернет не нужен. Останов — Ctrl+C.\n');
});
