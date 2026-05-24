/**
 * useSocket — Custom hook for Socket.IO connection management.
 * Creates a single persistent connection and exposes emit/event registration.
 * Uses a module-level singleton to survive React StrictMode double-invocation.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { PHASES, SOCKET_URL } from '../utils/constants';
import { useGameDispatch } from '../context/GameContext';
import { clearSession, readSession } from '../utils/storage';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef(null);
  const dispatch = useGameDispatch();
  const reconnectKeyRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const tryReconnect = () => {
      const session = readSession();
      if (!session?.roomId || !session?.playerId) return;

      const reconnectKey = `${session.roomId}:${session.playerId}:${socket.id}`;
      if (reconnectKeyRef.current === reconnectKey) return;

      reconnectKeyRef.current = reconnectKey;
      dispatch({ type: 'SET_RECONNECTING', value: true });

      socket.emit('reconnectPlayer', {
        roomId: session.roomId,
        playerId: session.playerId,
      }, (response) => {
        if (response?.error) {
          reconnectKeyRef.current = null;
          if (response.error === 'Room not found' || response.error === 'Player not found in room') {
            clearSession();
            dispatch({ type: 'RESET' });
            dispatch({ type: 'SET_ERROR', error: 'Your previous room is no longer available.' });
            return;
          }

          dispatch({ type: 'SET_RECONNECTING', value: false });
          dispatch({ type: 'SET_ERROR', error: response.error });
        }
      });
    };

    const onConnect = () => {
      console.log('Connected to server:', socket.id);
      dispatch({ type: 'CLEAR_ERROR' });
      tryReconnect();
    };

    const onConnectError = (err) => {
      console.error('Connection error:', err.message);
      dispatch({
        type: 'SET_ERROR',
        error: 'Failed to connect to server. The room will keep trying to reconnect automatically.',
      });
      dispatch({ type: 'SET_RECONNECTING', value: true });
    };

    const onRoomStateUpdated = ({ roomState }) => {
      if (!roomState) return;
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
    };

    const onPlayerJoined = ({ roomState }) => {
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
      if (roomState?.phase === PHASES.SETUP) {
        dispatch({ type: 'SET_PHASE', phase: PHASES.SETUP });
      }
    };

    const onPlayerReady = ({ roomState }) => {
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
    };

    const onGameStarted = ({ board, roomState }) => {
      dispatch({ type: 'SET_BOARD', board });
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
      dispatch({ type: 'SET_PHASE', phase: PHASES.PLAYING });
    };

    const onNumberMarked = ({ markedNumbers, roomState }) => {
      dispatch({ type: 'MARK_NUMBER', markedNumbers });
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
    };

    const onPlayerFinished = ({ finishedPlayers, roomState }) => {
      if (roomState) {
        dispatch({ type: 'SYNC_ROOM_STATE', roomState });
      }

      if (!finishedPlayers || finishedPlayers.length === 0) return;

      const session = readSession();
      const myPlayerId = session?.playerId;
      const notice = finishedPlayers
        .map((entry) => {
          const finishedPlayer = roomState?.players?.find((player) => player.id === entry.playerId);
          const name = entry.playerId === myPlayerId ? 'You' : (finishedPlayer?.name || 'A player');
          const suffix = entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : `${entry.rank}rd`;
          return `${name} finished ${suffix}`;
        })
        .join(' • ');

      dispatch({ type: 'SET_MATCH_NOTICE', notice });
    };

    const onGameOver = ({ winner, reason, roomState }) => {
      if (roomState) {
        dispatch({ type: 'SYNC_ROOM_STATE', roomState });
      }
      dispatch({ type: 'CLEAR_MATCH_NOTICE' });
      dispatch({ type: 'GAME_OVER', winner, reason });
    };

    const onReconnected = ({ roomState, board }) => {
      dispatch({ type: 'SET_RECONNECTING', value: false });
      if (board) {
        dispatch({ type: 'SET_BOARD', board });
      }
      dispatch({ type: 'SYNC_ROOM_STATE', roomState });
      dispatch({ type: 'SET_PHASE', phase: roomState.phase });
    };

    const onRoomClosed = ({ message }) => {
      clearSession();
      dispatch({ type: 'RESET' });
      dispatch({
        type: 'SET_ERROR',
        error: message || 'The room closed because a player did not return in time.',
      });
    };

    const onError = ({ error }) => {
      dispatch({ type: 'SET_RECONNECTING', value: false });
      dispatch({ type: 'SET_ERROR', error });
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('roomStateUpdated', onRoomStateUpdated);
    socket.on('playerJoined', onPlayerJoined);
    socket.on('playerReady', onPlayerReady);
    socket.on('gameStarted', onGameStarted);
    socket.on('numberMarked', onNumberMarked);
    socket.on('playerFinished', onPlayerFinished);
    socket.on('gameOver', onGameOver);
    socket.on('reconnected', onReconnected);
    socket.on('roomClosed', onRoomClosed);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('roomStateUpdated', onRoomStateUpdated);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('playerReady', onPlayerReady);
      socket.off('gameStarted', onGameStarted);
      socket.off('numberMarked', onNumberMarked);
      socket.off('playerFinished', onPlayerFinished);
      socket.off('gameOver', onGameOver);
      socket.off('reconnected', onReconnected);
      socket.off('roomClosed', onRoomClosed);
      socket.off('error', onError);
    };
  }, [dispatch]);

  const emit = useCallback((event, data, callback) => {
    if (!socketRef.current) return;

    if (data === null || data === undefined) {
      if (typeof callback === 'function') {
        socketRef.current.emit(event, callback);
      } else {
        socketRef.current.emit(event);
      }
      return;
    }

    if (typeof callback === 'function') {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { emit, socket: socketRef };
}
