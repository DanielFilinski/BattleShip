import { Routes, Route } from 'react-router-dom';
import { RoomLobby } from './components/RoomLobby';
import { RoomPage } from './components/RoomPage';
import { DisplayScreen } from './components/DisplayScreen';
import { EditorPage } from './components/editor/EditorPage';
import { ModeEditor } from './components/editor/ModeEditor';
import { EditorGuard } from './components/editor/EditorGuard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoomLobby />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="/room/:roomId/display" element={<DisplayScreen />} />
      <Route path="/editor" element={<EditorGuard><EditorPage /></EditorGuard>} />
      <Route path="/editor/:modeId" element={<EditorGuard><ModeEditor /></EditorGuard>} />
    </Routes>
  );
}

export default App;
