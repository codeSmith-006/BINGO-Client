/**
 * GameContext — Central state management for the Bingo game.
 * Uses React Context + useReducer for predictable state updates.
 */
import { createContext, useContext, useEffect, useReducer } from 'react';
import { PHASES } from '../utils/constants';
import { clearSession, readSession, writeSession } from '../utils/storage';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

function createEmptyBoard() {
  return Array(5).fill(null).map(() => Array(5).fill(null));
}

function buildInitialState() {
  const session = readSession();

  return {
    phase: PHASES.LOBBY,
    role: session?.role || null,
    roomId: session?.roomId || null,
    playerId: session?.playerId || null,
    maxPlayers: session?.maxPlayers || 2,
    board: null,
    setupBoard: createEmptyBoard(),
    markedNumbers: [],
    winner: null,
    winReason: null,
    players: [],
    lineCount: {},
    readyStatus: {},
    currentTurnPlayerId: null,
    placements: [],
    matchNotice: null,
    error: null,
    disconnectedPlayerIds: [],
    reconnecting: Boolean(session?.roomId && session?.playerId),
  };
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        roomId: action.roomId,
        playerId: action.playerId,
        role: action.role,
        maxPlayers: action.maxPlayers ?? state.maxPlayers,
        error: null,
        reconnecting: false,
      };

    case 'SYNC_ROOM_STATE': {
      const players = action.roomState.players ?? state.players;
      const disconnectedPlayerIds = action.roomState.disconnectedPlayerIds
        ?? players
          .filter((player) => player.connected === false || player.isConnected === false)
          .map((player) => player.id);

      return {
        ...state,
        phase: action.roomState.phase ?? state.phase,
        maxPlayers: action.roomState.maxPlayers ?? action.roomState.targetPlayerCount ?? state.maxPlayers,
        players,
        readyStatus: action.roomState.readyStatus ?? state.readyStatus,
        markedNumbers: action.roomState.markedNumbers ?? state.markedNumbers,
        lineCount: action.roomState.lineCount ?? state.lineCount,
        winner: action.roomState.winner ?? state.winner,
        currentTurnPlayerId: action.roomState.currentTurnPlayerId ?? state.currentTurnPlayerId,
        placements: action.roomState.placements ?? state.placements,
        disconnectedPlayerIds,
      };
    }

    case 'SET_MATCH_NOTICE':
      return {
        ...state,
        matchNotice: action.notice,
      };

    case 'CLEAR_MATCH_NOTICE':
      return {
        ...state,
        matchNotice: null,
      };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_RECONNECTING':
      return { ...state, reconnecting: action.value };

    case 'UPDATE_SETUP_BOARD':
      return { ...state, setupBoard: action.board };

    case 'SET_BOARD':
      return { ...state, board: action.board };

    case 'MARK_NUMBER':
      return {
        ...state,
        markedNumbers: action.markedNumbers,
      };

    case 'GAME_OVER':
      return {
        ...state,
        phase: PHASES.GAME_OVER,
        winner: action.winner,
        winReason: action.reason,
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return buildInitialState();

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, buildInitialState);

  useEffect(() => {
    if (state.roomId && state.playerId && state.role) {
      writeSession({
        roomId: state.roomId,
        playerId: state.playerId,
        role: state.role,
        maxPlayers: state.maxPlayers,
      });
      return;
    }

    clearSession();
  }, [state.roomId, state.playerId, state.role, state.maxPlayers]);

  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

export function useGameDispatch() {
  const context = useContext(GameDispatchContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameProvider');
  }
  return context;
}
