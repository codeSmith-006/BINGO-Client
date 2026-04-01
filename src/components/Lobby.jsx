/**
 * Lobby — Host/Join screen for entering/creating game rooms.
 */
import { useState, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';

export default function Lobby({ emit }) {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const [joinRoomId, setJoinRoomId] = useState('');
    const [copied, setCopied] = useState(false);
    const [waiting, setWaiting] = useState(false);

    // Check URL for room ID (invite link)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get('room');
        if (roomFromUrl) {
            setJoinRoomId(roomFromUrl.toUpperCase());
        }
    }, []);

    const handleHostGame = () => {
        emit('createRoom', null, (response) => {
            if (response.error) {
                dispatch({ type: 'SET_ERROR', error: response.error });
                return;
            }
            dispatch({
                type: 'SET_ROOM',
                roomId: response.roomId,
                playerId: response.playerId,
                role: 'host',
            });
            if (response.roomState?.players) {
                dispatch({ type: 'SET_PLAYERS', players: response.roomState.players });
            }
            setWaiting(true);
        });
    };

    const handleJoinGame = () => {
        if (!joinRoomId.trim()) {
            dispatch({ type: 'SET_ERROR', error: 'Please enter a Room ID' });
            return;
        }

        emit('joinRoom', { roomId: joinRoomId.trim().toUpperCase() }, (response) => {
            if (response.error) {
                dispatch({ type: 'SET_ERROR', error: response.error });
                return;
            }
            dispatch({
                type: 'SET_ROOM',
                roomId: response.roomId,
                playerId: response.playerId,
                role: 'joiner',
            });
            if (response.roomState?.players) {
                dispatch({ type: 'SET_PLAYERS', players: response.roomState.players });
            }
        });
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}?room=${state.roomId}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-5">
            <div className="glass-card p-6 sm:p-9 max-w-lg w-[93%] animate-fade-in">
                {/* Title */}
                <div className="text-center mb-8 sm:mb-10">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-[0.12em] mb-2 text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        BINGO
                    </h1>
                    <p className="text-[#4A5A65] text-sm">
                        Real-time multiplayer • 2 Players
                    </p>
                </div>

                {/* Error message */}
                {state.error && (
                    <div className="mb-5 p-3 rounded-xl bg-[#FF9B51] text-[#25343F] text-sm text-center animate-fade-in border-2 border-[#25343F]">
                        {state.error}
                    </div>
                )}

                {/* Waiting for opponent (host has created room) */}
                {waiting && state.roomId && (
                    <div className="animate-slide-up">
                        <div className="text-center mb-5">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#BFC9D1] border-2 border-[#25343F] mb-4">
                                <span className="status-dot waiting"></span>
                                <span className="text-[#25343F] text-sm font-bold">Waiting for opponent...</span>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="block text-xs text-[#6F7F89] uppercase tracking-[0.2em] mb-2 text-center">
                                Room ID
                            </label>
                            <div className="text-center text-2xl sm:text-3xl font-black tracking-[0.3em] text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {state.roomId}
                            </div>
                        </div>

                        <button onClick={copyInviteLink} className="btn-secondary w-full flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            {copied ? '✓ Copied!' : 'Copy Invite Link'}
                        </button>
                    </div>
                )}

                {/* Initial lobby buttons */}
                {!waiting && (
                    <div className="space-y-5">
                        <button onClick={handleHostGame} className="btn-primary w-full text-base sm:text-lg py-3 sm:py-4 flex items-center justify-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            Host Game
                        </button>

                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 retro-divider"></div>
                            <span className="text-[#6F7F89] text-xs uppercase tracking-[0.2em]">or</span>
                            <div className="flex-1 retro-divider"></div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter Room ID"
                                value={joinRoomId}
                                onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && handleJoinGame()}
                                className="form-input"
                                maxLength={8}
                            />
                            <button onClick={handleJoinGame} className="btn-secondary w-full text-base sm:text-lg py-3 flex items-center justify-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                                Join Game
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
