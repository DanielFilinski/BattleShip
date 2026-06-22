// ─────────────────────────────────────────────────────────────────────────────
// Экспорт пользовательских режимов (созданных в редакторе) из Firebase
// в локальный файл local-data/db.json, чтобы они были доступны офлайн.
//
// Запускать ОДИН РАЗ при наличии интернета:  npm run export:modes
//
// Статические режимы (divewing26, mms и т.п.) лежат в public/data и работают
// офлайн без этого шага — скрипт нужен только для режимов из редактора (custom_…).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Читаем .env.local вручную (без зависимостей).
const env = {};
const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

if (!env.VITE_FIREBASE_DATABASE_URL) {
  console.error('❌ В .env.local нет VITE_FIREBASE_DATABASE_URL — нечего экспортировать.');
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getDatabase(app);
const snap = await get(ref(db, 'customModes'));
const customModes = snap.exists() ? snap.val() : {};

const dataDir = path.join(root, 'local-data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.json');

let tree = {};
if (existsSync(dbFile)) {
  try {
    tree = JSON.parse(readFileSync(dbFile, 'utf8'));
  } catch {
    /* перезапишем */
  }
}
tree.customModes = customModes;
writeFileSync(dbFile, JSON.stringify(tree, null, 2));

console.log(`✅ Экспортировано режимов: ${Object.keys(customModes).length}`);
console.log(`   Сохранено в ${dbFile}`);
process.exit(0);
