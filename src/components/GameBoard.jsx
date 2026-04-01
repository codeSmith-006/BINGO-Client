/**
 * GameBoard — The main gameplay screen.
 * Shows the player's board, BINGO progress for both players,
 * and handles number clicking/marking.
 */
import { useCallback } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import Cell from './Cell';
import BingoHeader from './BingoHeader';

export default function GameBoard({ emit }) {
    const state = useGameState();
    const dispatch = useGameDispatch();

    const markedSet = new Set(state.markedNumbers);
    const isGameOver = state.phase === 'gameOver';
    const isMyTurn = state.currentTurnPlayerId === state.playerId;

    const handleNumberClick = useCallback((number) => {
        if (isGameOver) return;
        if (!isMyTurn) return;
        if (markedSet.has(number)) return;

        emit('numberClicked', {
            roomId: state.roomId,
            playerId: state.playerId,
            number,
        }, (response) => {
            if (response?.error) {
                dispatch({ type: 'SET_ERROR', error: response.error });
            }
        });
    }, [emit, state.roomId, state.playerId, isGameOver, isMyTurn, markedSet, dispatch]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-5">
            {/* Disconnect banner */}
            {state.opponentDisconnected && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#FF9B51] border-2 border-[#25343F] text-[#25343F] text-sm font-bold animate-fade-in">
                    ⚠️ Opponent disconnected — waiting for reconnect...
                </div>
            )}

            <div className="glass-card p-5 sm:p-8 max-w-xl w-full animate-fade-in">
                {/* Room info */}
                <div className="text-center mb-4">
                    <span className="text-xs text-[#6F7F89] uppercase tracking-[0.2em]">
                        Room: {state.roomId}
                    </span>
                </div>

                {/* BINGO Progress — Both Players */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-8 mb-6">
                    <BingoHeader lineCount={state.myLines} label="You" />
                    <div className="hidden sm:block w-px h-16 bg-[#25343F]/20"></div>
                    <BingoHeader lineCount={state.opponentLines} label="Opponent" />
                </div>

                {/* Separator */}
                <div className="retro-divider mb-6"></div>

                {/* Score summary */}
                <div className="flex justify-between items-center mb-5 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#25343F]">
                            Your lines: {state.myLines}/5
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#4A5A65]">
                            Opponent: {state.opponentLines}/5
                        </span>
                    </div>
                </div>

                <div className={`mb-5 rounded-xl border-2 px-5 py-3.5 text-center text-sm font-bold ${
                    isMyTurn
                        ? 'bg-[#FF9B51] border-[#25343F] text-[#25343F]'
                        : 'bg-[#BFC9D1] border-[#25343F] text-[#25343F]'
                }`}>
                    {isMyTurn ? 'Your turn: choose one number.' : 'Opponent turn: wait for their move.'}
                </div>

                {/* 5×5 Game Board */}
                {state.board && (
                    <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                        {state.board.map((row, rowIndex) =>
                            row.map((num, colIndex) => (
                                <Cell
                                    key={`${rowIndex}-${colIndex}`}
                                    number={num}
                                    isMarked={markedSet.has(num)}
                                    onClick={() => handleNumberClick(num)}
                                    disabled={isGameOver || !isMyTurn || markedSet.has(num)}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Error */}
                {state.error && (
                    <div className="mt-4 p-3 rounded-xl bg-[#FF9B51] border-2 border-[#25343F] text-[#25343F] text-sm text-center">
                        {state.error}
                    </div>
                )}
            </div>
        </div>
    );
}
