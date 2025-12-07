import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Константы
const ALL_COLUMNS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
const ALL_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Question {
  id: string;
  category: string;
  type: string;
  difficulty: string;
  points: number;
  question: string;
  answer: string;
  mediaPath?: string;
  answerImages?: string[];
}

interface Ship {
  id: string;
  name: string;
  cells: string[];
  questionIds: string[];
}

interface Bomb {
  cell: string;
  questionId: string;
}

interface Position {
  col: number;
  row: number;
}

// Функции для работы с координатами
function parseCell(cell: string): Position {
  const col = ALL_COLUMNS.indexOf(cell.charAt(0));
  const row = parseInt(cell.substring(1)) - 1;
  return { col, row };
}

function positionToCell(pos: Position): string {
  return `${ALL_COLUMNS[pos.col]}${pos.row + 1}`;
}

function isPositionValid(pos: Position): boolean {
  return pos.col >= 0 && pos.col < ALL_COLUMNS.length &&
         pos.row >= 0 && pos.row < ALL_ROWS.length;
}

// Функция для проверки занятости клетки и окружения
function isCellOccupied(
  pos: Position,
  occupiedCells: Set<string>,
  checkAdjacent: boolean = true
): boolean {
  const cell = positionToCell(pos);
  if (occupiedCells.has(cell)) {
    return true;
  }

  if (!checkAdjacent) {
    return false;
  }

  // Проверяем все соседние клетки (включая диагонали)
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (dc === 0 && dr === 0) continue;

      const adjacentPos = { col: pos.col + dc, row: pos.row + dr };
      if (isPositionValid(adjacentPos)) {
        const adjacentCell = positionToCell(adjacentPos);
        if (occupiedCells.has(adjacentCell)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Функция для попытки разместить корабль
function tryPlaceShip(
  size: number,
  occupiedCells: Set<string>,
  maxAttempts: number = 100
): string[] | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Случайная ориентация: 0 - горизонтально, 1 - вертикально
    const isHorizontal = Math.random() < 0.5;

    // Случайная начальная позиция
    const startCol = Math.floor(Math.random() * (isHorizontal ? ALL_COLUMNS.length - size + 1 : ALL_COLUMNS.length));
    const startRow = Math.floor(Math.random() * (isHorizontal ? ALL_ROWS.length : ALL_ROWS.length - size + 1));

    // Генерируем позиции корабля
    const positions: Position[] = [];
    let valid = true;

    for (let i = 0; i < size; i++) {
      const pos = {
        col: startCol + (isHorizontal ? i : 0),
        row: startRow + (isHorizontal ? 0 : i)
      };

      if (!isPositionValid(pos) || isCellOccupied(pos, occupiedCells)) {
        valid = false;
        break;
      }

      positions.push(pos);
    }

    if (valid) {
      return positions.map(positionToCell);
    }
  }

  return null;
}

// Функция для размещения бомбы
function tryPlaceBomb(
  occupiedCells: Set<string>,
  maxAttempts: number = 100
): string | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pos = {
      col: Math.floor(Math.random() * ALL_COLUMNS.length),
      row: Math.floor(Math.random() * ALL_ROWS.length)
    };

    if (!isCellOccupied(pos, occupiedCells)) {
      return positionToCell(pos);
    }
  }

  return null;
}

// Функция для создания визуализации поля
function visualizeField(ships: Ship[], bombs: Bomb[]): string {
  const field: string[][] = [];

  // Инициализируем поле
  for (let row = 0; row < ALL_ROWS.length; row++) {
    field[row] = [];
    for (let col = 0; col < ALL_COLUMNS.length; col++) {
      field[row][col] = '·';
    }
  }

  // Размещаем корабли
  ships.forEach((ship, shipIndex) => {
    ship.cells.forEach(cell => {
      const pos = parseCell(cell);
      // Используем номер корабля + 1 для визуализации
      field[pos.row][pos.col] = String(shipIndex + 1);
    });
  });

  // Размещаем бомбы
  bombs.forEach(bomb => {
    const pos = parseCell(bomb.cell);
    field[pos.row][pos.col] = '💣';
  });

  // Создаем текстовое представление
  let result = '\n┌───┬' + '───┬'.repeat(ALL_COLUMNS.length - 1) + '───┐\n';
  result += '│   │ ' + ALL_COLUMNS.join(' │ ') + ' │\n';
  result += '├───┼' + '───┼'.repeat(ALL_COLUMNS.length - 1) + '───┤\n';

  for (let row = 0; row < ALL_ROWS.length; row++) {
    const rowNum = String(row + 1).padStart(2, ' ');
    result += `│ ${rowNum}│ ` + field[row].join(' │ ') + ' │\n';
    if (row < ALL_ROWS.length - 1) {
      result += '├───┼' + '───┼'.repeat(ALL_COLUMNS.length - 1) + '───┤\n';
    }
  }

  result += '└───┴' + '───┴'.repeat(ALL_COLUMNS.length - 1) + '───┘\n';

  return result;
}

