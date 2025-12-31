import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Хранилище текущего вопроса
let currentQuestion = null;
let gameStarted = false;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API сервер запущен на http://0.0.0.0:${PORT}`);
  console.log(`📱 Доступен в локальной сети`);
});
