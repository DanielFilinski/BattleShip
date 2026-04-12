import { Routes, Route } from 'react-router-dom';
import { RoomLobby } from './components/RoomLobby';
import { RoomPage } from './components/RoomPage';
import { DisplayScreen } from './components/DisplayScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoomLobby />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="/room/:roomId/display" element={<DisplayScreen />} />
    </Routes>
  );
}

export default App;
