import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameBoard } from './components/GameBoard';
import { loadQuestions, loadShips, loadBombs } from './utils/loadData';
import { Question } from './types/question';
import { Ship, Bomb } from './types/game';

function App() {
  const { gameStarted, gameMode } = useGameState();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load game data when gameStarted and gameMode are available
  useEffect(() => {
    if (gameStarted && gameMode && questions.length === 0) {
      loadGameData(gameMode);
    }
  }, [gameStarted, gameMode]);

  const loadGameData = async (mode: string) => {
    try {
      setLoading(true);
      const [loadedQuestions, loadedShips, loadedBombs] = await Promise.all([
        loadQuestions(mode),
        loadShips(mode),
        loadBombs(mode),
      ]);

      setQuestions(loadedQuestions);
      setShips(loadedShips);
      setBombs(loadedBombs);

      if (loadedQuestions.length === 0) {
        setError('Не удалось загрузить вопросы');
      }
    } catch (err) {
      console.error('Failed to load game data:', err);
      setError('Ошибка загрузки данных игры');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    loadGameData(mode);
  };

  const updateShipCell = (shipId: string, cellIndex: number, newCell: string, newQuestionId: string) => {
    setShips(prevShips =>
      prevShips.map(ship =>
        ship.id === shipId
          ? {
              ...ship,
              cells: ship.cells.map((cell, idx) => (idx === cellIndex ? newCell : cell)),
              questionIds: ship.questionIds.map((qId, idx) => (idx === cellIndex ? newQuestionId : qId)),
            }
          : ship
      )
    );
  };

  const updateBomb = (oldCell: string, newCell: string, newQuestionId: string) => {
    setBombs(prevBombs =>
      prevBombs.map(bomb =>
        bomb.cell === oldCell
          ? { cell: newCell, questionId: newQuestionId }
          : bomb
      )
    );
  };

  const exportGameData = () => {
    const data = {
      ships,
      bombs,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-data-edited.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⚓</div>
          <div className="text-2xl font-semibold">Загрузка игры...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Ошибка загрузки
          </h1>
          <p className="text-xl text-ocean-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-ocean-600 text-white text-lg font-semibold py-3 px-8 rounded-xl hover:bg-ocean-700 transition-colors"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!gameStarted ? (
        <WelcomeScreen onModeSelect={handleModeSelect} />
      ) : (
        <GameBoard
          questions={questions}
          ships={ships}
          bombs={bombs}
          onUpdateShipCell={updateShipCell}
          onUpdateBomb={updateBomb}
          onExportData={exportGameData}
        />
      )}
    </>
  );
}

export default App;
