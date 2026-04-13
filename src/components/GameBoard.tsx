import { useState, useMemo, useEffect } from 'react';
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
import { QuestionSelector } from './QuestionSelector';
import { generateColumns, generateRows, getCellType, isShipSunk, getShipByCell, getSurroundingCells, getSurroundingCellsForCoordinate } from '../utils/gameLogic';
import { Question } from '../types/question';
import { Ship, Bomb } from '../types/game';
import { CellStatus } from '../types/cell';
import { getTeamActiveStyle, getTeamColor } from '../utils/teamColors';
import type { RemoteQuestion } from '../hooks/useFirebaseSync';

interface GameBoardProps {
  questions: Question[];
  ships: Ship[];
  bombs: Bomb[];
  onUpdateShipCell?: (shipId: string, cellIndex: number, newCell: string, newQuestionId: string) => void;
  onUpdateBomb?: (oldCell: string, newCell: string, newQuestionId: string) => void;
  onExportData?: () => void;
  // Online multiplayer props (optional — not used in offline/Electron mode)
  isAdmin?: boolean;
  myTeamIndex?: number; // -99 = admin, -1 = viewer, 0+ = team index
  roomId?: string;
  remoteQuestion?: RemoteQuestion;
  onWriteSession?: (q: RemoteQuestion) => Promise<void>;
  onClearSession?: () => Promise<void>;
  onParticipantShoot?: (coordinate: string, cellType: 'ship' | 'bomb' | 'empty', questionId: string | null) => Promise<void>;
}

