/**
 * GameOver — Final standings screen.
 */
import { useEffect, useState } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import { clearSession } from '../utils/storage';
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

function getOrdinal(rank) {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

export default function GameOver() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showConfetti, setShowConfetti] = useState(false);

  const myPlacement = state.placements.find((placement) => placement.playerId === state.playerId);
  const isWinner = myPlacement?.rank === 1;
  const sortedPlayers = [...state.players].sort((left, right) => {
    const leftPlacement = state.placements.find((entry) => entry.playerId === left.id)?.rank ?? 99;
    const rightPlacement = state.placements.find((entry) => entry.playerId === right.id)?.rank ?? 99;
    return leftPlacement - rightPlacement;
  });

  useEffect(() => {
    if (isWinner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isWinner]);

  const handlePlayAgain = () => {
    clearSession();
    dispatch({ type: 'RESET' });
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-5">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      <div className={`${cardClass} w-full max-w-2xl p-5 text-center sm:p-9`}>
        <div className="mb-6">
          {isWinner ? (
            <>
              <div className="mb-3 text-6xl sm:text-7xl motion-safe:animate-bounce">
                <i className={`fi fi-br-trophy ${iconClass} text-[4rem] sm:text-[4.25rem]`} aria-hidden="true"></i>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[#25343F]">YOU WIN!</span>
              </h2>
              <p className="text-sm sm:text-base text-[#4A5A65]">
                {state.winReason === 'player_disconnected'
                  ? 'You took 1st place after a disconnect ended the match.'
                  : 'You finished in 1st place.'}
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl sm:text-7xl mb-3">
                <i className={`fi fi-br-medal ${iconClass} text-[4rem] sm:text-[4.25rem]`} aria-hidden="true"></i>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[#25343F]">
                  {myPlacement ? `${getOrdinal(myPlacement.rank)} PLACE` : 'GAME OVER'}
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[#4A5A65]">
                {state.winReason === 'player_disconnected'
                  ? 'The match ended because a player did not reconnect in time.'
                  : 'Final standings are ready.'}
              </p>
            </>
          )}
        </div>

        <div className="grid gap-3 mb-8 sm:grid-cols-3">
          {sortedPlayers.map((player) => {
            const isMe = player.id === state.playerId;
            const placement = state.placements.find((entry) => entry.playerId === player.id)?.rank;
            const isWinnerCard = placement === 1;

            return (
              <div key={player.id} className={`rounded-xl border-2 p-4 ${isWinnerCard ? 'border-[#25343F] bg-[#FF9B51]' : 'border-[#25343F] bg-[#BFC9D1]'}`}>
                <div className="text-xs uppercase tracking-[0.15em] text-[#4A5A65]">
                  {placement ? getOrdinal(placement) : 'Standing'}
                </div>
                <div className="mt-1 text-sm font-bold text-[#25343F] truncate">
                  {isMe ? 'You' : player.name}
                </div>
                <div className="mt-2 text-3xl font-black text-[#25343F]">
                  {state.lineCount[player.id] || 0}
                </div>
                <div className="text-xs text-[#4A5A65] uppercase tracking-[0.15em]">Lines</div>
              </div>
            );
          })}
        </div>

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
