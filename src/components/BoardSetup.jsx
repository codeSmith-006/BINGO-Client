/**
 * BoardSetup — Players arrange numbers 1–25 on their 5×5 grid.
 */
import { useState, useCallback, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import Cell from './Cell';
import { GRID_SIZE, TOTAL_NUMBERS } from '../utils/constants';
import {
  bannerClass,
  cardClass,
  iconClass,
  primaryButtonClass,
  secondaryButtonClass,
  statusOnlineClass,
  statusWaitingClass,
  successButtonClass,
} from '../utils/uiClasses';
import { clearSetupBoard, readSetupBoard, writeSetupBoard } from '../utils/storage';

function createEmptyBoard() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

export default function BoardSetup({ emit }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [board, setBoard] = useState(createEmptyBoard);

  useEffect(() => {
    const persistedBoard = readSetupBoard(state.roomId, state.playerId);
    if (persistedBoard) {
      setBoard(persistedBoard);
      dispatch({ type: 'UPDATE_SETUP_BOARD', board: persistedBoard });
    }
  }, [dispatch, state.playerId, state.roomId]);

  useEffect(() => {
    writeSetupBoard(state.roomId, state.playerId, board);
  }, [board, state.playerId, state.roomId]);

  const usedNumbers = new Set(board.flat().filter((n) => n !== null));
  const allPlaced = usedNumbers.size === TOTAL_NUMBERS;
  const isRoomFull = state.players.length === state.maxPlayers;
  const everyoneReady = isRoomFull && state.players.every((player) => state.readyStatus[player.id] === true);
  const me = state.players.find((player) => player.id === state.playerId);
  const waitingForPlayers = Math.max(state.maxPlayers - state.players.length, 0);

  const handleCellClick = useCallback((row, col) => {
    if (state.readyStatus[state.playerId]) return;

    if (board[row][col] !== null) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = null;
      setBoard(newBoard);
      dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
      return;
    }

    if (selectedNumber === null) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = selectedNumber;
    setBoard(newBoard);
    dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
    setSelectedNumber(null);
  }, [board, dispatch, selectedNumber, state.playerId, state.readyStatus]);

  const handleNumberSelect = (num) => {
    if (state.readyStatus[state.playerId]) return;
    if (usedNumbers.has(num)) return;
    setSelectedNumber(num === selectedNumber ? null : num);
  };

  const handleAutoFill = () => {
    if (state.readyStatus[state.playerId]) return;

    const remaining = [];
    for (let i = 1; i <= TOTAL_NUMBERS; i += 1) {
      if (!usedNumbers.has(i)) remaining.push(i);
    }

    for (let i = remaining.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    const newBoard = board.map((r) => [...r]);
    let idx = 0;
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (newBoard[r][c] === null && idx < remaining.length) {
          newBoard[r][c] = remaining[idx];
          idx += 1;
        }
      }
    }

    setBoard(newBoard);
    dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
    setSelectedNumber(null);
  };

  const handleClear = () => {
    if (state.readyStatus[state.playerId]) return;
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
    setSelectedNumber(null);
  };

  const handleReady = () => {
    if (!allPlaced || state.readyStatus[state.playerId]) return;

    emit('submitBoard', {
      roomId: state.roomId,
      playerId: state.playerId,
      board,
    }, (response) => {
      if (response?.error) {
        dispatch({ type: 'SET_ERROR', error: response.error });
        return;
      }

      clearSetupBoard(state.roomId, state.playerId);
      emit('playerReady', {
        roomId: state.roomId,
        playerId: state.playerId,
      });
    });
  };

  const handleStartGame = () => {
    emit('startGame', {
      roomId: state.roomId,
      playerId: state.playerId,
    }, (response) => {
      if (response?.error) {
        dispatch({ type: 'SET_ERROR', error: response.error });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-5">
      <div className={`${cardClass} w-full max-w-3xl p-4 sm:p-8`}>
        <div className="text-center mb-5 sm:mb-7">
          <h2 className="text-xl sm:text-3xl font-bold mb-1 text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Set Up Your Board
          </h2>
          <p className="text-[#4A5A65] text-xs sm:text-sm">
            Arrange your 25 numbers while the room fills up.
          </p>
        </div>

        {state.error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF9B51] border-2 border-[#25343F] text-[#25343F] text-sm text-center">
            {state.error}
          </div>
        )}

        {state.reconnecting && (
          <div className={`${bannerClass} mb-4 text-center py-3 px-4 text-[#25343F] text-sm`}>
            Reconnecting to the room...
          </div>
        )}

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {state.players.map((player) => {
            const isMe = player.id === state.playerId;
            const ready = state.readyStatus[player.id] === true;
            const connected = !state.disconnectedPlayerIds.includes(player.id);

            return (
              <div key={player.id} className="rounded-xl border-2 border-[#25343F] bg-[#BFC9D1] p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#25343F] truncate">
                    {isMe ? 'You' : player.name}
                    {player.role === 'host' ? ' - Host' : ''}
                  </span>
                  <span className={connected ? (ready ? statusOnlineClass : statusWaitingClass) : 'inline-block h-2 w-2 rounded-full bg-[#25343F]/40'}></span>
                </div>
                <p className="mt-1.5 text-[0.65rem] sm:text-xs uppercase tracking-[0.12em] text-[#4A5A65]">
                  {!connected ? 'Disconnected' : ready ? 'Ready' : 'Setting up'}
                </p>
              </div>
            );
          })}
        </div>

        {!isRoomFull && (
          <div className={`${bannerClass} mb-5 text-center py-2.5 px-4 text-[#25343F] text-xs sm:text-sm`}>
            Waiting for {waitingForPlayers} more player{waitingForPlayers > 1 ? 's' : ''} to join this {state.maxPlayers}-player room.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
          <div>
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3 mb-5 sm:mb-7">
              {board.map((row, rowIndex) =>
                row.map((num, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    number={num}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={state.readyStatus[state.playerId]}
                    variant={num ? 'setup-filled' : 'setup-empty'}
                  />
                )),
              )}
            </div>

            {!state.readyStatus[state.playerId] && (
              <div className="mb-5">
                <p className="text-[0.7rem] sm:text-xs text-[#6F7F89] uppercase tracking-[0.15em] mb-3 text-center">
                  {selectedNumber ? `Selected: ${selectedNumber} - tap a cell to place` : 'Select a number'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-[0.7rem] border-[1.5px] border-[#25343F] bg-[#EAEFEF] text-[0.8rem] font-bold text-[#25343F] shadow-[1px_1px_0_#25343F] transition sm:h-[2.6rem] sm:w-[2.6rem] sm:text-sm ${usedNumbers.has(num) ? 'cursor-not-allowed opacity-35 shadow-none' : 'hover:-translate-x-px hover:-translate-y-px hover:bg-[#BFC9D1]'} ${selectedNumber === num ? 'bg-[#FF9B51]' : ''}`}
                      onClick={() => handleNumberSelect(num)}
                      disabled={usedNumbers.has(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {!state.readyStatus[state.playerId] && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <button onClick={handleAutoFill} className={`${secondaryButtonClass} py-2 text-sm`}>
                  <span className="inline-flex items-center justify-center gap-2">
                    <i className={`fi fi-br-dice ${iconClass}`} aria-hidden="true"></i>
                    <span>Auto-Fill</span>
                  </span>
                </button>
                <button onClick={handleClear} className={`${secondaryButtonClass} py-2 text-sm`}>
                  <span className="inline-flex items-center justify-center gap-2">
                    <i className={`fi fi-br-circle-trash ${iconClass}`} aria-hidden="true"></i>
                    <span>Clear</span>
                  </span>
                </button>
              </div>
            )}

            {!state.readyStatus[state.playerId] && (
              <button
                onClick={handleReady}
                disabled={!allPlaced}
                className={`${successButtonClass} py-3 text-sm sm:text-lg`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <i className={`fi fi-br-check ${iconClass}`} aria-hidden="true"></i>
                  <span>Ready</span>
                </span>
              </button>
            )}

            {state.readyStatus[state.playerId] && (
              <div className={`${bannerClass} text-center py-3 px-4 text-[#25343F] text-xs sm:text-sm`}>
                Your board is locked in. Waiting for the rest of the room.
              </div>
            )}

            {me?.role === 'host' && (
              <button
                onClick={handleStartGame}
                disabled={!everyoneReady}
                className={`${primaryButtonClass} py-3 text-sm sm:text-lg ${!everyoneReady ? 'animate-pulse' : ''}`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <i className={`fi ${everyoneReady ? 'fi-br-rocket-lunch' : 'fi-br-clock'} ${iconClass}`} aria-hidden="true"></i>
                  <span>{everyoneReady ? 'Start Game' : 'Waiting for everyone...'}</span>
                </span>
              </button>
            )}

            {me?.role !== 'host' && (
              <div className={`${bannerClass} text-center py-3 px-4 text-[#25343F] text-xs sm:text-sm`}>
                Waiting for the host to start once everyone is ready.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
