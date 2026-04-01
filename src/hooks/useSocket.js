/**
 * useSocket — Custom hook for Socket.IO connection management.
 * Creates a single persistent connection and exposes emit/event registration.
 * Uses a module-level singleton to survive React StrictMode double-invocation.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, PHASES } from '../utils/constants';
import { useGameDispatch } from '../context/GameContext';

// Module-level singleton so React StrictMode doesn't create duplicate connections
let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      // Start with polling so hosts like Render can complete the initial
      // handshake before upgrading to WebSocket.
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef(null);
  const dispatch = useGameDispatch();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Ensure connected
    if (!socket.connected) {
      socket.connect();
    }

    // ── Incoming event listeners ──

    const onConnect = () => {
      console.log('🔌 Connected to server:', socket.id);
    };

    const onConnectError = (err) => {
      console.error('Connection error:', err.message);
      dispatch({
        type: 'SET_ERROR',
        error: 'Failed to connect to server. If the backend is on Render, wait a few seconds and try again.',
      });
    };

    const onPlayerJoined = ({ roomState }) => {
      dispatch({ type: 'SET_PLAYERS', players: roomState.players });
      dispatch({ type: 'SET_CURRENT_TURN', playerId: roomState.currentTurnPlayerId });
      if (roomState.phase === 'setup') {
        dispatch({ type: 'SET_PHASE', phase: PHASES.SETUP });
      }
    };

    const onBoardSubmitted = () => {
      console.log('✅ Board submitted successfully');
    };

    const onPlayerReady = ({ playerId, allReady, roomState }) => {
      dispatch({ type: 'SET_ALL_READY', allReady });
      dispatch({ type: 'SET_PLAYERS', players: roomState.players });
      dispatch({ type: 'SET_CURRENT_TURN', playerId: roomState.currentTurnPlayerId });
    };

    const onGameStarted = ({ board, roomState }) => {
      dispatch({ type: 'SET_BOARD', board });
      dispatch({ type: 'SET_PHASE', phase: PHASES.PLAYING });
      dispatch({ type: 'SET_PLAYERS', players: roomState.players });
      dispatch({ type: 'SET_CURRENT_TURN', playerId: roomState.currentTurnPlayerId });
    };

    const onNumberMarked = ({ number, markedBy, markedNumbers, lineUpdates, roomState }) => {
      dispatch({ type: 'MARK_NUMBER', markedNumbers });
      dispatch({ type: 'UPDATE_LINES', lineUpdates });
      dispatch({ type: 'SET_CURRENT_TURN', playerId: roomState.currentTurnPlayerId });
    };

    const onGameOver = ({ winner, reason }) => {
      dispatch({ type: 'GAME_OVER', winner, reason });
    };

    const onPlayerDisconnected = () => {
      dispatch({ type: 'OPPONENT_DISCONNECTED' });
    };

    const onPlayerReconnected = () => {
      dispatch({ type: 'OPPONENT_RECONNECTED' });
    };

    const onReconnected = ({ roomState, board }) => {
      dispatch({ type: 'SET_BOARD', board });
      dispatch({ type: 'SET_PHASE', phase: roomState.phase });
      dispatch({ type: 'MARK_NUMBER', markedNumbers: roomState.markedNumbers });
      dispatch({ type: 'SET_PLAYERS', players: roomState.players });
      dispatch({ type: 'SET_CURRENT_TURN', playerId: roomState.currentTurnPlayerId });
    };

    const onError = ({ error }) => {
      dispatch({ type: 'SET_ERROR', error });
    };

    // Register all listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('playerJoined', onPlayerJoined);
    socket.on('boardSubmitted', onBoardSubmitted);
    socket.on('playerReady', onPlayerReady);
    socket.on('gameStarted', onGameStarted);
    socket.on('numberMarked', onNumberMarked);
    socket.on('gameOver', onGameOver);
    socket.on('playerDisconnected', onPlayerDisconnected);
    socket.on('playerReconnected', onPlayerReconnected);
    socket.on('reconnected', onReconnected);
    socket.on('error', onError);

    // Cleanup: remove listeners but do NOT disconnect the socket
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('boardSubmitted', onBoardSubmitted);
      socket.off('playerReady', onPlayerReady);
      socket.off('gameStarted', onGameStarted);
      socket.off('numberMarked', onNumberMarked);
      socket.off('gameOver', onGameOver);
      socket.off('playerDisconnected', onPlayerDisconnected);
      socket.off('playerReconnected', onPlayerReconnected);
      socket.off('reconnected', onReconnected);
      socket.off('error', onError);
    };
  }, [dispatch]);

  /**
   * Emit wrapper that handles the case where data is null/undefined.
   * Socket.IO passes positional args, so `emit('event', null, cb)` would send
   * `null` as the first arg to the server handler. We skip null data.
   */
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current) {
      if (data === null || data === undefined) {
        if (typeof callback === 'function') {
          socketRef.current.emit(event, callback);
        } else {
          socketRef.current.emit(event);
        }
      } else {
        if (typeof callback === 'function') {
          socketRef.current.emit(event, data, callback);
        } else {
          socketRef.current.emit(event, data);
        }
      }
    }
  }, []);

  return { emit, socket: socketRef };
}
