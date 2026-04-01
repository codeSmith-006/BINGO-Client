/**
 * GameContext — Central state management for the Bingo game.
 * Uses React Context + useReducer for predictable state updates.
 */
import { createContext, useContext, useReducer } from 'react';
import { PHASES } from '../utils/constants';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

// Initial game state
const initialState = {
    phase: PHASES.LOBBY,
    role: null,          // 'host' | 'joiner'
    roomId: null,
    playerId: null,
    board: null,         // 5×5 array of numbers (player's own board)
    setupBoard: Array(5).fill(null).map(() => Array(5).fill(null)), // Board being built during setup
    markedNumbers: [],   // Numbers that have been called/marked
    myLines: 0,
    opponentLines: 0,
    opponentId: null,
    opponentReady: false,
    myReady: false,
    allReady: false,
    winner: null,
    winReason: null,
    players: [],
    currentTurnPlayerId: null,
    error: null,
    opponentDisconnected: false,
};

// Reducer actions
function gameReducer(state, action) {
    switch (action.type) {
        case 'SET_ROOM':
            return {
                ...state,
                roomId: action.roomId,
                playerId: action.playerId,
                role: action.role,
                error: null,
            };

        case 'SET_PHASE':
            return { ...state, phase: action.phase };

        case 'SET_PLAYERS':
            return {
                ...state,
                players: action.players,
                opponentId: action.players.find(p => p.id !== state.playerId)?.id || null,
            };

        case 'SET_CURRENT_TURN':
            return {
                ...state,
                currentTurnPlayerId: action.playerId,
            };

        case 'UPDATE_SETUP_BOARD':
            return { ...state, setupBoard: action.board };

        case 'SET_BOARD':
            return { ...state, board: action.board };

        case 'SET_MY_READY':
            return { ...state, myReady: true };

        case 'SET_OPPONENT_READY':
            return { ...state, opponentReady: true };

        case 'SET_ALL_READY':
            return { ...state, allReady: action.allReady };

        case 'MARK_NUMBER':
            return {
                ...state,
                markedNumbers: action.markedNumbers,
            };

        case 'UPDATE_LINES':
            return {
                ...state,
                myLines: action.lineUpdates[state.playerId] || state.myLines,
                opponentLines: action.lineUpdates[state.opponentId] || state.opponentLines,
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

        case 'OPPONENT_DISCONNECTED':
            return { ...state, opponentDisconnected: true };

        case 'OPPONENT_RECONNECTED':
            return { ...state, opponentDisconnected: false };

        case 'RESET':
            return { ...initialState };

        default:
            return state;
    }
}

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);

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
    if (!context && context !== initialState) {
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
