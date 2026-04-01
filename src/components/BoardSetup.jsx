/**
 * BoardSetup — Players arrange numbers 1–25 on their 5×5 grid.
 * Includes a number palette to select numbers and click cells to place them.
 */
import { useState, useCallback } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import Cell from './Cell';
import { GRID_SIZE, TOTAL_NUMBERS } from '../utils/constants';

export default function BoardSetup({ emit }) {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [board, setBoard] = useState(
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
    );

    // Track which numbers have been placed on the board
    const usedNumbers = new Set(board.flat().filter(n => n !== null));
    const allPlaced = usedNumbers.size === TOTAL_NUMBERS;

    // Handle clicking a cell to place the selected number
    const handleCellClick = useCallback((row, col) => {
        if (state.myReady) return;

        // If cell already has a number, remove it
        if (board[row][col] !== null) {
            const newBoard = board.map(r => [...r]);
            newBoard[row][col] = null;
            setBoard(newBoard);
            dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
            return;
        }

        // If no number is selected, do nothing
        if (selectedNumber === null) return;

        // Place the number
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = selectedNumber;
        setBoard(newBoard);
        dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
        setSelectedNumber(null);
    }, [board, selectedNumber, state.myReady, dispatch]);

    // Handle clicking a number in the palette
    const handleNumberSelect = (num) => {
        if (state.myReady) return;
        if (usedNumbers.has(num)) return;
        setSelectedNumber(num === selectedNumber ? null : num);
    };

    // Auto-fill remaining cells randomly
    const handleAutoFill = () => {
        if (state.myReady) return;
        const remaining = [];
        for (let i = 1; i <= TOTAL_NUMBERS; i++) {
            if (!usedNumbers.has(i)) remaining.push(i);
        }

        // Shuffle
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }

        const newBoard = board.map(r => [...r]);
        let idx = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (newBoard[r][c] === null && idx < remaining.length) {
                    newBoard[r][c] = remaining[idx++];
                }
            }
        }
        setBoard(newBoard);
        dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
        setSelectedNumber(null);
    };

    // Clear the entire board
    const handleClear = () => {
        if (state.myReady) return;
        const newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        setBoard(newBoard);
        dispatch({ type: 'UPDATE_SETUP_BOARD', board: newBoard });
        setSelectedNumber(null);
    };

    // Submit board and mark as ready
    const handleReady = () => {
        if (!allPlaced || state.myReady) return;

        emit('submitBoard', {
            roomId: state.roomId,
            playerId: state.playerId,
            board,
        }, (response) => {
            if (response.error) {
                dispatch({ type: 'SET_ERROR', error: response.error });
                return;
            }

            // Mark ready
            emit('playerReady', {
                roomId: state.roomId,
                playerId: state.playerId,
            });
            dispatch({ type: 'SET_MY_READY' });
        });
    };

    // Host starts the game
    const handleStartGame = () => {
        emit('startGame', {
            roomId: state.roomId,
            playerId: state.playerId,
        }, (response) => {
            if (response.error) {
                dispatch({ type: 'SET_ERROR', error: response.error });
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-5">
            <div className="glass-card p-5 sm:p-8 max-w-xl w-full animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-7">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Set Up Your Board
                    </h2>
                    <p className="text-[#4A5A65] text-sm">
                        Select a number, then click a cell to place it
                    </p>
                </div>

                {/* Error */}
                {state.error && (
                    <div className="mb-4 p-3 rounded-xl bg-[#FF9B51] border-2 border-[#25343F] text-[#25343F] text-sm text-center">
                        {state.error}
                    </div>
                )}

                {/* Player status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 px-1">
                    <div className="flex items-center gap-2">
                        <span className={`status-dot ${state.myReady ? 'online' : 'waiting'}`}></span>
                        <span className="text-sm text-[#25343F]">
                            You {state.myReady ? '— Ready!' : '— Setting up'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#25343F]">
                            Opponent {state.allReady ? '— Ready!' :
                                state.players.length > 1 ? '— Setting up' : '— Not here'}
                        </span>
                        <span className={`status-dot ${state.allReady ? 'online' : 'waiting'}`}></span>
                    </div>
                </div>

                {/* 5×5 Grid */}
                <div className="grid grid-cols-5 gap-2.5 sm:gap-3 mb-6 sm:mb-7">
                    {board.map((row, rowIndex) =>
                        row.map((num, colIndex) => (
                            <Cell
                                key={`${rowIndex}-${colIndex}`}
                                number={num}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                disabled={state.myReady}
                                variant={num ? 'setup-filled' : 'setup-empty'}
                            />
                        ))
                    )}
                </div>

                {/* Number Palette */}
                {!state.myReady && (
                    <div className="mb-6">
                        <p className="text-xs text-[#6F7F89] uppercase tracking-[0.15em] mb-4 text-center">
                            {selectedNumber ? `Selected: ${selectedNumber} — click a cell to place` : 'Select a number'}
                        </p>
                        <div className="flex flex-wrap gap-2.5 justify-center">
                            {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    className={`number-chip ${usedNumbers.has(num) ? 'used' : ''} ${selectedNumber === num ? 'selected' : ''}`}
                                    onClick={() => handleNumberSelect(num)}
                                    disabled={usedNumbers.has(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-4">
                    {!state.myReady && (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleAutoFill} className="btn-secondary flex-1 text-sm py-2">
                                🎲 Auto-Fill
                            </button>
                            <button onClick={handleClear} className="btn-secondary flex-1 text-sm py-2">
                                🗑️ Clear
                            </button>
                        </div>
                    )}

                    {!state.myReady && (
                        <button
                            onClick={handleReady}
                            disabled={!allPlaced}
                            className="btn-success w-full py-3 text-base sm:text-lg"
                        >
                            ✓ Ready
                        </button>
                    )}

                    {state.myReady && state.role === 'host' && (
                        <button
                            onClick={handleStartGame}
                            disabled={!state.allReady}
                            className="btn-primary w-full py-3 text-base sm:text-lg animate-pulse-glow"
                        >
                            {state.allReady ? '🚀 Start Game' : '⏳ Waiting for opponent...'}
                        </button>
                    )}

                    {state.myReady && state.role === 'joiner' && (
                        <div className="retro-banner text-center py-3 px-4 text-[#25343F]">
                            <span className="status-dot waiting mr-2"></span>
                            Waiting for host to start the game...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