// Основная функция генерации
function generatePositions() {
  console.log('🚢 Генерация позиций кораблей и бомб...\n');

  // Читаем текущие данные
  const shipsPath = path.join(__dirname, '../public/data/ships.json');
  const bombsPath = path.join(__dirname, '../public/data/bombs.json');
  const questionsPath = path.join(__dirname, '../public/data/questions.json');

  const shipsData = JSON.parse(fs.readFileSync(shipsPath, 'utf-8'));
  const bombsData = JSON.parse(fs.readFileSync(bombsPath, 'utf-8'));
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const ships: Ship[] = shipsData.ships;
  const bombs: Bomb[] = bombsData.bombs;
  const questions: Question[] = questionsData.questions;

  console.log(`📊 Загружено:`);
  console.log(`   - Кораблей: ${ships.length}`);
  console.log(`   - Бомб: ${bombs.length}`);
  console.log(`   - Вопросов: ${questions.length}\n`);

  // Множество занятых клеток (включая окружение)
  const occupiedCells = new Set<string>();

  // Генерируем новые позиции для кораблей
  const newShips: Ship[] = [];

  for (const ship of ships) {
    const size = ship.cells.length;
    const newCells = tryPlaceShip(size, occupiedCells);

    if (!newCells) {
      console.error(`❌ Не удалось разместить корабль ${ship.name} (размер ${size})`);
      process.exit(1);
    }

    // Добавляем клетки корабля в занятые
    newCells.forEach(cell => occupiedCells.add(cell));

    newShips.push({
      ...ship,
      cells: newCells
    });

    console.log(`✅ ${ship.name} (${size} клеток): ${newCells.join(', ')}`);
  }

  console.log();

  // Генерируем новые позиции для бомб
  const newBombs: Bomb[] = [];

  for (const bomb of bombs) {
    const newCell = tryPlaceBomb(occupiedCells);

    if (!newCell) {
      console.error(`❌ Не удалось разместить бомбу`);
      process.exit(1);
    }

    // Добавляем клетку бомбы в занятые
    occupiedCells.add(newCell);

    newBombs.push({
      ...bomb,
      cell: newCell
    });

    console.log(`💣 Бомба: ${newCell} (вопрос: ${bomb.questionId})`);
  }

  // Сохраняем новые данные
  fs.writeFileSync(
    shipsPath,
    JSON.stringify({ ships: newShips }, null, 2),
    'utf-8'
  );

  fs.writeFileSync(
    bombsPath,
    JSON.stringify({ bombs: newBombs }, null, 2),
    'utf-8'
  );

  console.log('\n💾 Данные сохранены в файлы ships.json и bombs.json\n');

  // Создаем визуализацию
  const visualization = visualizeField(newShips, newBombs);
  console.log('📍 Визуализация поля:');
  console.log(visualization);

  // Создаем детальное описание для Positions.md
  let mdContent = '# Позиции кораблей и бомб\n\n';
  mdContent += `*Сгенерировано: ${new Date().toLocaleString('ru-RU')}*\n\n`;

  mdContent += '## Визуализация поля\n\n';
  mdContent += '```\n' + visualization + '```\n\n';

  mdContent += '## Легенда\n\n';
  mdContent += '- `·` - пустая клетка\n';
  mdContent += '- `1-' + ships.length + '` - номера кораблей\n';
  mdContent += '- `💣` - бомба\n\n';

  mdContent += '## Корабли\n\n';
  newShips.forEach((ship, index) => {
    mdContent += `### ${index + 1}. ${ship.name} (${ship.cells.length} клеток)\n\n`;
    mdContent += `**Позиция:** ${ship.cells.join(', ')}\n\n`;
    mdContent += `**Вопросы:**\n\n`;
    ship.questionIds.forEach((qId, i) => {
      const question = questions.find(q => q.id === qId);
      if (question) {
        mdContent += `- **${ship.cells[i]}**: [${qId}] ${question.category} - ${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}\n`;
      }
    });
    mdContent += '\n';
  });

  mdContent += '## Бомбы\n\n';
  newBombs.forEach((bomb, index) => {
    const question = questions.find(q => q.id === bomb.questionId);
    mdContent += `${index + 1}. **${bomb.cell}**: [${bomb.questionId}] ${question ? question.category + ' - ' + question.question.substring(0, 50) : 'Вопрос не найден'}${question && question.question.length > 50 ? '...' : ''}\n`;
  });

  mdContent += '\n## Статистика\n\n';
  mdContent += `- Всего кораблей: ${newShips.length}\n`;
  mdContent += `- Всего клеток с кораблями: ${newShips.reduce((sum, ship) => sum + ship.cells.length, 0)}\n`;
  mdContent += `- Всего бомб: ${newBombs.length}\n`;
  mdContent += `- Всего занятых клеток: ${occupiedCells.size}\n`;
  mdContent += `- Процент заполнения поля: ${(occupiedCells.size / (ALL_COLUMNS.length * ALL_ROWS.length) * 100).toFixed(1)}%\n`;

  // Сохраняем в Positions.md
  const positionsPath = path.join(__dirname, '../Positions.md');
  fs.writeFileSync(positionsPath, mdContent, 'utf-8');

  console.log(`📄 Детальная информация сохранена в ${positionsPath}\n`);
  console.log('✨ Генерация завершена успешно!\n');
}

// Запуск
generatePositions();
