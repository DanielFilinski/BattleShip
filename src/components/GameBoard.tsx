import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { ScoreBoard } from './ScoreBoard';
import { Cell } from './Cell';
import { QuestionModal } from './QuestionModal';
import { COLUMNS, ROWS, getCellType } from '../utils/gameLogic';
import { Question } from '../types/question';
import { Ship, Bomb } from '../types/game';
import { CellStatus } from '../types/cell';

interface GameBoardProps {
  questions: Question[];
  ships: Ship[];
  bombs: Bomb[];
}

export function GameBoard({ questions, ships, bombs }: GameBoardProps) {
  const { clickedCells, clickCell, answerCorrect, answerWrong, resetGame } =
    useGameState();
  const { playHit, playMiss, playCorrect, playWrong } = useSound();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCellClick = (coordinate: string) => {
    // Mark cell as clicked
    clickCell(coordinate);

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
      <div className="max-w-7xl mx-auto">
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
                    className="flex-1 min-w-[60px] text-center font-bold text-2xl text-ocean-700"
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {ROWS.map((row) => (
                <div key={row} className="flex mb-2">
                  {/* Row header */}
                  <div className="w-12 flex items-center justify-center font-bold text-2xl text-ocean-700">
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
            Кликнуто ячеек: {clickedCells.length} / 100
          </p>
        </div>
      </div>

      {/* Question Modal */}
      {isModalOpen && currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          onCorrect={handleCorrectAnswer}
          onWrong={handleWrongAnswer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
