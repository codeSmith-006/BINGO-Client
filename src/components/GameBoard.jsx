/**
 * GameBoard — The main gameplay screen.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import Cell from './Cell';
import BingoHeader from './BingoHeader';
import { bannerClass, cardClass, dividerClass, iconClass } from '../utils/uiClasses';

function getCompletedLineIds(board, markedSet) {
  if (!board) return [];

  const completed = [];

  for (let row = 0; row < 5; row += 1) {
    if (board[row].every((number) => markedSet.has(number))) {
      completed.push(`row-${row}`);
    }
  }

  for (let col = 0; col < 5; col += 1) {
    if ([0, 1, 2, 3, 4].every((row) => markedSet.has(board[row][col]))) {
      completed.push(`col-${col}`);
    }
  }

  return completed;
}

function LineOverlay({ lineId, animate }) {
  const [type, indexValue] = lineId.split('-');
  const index = Number(indexValue);

  const baseClass = animate ? (type === 'row' ? 'bingo-line-animate-row' : 'bingo-line-animate-col') : '';
  if (type === 'row') {
    return (
      <div
        className={`pointer-events-none absolute left-[4%] right-[4%] h-[0.42rem] -translate-y-1/2 rounded-full bg-[#25343F]/82 shadow-[0_0_0_3px_rgba(255,155,81,0.55)] ${baseClass}`}
        style={{ top: `${(index + 0.5) * 20}%` }}
      />
    );
  }

  return (
    <div
      className={`pointer-events-none absolute top-[4%] bottom-[4%] w-[0.42rem] -translate-x-1/2 rounded-full bg-[#25343F]/82 shadow-[0_0_0_3px_rgba(255,155,81,0.55)] ${baseClass}`}
      style={{ left: `${(index + 0.5) * 20}%` }}
    />
  );
}

export default function GameBoard({ emit }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [animatedLineIds, setAnimatedLineIds] = useState([]);
  const previousCompletedRef = useRef([]);

  const markedSet = useMemo(() => new Set(state.markedNumbers), [state.markedNumbers]);
  const isGameOver = state.phase === 'gameOver';
  const currentTurnPlayer = state.players.find((player) => player.id === state.currentTurnPlayerId);
  const disconnectedPlayers = state.players.filter((player) => state.disconnectedPlayerIds.includes(player.id));
  const myPlacement = state.placements.find((placement) => placement.playerId === state.playerId);
  const isSpectatingAfterFinish = Boolean(myPlacement) && !isGameOver;
  const isMyTurn = state.currentTurnPlayerId === state.playerId && !myPlacement;
  const localCompletedLineIds = useMemo(
    () => getCompletedLineIds(state.board, markedSet),
    [state.board, markedSet],
  );

  useEffect(() => {
    const previous = previousCompletedRef.current;
    const nextAnimated = localCompletedLineIds.filter((lineId) => !previous.includes(lineId));

    if (nextAnimated.length > 0) {
      setAnimatedLineIds(nextAnimated);
      const timer = window.setTimeout(() => setAnimatedLineIds([]), 900);
      previousCompletedRef.current = localCompletedLineIds;
      return () => window.clearTimeout(timer);
    }

    previousCompletedRef.current = localCompletedLineIds;
    return undefined;
  }, [localCompletedLineIds]);

  useEffect(() => {
    if (!state.matchNotice) return undefined;

    const timer = window.setTimeout(() => {
      dispatch({ type: 'CLEAR_MATCH_NOTICE' });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [dispatch, state.matchNotice]);

  const handleNumberClick = useCallback((number) => {
    if (isGameOver || !isMyTurn || markedSet.has(number)) return;

    emit('numberClicked', {
      roomId: state.roomId,
      playerId: state.playerId,
      number,
    }, (response) => {
      if (response?.error) {
        dispatch({ type: 'SET_ERROR', error: response.error });
      }
    });
  }, [dispatch, emit, isGameOver, isMyTurn, markedSet, state.playerId, state.roomId]);

  const sortedPlayers = [...state.players].sort((left, right) => {
    const leftPlacement = state.placements.find((entry) => entry.playerId === left.id)?.rank ?? 99;
    const rightPlacement = state.placements.find((entry) => entry.playerId === right.id)?.rank ?? 99;

    if (leftPlacement !== rightPlacement) {
      return leftPlacement - rightPlacement;
    }

    return (state.lineCount[right.id] || 0) - (state.lineCount[left.id] || 0);
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4">
      {disconnectedPlayers.length > 0 && (
        <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-xl -translate-x-1/2 rounded-xl border-2 border-[#25343F] bg-[#FF9B51] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#25343F]">
          <span className="inline-flex items-center gap-2">
            <i className={`fi fi-br-triangle-warning ${iconClass}`} aria-hidden="true"></i>
            <span>
              {disconnectedPlayers.map((player) => player.name).join(', ')} disconnected. The room is paused while they reconnect.
            </span>
          </span>
        </div>
      )}

      {state.matchNotice && (
        <div className="fixed top-16 left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-lg -translate-x-1/2 rounded-xl border-2 border-[#25343F] bg-[#EAEFEF] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-[#25343F] shadow-[3px_3px_0_#25343F]">
          {state.matchNotice}
        </div>
      )}

      <div className={`${cardClass} w-full max-w-4xl p-3 sm:p-6`}>
        <div className="text-center mb-3 sm:mb-4">
          <span className="text-[0.65rem] sm:text-xs text-[#6F7F89] uppercase tracking-[0.18em]">
            Room: {state.roomId} - {state.players.length}/{state.maxPlayers} players
          </span>
        </div>

        <div className="grid gap-2 sm:gap-3 md:grid-cols-3 mb-4 sm:mb-5">
          {sortedPlayers.map((player) => {
            const isMe = player.id === state.playerId;
            const isTurn = state.currentTurnPlayerId === player.id;
            const disconnected = state.disconnectedPlayerIds.includes(player.id);
            const lines = state.lineCount[player.id] || 0;
            const placement = state.placements.find((entry) => entry.playerId === player.id)?.rank;

            return (
              <div key={player.id} className="rounded-xl border-2 border-[#25343F] bg-[#BFC9D1] p-2.5 sm:p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#25343F] truncate">
                      {isMe ? 'You' : player.name}
                      {player.role === 'host' ? ' - Host' : ''}
                    </div>
                    <div className="text-[0.62rem] sm:text-xs uppercase tracking-[0.12em] text-[#4A5A65]">
                      {placement
                        ? `${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : 'rd'} place`
                        : disconnected
                          ? 'Disconnected'
                          : isTurn
                            ? 'Current turn'
                            : 'In game'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-[#25343F]">{lines}/5</div>
                    <div className="text-[0.6rem] sm:text-[0.7rem] uppercase tracking-[0.12em] text-[#4A5A65]">Lines</div>
                  </div>
                </div>
                <div className="mt-2">
                  <BingoHeader lineCount={lines} compact />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${dividerClass} mb-4 sm:mb-5`}></div>

        <div className={`mb-4 rounded-xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-bold ${
          isMyTurn
            ? 'bg-[#FF9B51] border-[#25343F] text-[#25343F]'
            : 'bg-[#BFC9D1] border-[#25343F] text-[#25343F]'
        }`}>
          {isSpectatingAfterFinish
            ? `You finished ${myPlacement.rank}${myPlacement.rank === 1 ? 'st' : myPlacement.rank === 2 ? 'nd' : 'rd'}. You are now watching the rest of the game.`
            : isMyTurn
              ? 'Your turn: choose one number.'
              : `${currentTurnPlayer?.name || 'Another player'} is playing now.`}
        </div>

        {state.reconnecting && (
          <div className={`${bannerClass} mb-4 text-center py-3 px-4 text-[#25343F] text-sm`}>
            Reconnecting to the room...
          </div>
        )}

        {state.board && (
          <div className="mx-auto w-full max-w-[16.25rem] sm:max-w-[19rem]">
            <div className="relative">
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                {state.board.map((row, rowIndex) =>
                  row.map((num, colIndex) => (
                    <Cell
                      key={`${rowIndex}-${colIndex}`}
                      number={num}
                      isMarked={markedSet.has(num)}
                      onClick={() => handleNumberClick(num)}
                      disabled={isGameOver || !isMyTurn || markedSet.has(num)}
                    />
                  )),
                )}
              </div>

              {localCompletedLineIds.map((lineId) => (
                <LineOverlay
                  key={lineId}
                  lineId={lineId}
                  animate={animatedLineIds.includes(lineId)}
                />
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="mt-4 p-3 rounded-xl bg-[#FF9B51] border-2 border-[#25343F] text-[#25343F] text-sm text-center">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
