import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.argv[2] || 3100;

// Хранилище текущего вопроса
let currentQuestion = null;
let gameStarted = false;

app.use(cors());
app.use(express.json());

// Раздача статики (для Electron / production режима)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// API для получения текущего вопроса
app.get('/api/current-question', (req, res) => {
  res.json({
    question: currentQuestion,
    gameStarted: gameStarted
  });
});

// API для установки текущего вопроса
app.post('/api/current-question', (req, res) => {
  currentQuestion = req.body.question;
  gameStarted = req.body.gameStarted !== undefined ? req.body.gameStarted : gameStarted;
  res.json({ success: true });
});

// API для сброса вопроса
app.delete('/api/current-question', (req, res) => {
  currentQuestion = null;
  res.json({ success: true });
});

// API для установки статуса игры
app.post('/api/game-status', (req, res) => {
  gameStarted = req.body.started;
  res.json({ success: true });
});

// SPA fallback — все остальные роуты отдают index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Сервер запущен на http://localhost:${port}`);
      console.log(`📱 Доступен в локальной сети`);
      resolve(server);
    });
  });
}

// Запуск напрямую (не через Electron)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startServer();
}
