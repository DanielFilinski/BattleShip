import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { useFieldSettings } from '../hooks/useFieldSettings';
import { ScoreBoard } from './ScoreBoard';
import { Cell } from './Cell';
import { QuestionModal } from './QuestionModal';
import { SettingsMenu } from './SettingsMenu';
import { SettingsModal } from './SettingsModal';
import { FieldSettingsModal } from './FieldSettingsModal';
import { VictoryAnimation } from './VictoryAnimation';
import { ConfirmModal } from './ConfirmModal';
import { generateColumns, generateRows, getCellType, isShipSunk, getShipByCell } from '../utils/gameLogic';
import { Question } from '../types/question';
import { Ship, Bomb } from '../types/game';
import { CellStatus } from '../types/cell';

interface GameBoardProps {
  questions: Question[];
  ships: Ship[];
  bombs: Bomb[];
}

export function GameBoard({ questions, ships, bombs }: GameBoardProps) {
  const { clickedCells, clickCell, unclickCell, answerCorrect, answerCorrectBothTeams, answerWrong, resetGame, team1, team2, currentTurn, answeredQuestions, markQuestionAnswered } =
    useGameState();
  const { playHit, playMiss, playCorrect, playWrong } = useSound();
  const { columns: fieldColumns, rows: fieldRows, cellSize, setFieldSize, setCellSize } = useFieldSettings();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentCoordinate, setCurrentCoordinate] = useState<string | null>(null);
  const [currentCellType, setCurrentCellType] = useState<'ship' | 'bomb' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFieldSettingsOpen, setIsFieldSettingsOpen] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFieldSettingsSaved, setShowFieldSettingsSaved] = useState(false);
  const [savedFieldSettings, setSavedFieldSettings] = useState<{columns: number, rows: number, cellSize: number} | null>(null);

  // Generate columns and rows based on settings
  const COLUMNS = useMemo(() => generateColumns(fieldColumns), [fieldColumns]);
  const ROWS = useMemo(() => generateRows(fieldRows), [fieldRows]);

  // Calculate all ship and bomb cells
  const allTargetCells = useMemo(() => {
    const shipCells = ships.flatMap(ship => ship.cells);
    const bombCells = bombs.map(bomb => bomb.cell);
    return [...shipCells, ...bombCells];
  }, [ships, bombs]);

  // Check if game is completed (all ships and bombs found)
  const isGameCompleted = useMemo(() => {
    return allTargetCells.every(cell => clickedCells.includes(cell));
  }, [allTargetCells, clickedCells]);

  const handleCellClick = (coordinate: string) => {
    // Mark cell as clicked
    clickCell(coordinate);
    // Save current coordinate for skip functionality
    setCurrentCoordinate(coordinate);

    // Determine cell type
    const { type, questionId } = getCellType(coordinate, ships, bombs);

    if (type === 'empty') {
      // Miss
      playMiss();
      // Auto-switch turn after miss
      setTimeout(() => {
        answerWrong();
      }, 1000);
    } else {
      // Hit or bomb
      playHit();
      
      // Save cell type to determine turn switching logic later
      setCurrentCellType(type === 'bomb' ? 'bomb' : 'ship');

      // Find and show question
      if (questionId) {
        const question = questions.find((q) => q.id === questionId);
        if (question) {
          setCurrentQuestion(question);
          setIsModalOpen(true);
        }
      }
    }
  };

  const handleCorrectAnswer = () => {
    if (currentQuestion) {
      playCorrect();
      // Если тип вопроса together, начисляем баллы обеим командам
      if (currentQuestion.type === 'together') {
        answerCorrectBothTeams(currentQuestion.points);
      } else {
        answerCorrect(currentQuestion.points);
      }
      markQuestionAnswered(currentQuestion.id);
      
      // Если это бомба - переключаем ход после правильного ответа
      if (currentCellType === 'bomb') {
        answerWrong(); // используем для переключения хода
      }
      // Если это корабль - команда получает еще один ход (не переключаем)
    }
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCellType(null);

    // Check if game is completed after a short delay
    setTimeout(() => {
      if (isGameCompleted) {
        setShowVictory(true);
      }
    }, 500);
  };

  const handleWrongAnswer = () => {
    if (currentQuestion) {
      markQuestionAnswered(currentQuestion.id);
    }
    playWrong();
    answerWrong();
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCellType(null);

    // Check if game is completed after a short delay
    setTimeout(() => {
      if (isGameCompleted) {
        setShowVictory(true);
      }
    }, 500);
  };

  const handleSkip = () => {
    // Пропустить вопрос - убрать ячейку и переключить ход
    if (currentCoordinate) {
      unclickCell(currentCoordinate);
    }
    answerWrong(); // Переключить ход
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCoordinate(null);
    setCurrentCellType(null);
  };

  const handleTransfer = () => {
    // Передать вопрос другой команде - переключить ход
    answerWrong(); // Используем answerWrong для переключения хода
    // НЕ закрываем модал - вопрос остается на экране
  };

  const getCellStatus = (coordinate: string): CellStatus => {
    if (!clickedCells.includes(coordinate)) {
      return 'untouched';
    }

    const { type } = getCellType(coordinate, ships, bombs);

    if (type === 'empty') return 'miss';
    if (type === 'bomb') return 'bomb';

    // Check if this is a ship cell and if the ship is fully sunk
    if (type === 'ship') {
      const ship = getShipByCell(coordinate, ships);
      if (ship && isShipSunk(ship, clickedCells)) {
        return 'sunk';
      }
      return 'hit';
    }

    return 'hit';
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetGame();
    setShowVictory(false);
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleVictoryClose = () => {
    setShowVictory(false);
    // Optionally reset the game or show final scores
  };

  // Calculate remaining ships, bombs, and questions
  const remainingStats = useMemo(() => {
    const foundBombCells = bombs.map(bomb => bomb.cell).filter(cell => clickedCells.includes(cell));

    // Count remaining ships (a ship is remaining if not all its cells are clicked)
    const remainingShips = ships.filter(ship => !ship.cells.every(cell => clickedCells.includes(cell))).length;

    // Count remaining bombs
    const remainingBombs = bombs.length - foundBombCells.length;

    // Count total remaining questions (from ships and bombs, excluding answered questions)
    const allQuestionIds = [
      ...ships.flatMap(ship => ship.questionIds),
      ...bombs.map(bomb => bomb.questionId)
    ];
    const totalRemainingQuestions = allQuestionIds.filter(qId => !answeredQuestions.includes(qId)).length;

    return {
      ships: remainingShips,
      bombs: remainingBombs,
      questions: totalRemainingQuestions
    };
  }, [ships, bombs, clickedCells, answeredQuestions]);

  return (
    <div className={`bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 ${isFullscreen ? 'h-screen flex p-0' : 'min-h-screen p-6'}`}>
      {isFullscreen ? (
        <>
          {/* Game Grid - Left Side */}
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="flex-1 overflow-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-2">
              <div className="min-h-full flex flex-col justify-center items-center">
                {/* Column headers */}
                <div className="flex mb-1">
                  <div className="w-8"></div>
                  {COLUMNS.map((col) => (
                    <div
                      key={col}
                      className="text-center font-bold text-ocean-700 text-lg"
                      style={{ width: `${cellSize}px`, flexShrink: 0 }}
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {ROWS.map((row) => (
                  <div key={row} className="flex mb-1">
                    {/* Row header */}
                    <div className="w-8 flex items-center justify-center font-bold text-ocean-700 text-lg">
                      {row}
                    </div>

                    {/* Cells */}
                    {COLUMNS.map((col) => {
                      const coordinate = `${col}${row}`;
                      return (
                        <div
                          key={coordinate}
                          className="px-0.5"
                          style={{ width: `${cellSize}px`, flexShrink: 0 }}
                        >
                          <Cell
                            coordinate={coordinate}
                            status={getCellStatus(coordinate)}
                            onClick={handleCellClick}
                            disabled={isModalOpen}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Settings and Team Status */}
          <div className="w-72 flex flex-col gap-3 p-3 bg-ocean-900/50 overflow-visible">
            {/* Settings Menu */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
              <SettingsMenu
                onOpenSettings={() => setIsSettingsOpen(true)}
                isFullscreen={isFullscreen}
              />
            </div>

            {/* Game Statistics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-center mb-2">
                <div className="text-sm font-bold text-ocean-800">СТАТИСТИКА ИГРЫ</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-ocean-700">🚢 Кораблей:</span>
                  <span className="text-lg font-bold text-blue-600">{remainingStats.ships}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-ocean-700">💣 Бомб:</span>
                  <span className="text-lg font-bold text-red-600">{remainingStats.bombs}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-ocean-700">❓ Вопросов:</span>
                  <span className="text-lg font-bold text-purple-600">{remainingStats.questions}</span>
                </div>
              </div>
            </div>

            {/* Team Scores - Vertical Layout */}
            <div className="flex flex-col gap-3">
              {/* Team 1 */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-4 transition-all ${
                  currentTurn === 1
                    ? 'border-emerald-500 scale-105'
                    : 'border-ocean-200'
                }`}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-ocean-600 mb-1">
                    {currentTurn === 1 && '▶️ '}КОМАНДА 1
                  </div>
                  <div className="text-xl font-bold text-ocean-800 mb-1">
                    {team1.name}
                  </div>
                  <div className="text-4xl font-black text-emerald-600">
                    {team1.score}
                  </div>
                  <div className="text-xs text-ocean-500 mt-1">БАЛЛОВ</div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="text-center">
                <div className="text-2xl font-black text-white/70">VS</div>
              </div>

              {/* Team 2 */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-4 transition-all ${
                  currentTurn === 2
                    ? 'border-emerald-500 scale-105'
                    : 'border-ocean-200'
                }`}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-ocean-600 mb-1">
                    {currentTurn === 2 && '▶️ '}КОМАНДА 2
                  </div>
                  <div className="text-xl font-bold text-ocean-800 mb-1">
                    {team2.name}
                  </div>
                  <div className="text-4xl font-black text-emerald-600">
                    {team2.score}
                  </div>
                  <div className="text-xs text-ocean-500 mt-1">БАЛЛОВ</div>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg mt-auto"
            >
              🔄 Новая игра
            </button>
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Settings Menu - Normal Mode */}
          <div className="flex justify-end mb-4">
            <SettingsMenu
              onOpenSettings={() => setIsSettingsOpen(true)}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* Score Board */}
          <ScoreBoard />

          {/* Game Grid */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Column headers */}
                <div className="flex mb-2">
                  <div className="w-12"></div>
                  {COLUMNS.map((col) => (
                    <div
                      key={col}
                      className="text-center font-bold text-ocean-700 flex-1 min-w-[60px] text-2xl"
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {ROWS.map((row) => (
                  <div key={row} className="flex mb-2">
                    {/* Row header */}
                    <div className="w-12 flex items-center justify-center font-bold text-ocean-700 text-2xl">
                      {row}
                    </div>

                    {/* Cells */}
                    {COLUMNS.map((col) => {
                      const coordinate = `${col}${row}`;
                      return (
                        <div
                          key={coordinate}
                          className="flex-1 min-w-[60px] px-1"
                        >
                          <Cell
                            coordinate={coordinate}
                            status={getCellStatus(coordinate)}
                            onClick={handleCellClick}
                            disabled={isModalOpen}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleReset}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white text-lg font-semibold py-3 px-8 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                🔄 Новая игра
              </button>
            </div>
          </div>

          {/* Game Stats */}
          <div className="mt-6 text-center text-white/80 text-sm">
            <p>
              Кликнуто ячеек: {clickedCells.length} / {fieldColumns * fieldRows}
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onToggleFullscreen={() => {
            setIsFullscreen(!isFullscreen);
            setIsSettingsOpen(false);
          }}
          onOpenFieldSettings={() => {
            setIsFieldSettingsOpen(true);
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Question Modal */}
      {isModalOpen && currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          onCorrect={handleCorrectAnswer}
          onWrong={handleWrongAnswer}
          onSkip={handleSkip}
          onTransfer={handleTransfer}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Field Settings Modal */}
      {isFieldSettingsOpen && (
        <FieldSettingsModal
          currentColumns={fieldColumns}
          currentRows={fieldRows}
          currentCellSize={cellSize}
          onSave={(columns, rows, newCellSize) => {
            setFieldSize(columns, rows);
            setCellSize(newCellSize);
            setSavedFieldSettings({ columns, rows, cellSize: newCellSize });
            setShowFieldSettingsSaved(true);
          }}
          onClose={() => setIsFieldSettingsOpen(false)}
        />
      )}

      {/* Victory Animation */}
      {showVictory && (
        <VictoryAnimation
          winnerName={team1.score > team2.score ? team1.name : team2.name}
          winnerScore={Math.max(team1.score, team2.score)}
          loserName={team1.score > team2.score ? team2.name : team1.name}
          loserScore={Math.min(team1.score, team2.score)}
          onClose={handleVictoryClose}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ConfirmModal
          title="Начать новую игру?"
          message="Вы уверены, что хотите начать новую игру? Текущий прогресс будет потерян."
          confirmText="Да, начать"
          cancelText="Отмена"
          type="danger"
          onConfirm={confirmReset}
          onCancel={cancelReset}
        />
      )}

      {/* Field Settings Saved Modal */}
      {showFieldSettingsSaved && savedFieldSettings && (
        <ConfirmModal
          title="Настройки сохранены"
          message={`Настройки сохранены: ${savedFieldSettings.columns}×${savedFieldSettings.rows}, размер ячейки ${savedFieldSettings.cellSize}px. Начните новую игру для применения изменений.`}
          confirmText="Понятно"
          cancelText=""
          type="info"
          onConfirm={() => setShowFieldSettingsSaved(false)}
          onCancel={() => setShowFieldSettingsSaved(false)}
        />
      )}
    </div>
  );
}
