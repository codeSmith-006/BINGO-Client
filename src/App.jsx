/**
 * App — Root component that routes between game phases.
 */
import { useGameState } from './context/GameContext';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import BoardSetup from './components/BoardSetup';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';
import { PHASES } from './utils/constants';

export default function App() {
  const state = useGameState();
  const { emit } = useSocket();

  return (
    <>
      {state.phase === PHASES.LOBBY && <Lobby emit={emit} />}
      {state.phase === PHASES.SETUP && <BoardSetup emit={emit} />}
      {state.phase === PHASES.PLAYING && <GameBoard emit={emit} />}
      {state.phase === PHASES.GAME_OVER && <GameOver />}
    </>
  );
}