export function GameBoard({
  questions, ships, bombs,
  onUpdateShipCell, onUpdateBomb, onExportData,
  isAdmin = true, myTeamIndex = -99, roomId,
  remoteQuestion, onWriteSession, onClearSession, onParticipantShoot,
}: GameBoardProps) {
  const {
    clickedCells, clickCell, unclickCell,
    answerCorrect, answerCorrectAllTeams, answerCorrectSpecificTeam, answerWrong, setTurn,
    resetGame, teams, currentTurn, answeredQuestions, markQuestionAnswered, viewMode, editMode,
    history, saveSnapshot, undoLastAction, adjustScore,
  } = useGameState();
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
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [editingCell, setEditingCell] = useState<{ coordinate: string; currentQuestionId: string } | null>(null);
  const [participantDismissed, setParticipantDismissed] = useState(false);

  const COLUMNS = useMemo(() => generateColumns(fieldColumns), [fieldColumns]);
  const ROWS = useMemo(() => generateRows(fieldRows), [fieldRows]);

  const allTargetCells = useMemo(() => {
    const shipCells = ships.flatMap(ship => ship.cells);
    const bombCells = bombs.map(bomb => bomb.cell);
    return [...shipCells, ...bombCells];
  }, [ships, bombs]);

  const isGameCompleted = useMemo(() => {
    return allTargetCells.every(cell => clickedCells.includes(cell));
  }, [allTargetCells, clickedCells]);

  // Reset dismiss state when a new question opens (new questionId from Firebase)
  useEffect(() => {
    if (remoteQuestion?.questionId) {
      setParticipantDismissed(false);
    }
  }, [remoteQuestion?.questionId]);

  // ─── Online: react to participant shot arriving via Firebase ─────────────────
  // When a participant clicks a cell, it writes to Firebase session.
  // Admin's useFirebaseSync picks it up → remoteQuestion changes.
  // This effect processes it as if admin clicked the cell locally.
  useEffect(() => {
    if (!isAdmin) return;
    if (!remoteQuestion?.coordinate) return;
    const { coordinate, cellType, questionId } = remoteQuestion;
    // Avoid re-processing if cell already clicked (e.g. on mount)
    if (clickedCells.includes(coordinate)) return;

    saveSnapshot();
    clickCell(coordinate);
    setCurrentCoordinate(coordinate);

    if (cellType === 'empty') {
      playMiss();
      setTimeout(() => answerWrong(), 1000);
    } else {
      playHit();
      setCurrentCellType(cellType === 'bomb' ? 'bomb' : 'ship');
      if (questionId) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
          setCurrentQuestion(question);
          setIsModalOpen(true);
          return;
        }
      }
      // No question found — auto-advance turn so game doesn't get stuck
      setTimeout(() => answerWrong(), 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteQuestion?.coordinate, remoteQuestion?.isOpen]);

  const handleCellClick = (coordinate: string) => {
    const { type, questionId } = getCellType(coordinate, ships, bombs);

    // Online mode: non-admin gating
    if (!isAdmin) {
      // Viewers (myTeamIndex === -1) can never click
      if (myTeamIndex === -1) return;
      // Participants can only click on their team's turn
      if (myTeamIndex !== currentTurn) return;
      // Already clicked
      if (clickedCells.includes(coordinate)) return;
      // Delegate to Firebase
      onParticipantShoot?.(coordinate, type, questionId ?? null);
      return;
    }

    if (editMode && (type === 'ship' || type === 'bomb')) {
      setEditingCell({ coordinate, currentQuestionId: questionId || '' });
      setShowQuestionSelector(true);
      return;
    }

    if (viewMode) {
      if (questionId) {
        const question = questions.find((q) => q.id === questionId);
        if (question) {
          setCurrentQuestion(question);
          setIsModalOpen(true);
        }
      }
      return;
    }

    saveSnapshot();
    clickCell(coordinate);
    setCurrentCoordinate(coordinate);

    if (type === 'empty') {
      playMiss();
      setTimeout(() => {
        answerWrong();
      }, 1000);
    } else {
      playHit();
      setCurrentCellType(type === 'bomb' ? 'bomb' : 'ship');
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
      if (currentQuestion.type === 'together') {
        answerCorrectAllTeams(currentQuestion.points);
      } else {
        answerCorrect(currentQuestion.points);
      }
      markQuestionAnswered(currentQuestion.id);
      if (currentCellType === 'bomb') {
        answerWrong();
      }
    }
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCellType(null);

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

    setTimeout(() => {
      if (isGameCompleted) {
        setShowVictory(true);
      }
    }, 500);
  };

  const handleSkip = () => {
    if (currentCoordinate) {
      unclickCell(currentCoordinate);
    }
    answerWrong();
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCoordinate(null);
    setCurrentCellType(null);
  };

  const handleTransfer = () => {
    answerWrong();
    // Don't close modal
  };

  // teamIndex = null means nobody answered correctly
  const handleTeamAnswer = (teamIndex: number | null) => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'together') {
      playCorrect();
      answerCorrectAllTeams(currentQuestion.points);
    } else if (teamIndex === null) {
      // Nobody answered — move to next team
      playWrong();
      answerWrong();
    } else {
      playCorrect();
      answerCorrectSpecificTeam(teamIndex, currentQuestion.points);

      if (currentCellType === 'bomb') {
        // After bomb — always move to next team in order
        answerWrong();
      } else if (currentCellType === 'ship' && teamIndex !== currentTurn) {
        // Another team answered correctly on a ship — give them the turn
        setTurn(teamIndex);
      }
      // If current team answered on their ship — turn stays with them (no change)
    }

    markQuestionAnswered(currentQuestion.id);
    setIsModalOpen(false);
    setCurrentQuestion(null);
    setCurrentCellType(null);
    onClearSession?.();

    setTimeout(() => {
      if (isGameCompleted) {
        setShowVictory(true);
      }
    }, 500);
  };

  const getCellStatus = (coordinate: string): CellStatus => {
    const { type } = getCellType(coordinate, ships, bombs);

    if (viewMode && isAdmin) {
      if (type === 'ship') return 'view-ship';
      if (type === 'bomb') return 'view-bomb';
      return 'untouched';
    }

    if (!clickedCells.includes(coordinate)) {
      const isAdjacentToSunkShip = ships.some(
        ship => isShipSunk(ship, clickedCells) && getSurroundingCells(ship, COLUMNS, ROWS).includes(coordinate)
      );
      if (isAdjacentToSunkShip) return 'miss';
      const isAdjacentToClickedBomb = bombs.some(
        bomb => clickedCells.includes(bomb.cell) &&
                getSurroundingCellsForCoordinate(bomb.cell, COLUMNS, ROWS).includes(coordinate)
      );
      if (isAdjacentToClickedBomb) return 'miss';
      return 'untouched';
    }

    if (type === 'empty') return 'miss';
    if (type === 'bomb') return 'bomb';

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
  };

  const handleQuestionSelect = (questionId: string) => {
    if (!editingCell || !onUpdateShipCell || !onUpdateBomb) return;

    const { type } = getCellType(editingCell.coordinate, ships, bombs);

    if (type === 'bomb') {
      onUpdateBomb(editingCell.coordinate, editingCell.coordinate, questionId);
    } else if (type === 'ship') {
      for (const ship of ships) {
        const cellIndex = ship.cells.indexOf(editingCell.coordinate);
        if (cellIndex !== -1) {
          onUpdateShipCell(ship.id, cellIndex, editingCell.coordinate, questionId);
          break;
        }
      }
    }

    setEditingCell(null);
  };

  const remainingStats = useMemo(() => {
    const foundBombCells = bombs.map(bomb => bomb.cell).filter(cell => clickedCells.includes(cell));
    const remainingShips = ships.filter(ship => !ship.cells.every(cell => clickedCells.includes(cell))).length;
    const remainingBombs = bombs.length - foundBombCells.length;
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

  // Determine winner for victory screen
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  return (
    <div className={`bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 ${isFullscreen ? 'h-screen flex p-0' : `min-h-screen p-6 ${roomId ? 'pt-14' : ''}`}`}>
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
                    <div className="w-8 flex items-center justify-center font-bold text-ocean-700 text-lg">
                      {row}
                    </div>
                    {COLUMNS.map((col) => {
                      const coordinate = `${col}${row}`;
                      const { questionId } = getCellType(coordinate, ships, bombs);
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
                            questionId={questionId}
                            editMode={editMode}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex flex-col gap-3 p-3 bg-ocean-900/50 overflow-y-auto">
            {/* Settings Menu */}
            {isAdmin && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <SettingsMenu
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  isFullscreen={isFullscreen}
                />
              </div>
            )}

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
            {isAdmin && <div className="flex flex-col gap-2">
              {teams.map((team, index) => {
                const isActive = currentTurn === index;
                const color = getTeamColor(team, index);
                return (
                  <div
                    key={index}
                    className={`backdrop-blur-sm rounded-xl p-3 shadow-lg border-4 transition-all duration-300 ${
                      isActive ? 'scale-105' : 'bg-white/90 border-ocean-200 hover:shadow-2xl hover:border-ocean-400 hover:bg-ocean-50/90'
                    }`}
                    style={isActive ? getTeamActiveStyle(color) : undefined}
                  >
                    <div
                      className="text-center cursor-pointer"
                      onClick={() => setTurn(index)}
                      title={isActive ? 'Текущий ход' : 'Передать ход этой команде'}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isActive ? 'text-white' : 'text-ocean-600'}`}>
                        {isActive && '▶️ '}КОМАНДА {index + 1}
                      </div>
                      <div className={`text-base font-bold mb-1 truncate ${isActive ? 'text-white' : 'text-ocean-800'}`}>
                        {team.name}
                      </div>
                      <div
                        className={`text-3xl font-black ${isActive ? 'text-white' : ''}`}
                        style={!isActive ? { color } : undefined}
                      >
                        {team.score}
                      </div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-ocean-500'}`}>БАЛЛОВ</div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => adjustScore(index, -1)}
                        className={`w-8 h-8 rounded-lg font-bold text-xl leading-none transition-colors ${
                          isActive
                            ? 'bg-white/20 hover:bg-white/40 text-white'
                            : 'bg-ocean-100 hover:bg-ocean-200 text-ocean-700'
                        }`}
                        title="Отнять 1 балл"
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjustScore(index, 1)}
                        className={`w-8 h-8 rounded-lg font-bold text-xl leading-none transition-colors ${
                          isActive
                            ? 'bg-white/20 hover:bg-white/40 text-white'
                            : 'bg-ocean-100 hover:bg-ocean-200 text-ocean-700'
                        }`}
                        title="Добавить 1 балл"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>}

            {/* Action Buttons */}
            {isAdmin && (
              <div className="space-y-2 mt-auto">
                {editMode && onExportData && (
                  <button
                    onClick={onExportData}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    💾 Экспорт данных
                  </button>
                )}
                <button
                  onClick={undoLastAction}
                  disabled={history.length === 0}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  ↩ Отменить
                </button>
                <button
                  onClick={handleReset}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  🔄 Новая игра
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Settings Menu - Normal Mode */}
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <SettingsMenu
                onOpenSettings={() => setIsSettingsOpen(true)}
                isFullscreen={isFullscreen}
              />
            </div>
          )}

          {/* Score Board */}
          {isAdmin && <ScoreBoard />}

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
                    <div className="w-12 flex items-center justify-center font-bold text-ocean-700 text-2xl">
                      {row}
                    </div>
                    {COLUMNS.map((col) => {
                      const coordinate = `${col}${row}`;
                      const { questionId } = getCellType(coordinate, ships, bombs);
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
                            questionId={questionId}
                            editMode={editMode}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {isAdmin && (
              <div className="mt-8 flex justify-center gap-4">
                {editMode && onExportData && (
                  <button
                    onClick={onExportData}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-lg font-semibold py-3 px-8 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    💾 Экспорт данных
                  </button>
                )}
                <button
                  onClick={undoLastAction}
                  disabled={history.length === 0}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-white text-lg font-semibold py-3 px-8 rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  ↩ Отменить
                </button>
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

      {/* Question + answer overlay for participants/viewers */}
      {!isAdmin && remoteQuestion?.isOpen && remoteQuestion?.questionId && !participantDismissed && (() => {
        const q = questions.find(qq => qq.id === remoteQuestion.questionId);
        if (!q) return (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl animate-pulse text-lg">
            Вопрос открыт — ждите решения ведущего...
          </div>
        );
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <div className="text-sm font-semibold text-ocean-600 uppercase">{q.category}</div>
                    <div className="text-2xl font-bold text-ocean-800">{q.points} баллов</div>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-ocean-50 rounded-2xl p-8 mb-6">
                  <div className="text-3xl font-bold text-ocean-900 text-center leading-relaxed whitespace-pre-line">
                    {q.question}
                  </div>
                </div>

                {/* Question images */}
                {q.questionImages && (
                  <div className={`mb-6 ${
                    Array.isArray(q.questionImages) && q.questionImages.length > 1
                      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                      : 'flex justify-center'
                  }`}>
                    {(Array.isArray(q.questionImages) ? q.questionImages : [q.questionImages]).map((src, i) => (
                      <img key={i} src={`/media/${src}`} alt="" className="w-full h-auto object-contain max-h-72 rounded-xl shadow-lg" />
                    ))}
                  </div>
                )}

                {/* Answer — shown only when admin reveals it */}
                {remoteQuestion.answerRevealed ? (
                  <>
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 sm:p-6 animate-in slide-in-from-top duration-300 mb-6">
                      <div className="text-sm font-semibold text-ocean-600 mb-2 uppercase">Правильный ответ:</div>
                      <div className="text-lg sm:text-2xl font-bold text-ocean-900 whitespace-pre-line">{q.answer}</div>
                      {q.answerImages && (
                        <div className={`mt-4 ${
                          Array.isArray(q.answerImages) && q.answerImages.length > 1
                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                            : 'flex justify-center'
                        }`}>
                          {(Array.isArray(q.answerImages) ? q.answerImages : [q.answerImages]).map((src, i) => (
                            <img key={i} src={`/media/${src}`} alt="" className="w-full h-auto object-contain max-h-72 rounded-xl shadow-lg mt-2" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => setParticipantDismissed(true)}
                        className="bg-gradient-to-r from-ocean-600 to-ocean-500 text-white text-xl font-bold py-4 px-10 rounded-xl hover:from-ocean-700 hover:to-ocean-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                      >
                        ✓ Закрыть
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-ocean-500 font-semibold text-lg animate-pulse">
                    Ожидание решения ведущего...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin notification when participant shot is being processed */}
      {isAdmin && remoteQuestion?.coordinate && !isModalOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl text-lg">
          Команда выстрелила в {remoteQuestion.coordinate}
          {remoteQuestion.cellType === 'empty' ? ' — промах!' : remoteQuestion.questionId ? '' : ' — нет вопроса, ход переходит...'}
        </div>
      )}

      {/* "Your turn" banner for participants — always visible */}
      {!isAdmin && myTeamIndex >= 0 && myTeamIndex === currentTurn && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl text-lg">
          Ваш ход! {!remoteQuestion?.isOpen && 'Выберите клетку'}
        </div>
      )}

      {/* Question Modal — only for admin */}
      {isAdmin && isModalOpen && currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          onCorrect={handleCorrectAnswer}
          onWrong={handleWrongAnswer}
          onSkip={handleSkip}
          onTransfer={handleTransfer}
          onClose={() => {
            setIsModalOpen(false);
            onClearSession?.();
          }}
          teams={teams}
          onTeamAnswer={handleTeamAnswer}
          viewMode={viewMode}
          currentTurn={currentTurn}
          isAdmin={isAdmin}
          roomId={roomId}
          onWriteSession={onWriteSession}
          onClearSession={onClearSession}
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
          teams={sortedTeams}
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

      {/* Question Selector Modal */}
      {showQuestionSelector && editingCell && (
        <QuestionSelector
          questions={questions}
          currentQuestionId={editingCell.currentQuestionId}
          onSelect={handleQuestionSelect}
          onClose={() => {
            setShowQuestionSelector(false);
            setEditingCell(null);
          }}
        />
      )}
    </div>
  );
}
