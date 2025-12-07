import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { useFieldSettings } from '../hooks/useFieldSettings';
import { ScoreBoard } from './ScoreBoard';
import { Cell } from './Cell';
import { QuestionModal } from './QuestionModal';
import { SettingsMenu } from './SettingsMenu';
import { FieldSettingsModal } from './FieldSettingsModal';
import { generateColumns, generateRows, getCellType } from '../utils/gameLogic';
import { Question } from '../types/question';
import { Ship, Bomb } from '../types/game';
import { CellStatus } from '../types/cell';

interface GameBoardProps {
  questions: Question[];
  ships: Ship[];
  bombs: Bomb[];
}

export function GameBoard({ questions, ships, bombs }: GameBoardProps) {
  const { clickedCells, clickCell, unclickCell, answerCorrect, answerWrong, resetGame, team1, team2, currentTurn } =
    useGameState();
  const { playHit, playMiss, playCorrect, playWrong } = useSound();
  const { columns: fieldColumns, rows: fieldRows, cellSize, setFieldSize, setCellSize } = useFieldSettings();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentCoordinate, setCurrentCoordinate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFieldSettingsOpen, setIsFieldSettingsOpen] = useState(false);

  // Generate columns and rows based on settings
  const COLUMNS = useMemo(() => generateColumns(fieldColumns), [fieldColumns]);
  const ROWS = useMemo(() => generateRows(fieldRows), [fieldRows]);

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
      answerCorrect(currentQuestion.points);
      // Team gets another turn (don't switch)
    }
    setIsModalOpen(false);
    setCurrentQuestion(null);
  };

  const handleWrongAnswer = () => {
    playWrong();
    answerWrong();
    setIsModalOpen(false);
    setCurrentQuestion(null);
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
    return 'hit';
  };

  const handleReset = () => {
    if (
      confirm(
        'Вы уверены, что хотите начать новую игру? Текущий прогресс будет потерян.'
      )
    ) {
      resetGame();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 p-6">
      <div className={isFullscreen ? 'h-screen flex flex-col' : 'max-w-7xl mx-auto'}>
        {/* View Mode Toggle and Compact Score */}
        <div className="flex justify-between items-center mb-4">
          {/* Compact Score for Fullscreen */}
          {isFullscreen && (
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentTurn === 1 ? 'bg-emerald-100' : ''}`}>
                <span className="font-bold text-ocean-700">{team1.name}</span>
                <span className="text-2xl font-black text-emerald-600">{team1.score}</span>
              </div>
              <div className="text-ocean-400 font-bold">VS</div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentTurn === 2 ? 'bg-emerald-100' : ''}`}>
                <span className="font-bold text-ocean-700">{team2.name}</span>
                <span className="text-2xl font-black text-emerald-600">{team2.score}</span>
              </div>
            </div>
          )}

          <div className="ml-auto">
            <SettingsMenu
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onOpenFieldSettings={() => setIsFieldSettingsOpen(true)}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>

        {/* Score Board */}
        {!isFullscreen && <ScoreBoard />}

        {/* Game Grid */}
        <div className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 ${isFullscreen ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
          <div className={`${isFullscreen ? 'flex-1 overflow-auto' : 'overflow-x-auto'}`}>
            <div className={`${isFullscreen ? 'min-h-full flex flex-col justify-center items-center p-4' : 'inline-block min-w-full'}`}>
              {/* Column headers */}
              <div className="flex mb-2">
                <div className={isFullscreen ? 'w-8 sm:w-12' : 'w-12'}></div>
                {COLUMNS.map((col) => (
                  <div
                    key={col}
                    className={`text-center font-bold text-ocean-700 ${isFullscreen ? 'text-lg sm:text-xl' : 'flex-1 min-w-[60px] text-2xl'}`}
                    style={isFullscreen ? { width: `${cellSize}px`, flexShrink: 0 } : undefined}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {ROWS.map((row) => (
                <div key={row} className="flex mb-2">
                  {/* Row header */}
                  <div className={`flex items-center justify-center font-bold text-ocean-700 ${isFullscreen ? 'w-8 sm:w-12 text-lg sm:text-xl' : 'w-12 text-2xl'}`}>
                    {row}
                  </div>

                  {/* Cells */}
                  {COLUMNS.map((col) => {
                    const coordinate = `${col}${row}`;
                    return (
                      <div
                        key={coordinate}
                        className={isFullscreen ? 'px-0.5' : 'flex-1 min-w-[60px] px-1'}
                        style={isFullscreen ? { width: `${cellSize}px`, flexShrink: 0 } : undefined}
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
          {!isFullscreen && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleReset}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white text-lg font-semibold py-3 px-8 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                🔄 Новая игра
              </button>
            </div>
          )}
        </div>

        {/* Game Stats */}
        {!isFullscreen && (
          <div className="mt-6 text-center text-white/80 text-sm">
            <p>
              Кликнуто ячеек: {clickedCells.length} / {fieldColumns * fieldRows}
            </p>
          </div>
        )}
      </div>

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
            // Show confirmation message
            alert(`Настройки сохранены: ${columns}×${rows}, размер ячейки ${newCellSize}px. Начните новую игру для применения изменений.`);
          }}
          onClose={() => setIsFieldSettingsOpen(false)}
        />
      )}
    </div>
  );
}
