/**
 * GameOver — Winner/Loser announcement screen with celebrations.
 */
import { useEffect, useState } from 'react';
import { useGameState } from '../context/GameContext';
import { cardClass, iconClass, primaryButtonClass } from '../utils/uiClasses';

const CONFETTI_COLORS = ['#FF9B51', '#25343F', '#BFC9D1', '#EAEFEF'];

function ConfettiPiece({ index }) {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const duration = 2 + Math.random() * 3;
    const size = 6 + Math.random() * 10;

    return (
        <div
            className="fixed top-[-10px] z-[100] animate-bounce"
            style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`,
            }}
        />
    );
}

export default function GameOver() {
    const state = useGameState();
    const [showConfetti, setShowConfetti] = useState(false);

    const isWinner = state.winner === state.playerId;
    const isDcWin = state.winReason === 'opponent_disconnected';

    useEffect(() => {
        if (isWinner) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [isWinner]);

    const handlePlayAgain = () => {
        window.location.href = window.location.origin;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-5">
            {/* Confetti */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <ConfettiPiece key={i} index={i} />
                    ))}
                </div>
            )}

            <div className={`${cardClass} w-full max-w-lg p-6 text-center sm:p-9`}>
                {/* Trophy / Result */}
                <div className="mb-7">
                    {isWinner ? (
                        <>
                            <div className="mb-4 text-7xl motion-safe:animate-bounce">
                                <i className={`fi fi-br-trophy ${iconClass} text-[4.25rem]`} aria-hidden="true"></i>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <span className="text-[#25343F]">YOU WIN!</span>
                            </h2>
                            {isDcWin ? (
                                <p className="text-[#4A5A65]">Your opponent disconnected</p>
                            ) : (
                                <p className="text-[#4A5A65]">Congratulations! You got BINGO!</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-7xl mb-4">
                                <i className={`fi fi-br-sad ${iconClass} text-[4.25rem]`} aria-hidden="true"></i>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <span className="text-[#25343F]">
                                    YOU LOSE
                                </span>
                            </h2>
                            <p className="text-[#4A5A65]">Better luck next time!</p>
                        </>
                    )}
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-7 sm:gap-9 mb-8">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-[#25343F]">{state.myLines}</div>
                        <div className="text-xs text-[#6F7F89] uppercase tracking-[0.15em]">Your Lines</div>
                    </div>
                    <div className="w-px bg-[#25343F]/20"></div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-[#FF9B51]">{state.opponentLines}</div>
                        <div className="text-xs text-[#6F7F89] uppercase tracking-[0.15em]">Opponent Lines</div>
                    </div>
                </div>

                {/* Play Again */}
                <button onClick={handlePlayAgain} className={`${primaryButtonClass} py-3 text-base sm:py-4 sm:text-lg`}>
                    <span className="inline-flex items-center justify-center gap-2">
                        <i className={`fi fi-br-gamepad ${iconClass}`} aria-hidden="true"></i>
                        <span>Play Again</span>
                    </span>
                </button>
            </div>
        </div>
    );
}
