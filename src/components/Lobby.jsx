/**
 * Lobby — Host/Join screen for entering/creating game rooms.
 */
import { useState, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../context/GameContext';
import {
    cardClass,
    dividerClass,
    iconClass,
    inputClass,
    instructionParagraphClass,
    modalCardClass,
    modalCloseClass,
    modalOverlayClass,
    primaryButtonClass,
    secondaryButtonClass,
    statusWaitingClass,
} from '../utils/uiClasses';

const instructions = {
    bn: {
        title: 'গেম খেলার নিয়ম',
        body: [
            'এইটা একটা ২ জনের অনলাইন Bingo গেম, যেখানে আপনি আপনার বন্ধুর সাথে রিয়েল-টাইমে খেলতে পারবেন। প্রথমে একজন "Host Game" করে একটি রুম তৈরি করবে, আর অন্যজন ইনভাইট লিংকের মাধ্যমে সেই রুমে জয়েন করবে।',
            'গেম শুরু হওয়ার আগে দুজনই নিজের মতো করে ৫×৫ গ্রিডে ১ থেকে ২৫ পর্যন্ত সংখ্যা বসাবেন। এখানে কোনো সিরিয়াল মেনে বসানোর দরকার নেই। আপনি যেভাবে চান সেভাবেই সাজাতে পারবেন। শুধু খেয়াল রাখতে হবে, একই সংখ্যা যেন একাধিকবার না থাকে। সব সেট করা হয়ে গেলে "Ready" বাটনে ক্লিক করুন। দুজনই Ready হলে Host গেম শুরু করবে।',
            'গেম শুরু হলে, যেকোনো একজন একটি নাম্বারে ক্লিক করলে সেটি সাথে সাথে দুইজনের বোর্ডেই mark হয়ে যাবে। এভাবে খেলতে খেলতে যদি আপনার বোর্ডে কোনো সম্পূর্ণ সোজা লাইন, অর্থাৎ একটি পুরো row বা একটি পুরো column, কাটা হয়ে যায়, তাহলে "BINGO" শব্দের একটি করে অক্ষর আনলক হবে।',
            'একটা গুরুত্বপূর্ণ বিষয়: এই গেমে diagonal বা কোণাকুণি লাইন ধরা হবে না। শুধু সোজা line, অর্থাৎ row বা column, হলেই সেটি গণনা করা হবে।',
            'যে খেলোয়াড় সবার আগে মোট ৫টি line সম্পূর্ণ করতে পারবে, মানে পুরো "BINGO" complete করবে, সেই হবে বিজয়ী। সবকিছুই রিয়েল-টাইমে আপডেট হবে, তাই দ্রুত আর স্মার্টভাবে খেলাটাই জেতার মূল কৌশল।',
        ],
        toggle: 'English',
    },
    en: {
        title: 'How To Play',
        body: [
            'This is a 2-player online Bingo game where you can play with your friend in real time. One player creates a room using "Host Game" and the other joins through the invite link.',
            'Before the game starts, both players arrange the numbers 1 to 25 on their own 5×5 grid. You do not need to follow any serial order. You can place the numbers however you like, but each number can appear only once. When your board is ready, click "Ready". Once both players are ready, the host starts the game.',
            'After the game starts, when a player clicks a number, it is immediately marked on both boards. As the game continues, whenever a complete straight line is marked on your board, meaning a full row or a full column, one letter of the word "BINGO" is unlocked.',
            'Important: diagonal lines are not counted in this game. Only straight lines, meaning rows or columns, are counted.',
            'The first player to complete 5 total lines, which means finishing the full word "BINGO", wins the game. Everything updates in real time, so quick and smart play is the key strategy.',
        ],
        toggle: 'বাংলা',
    },
};

export default function Lobby({ emit }) {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const [joinRoomId, setJoinRoomId] = useState('');
    const [copied, setCopied] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [instructionLanguage, setInstructionLanguage] = useState('bn');

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
            setTimeout(() => setCopied(false), 5000);
        });
    };

    const currentInstructions = instructions[instructionLanguage];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-5">
            <div className={`${cardClass} w-[93%] max-w-lg p-6 sm:p-9`}>
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
                    <div className="mb-5 rounded-xl border-2 border-[#25343F] bg-[#FF9B51] p-3 text-center text-sm text-[#25343F]">
                        {state.error}
                    </div>
                )}

                {/* Waiting for opponent (host has created room) */}
                {waiting && state.roomId && (
                    <div>
                        <div className="text-center mb-5">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#BFC9D1] border-2 border-[#25343F] mb-4">
                                <span className={statusWaitingClass}></span>
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

                        <button onClick={copyInviteLink} className={secondaryButtonClass}>
                            <i className={`fi ${copied ? 'fi-br-check' : 'fi-br-copy'} ${iconClass}`} aria-hidden="true"></i>
                            {copied ? 'Share this link to your friend!' : 'Copy Invite Link'}
                        </button>
                    </div>
                )}

                {/* Initial lobby buttons */}
                {!waiting && (
                    <div className="space-y-5">
                        <button onClick={handleHostGame} className={`${primaryButtonClass} text-base sm:text-lg`}>
                            <i className={`fi fi-br-plus ${iconClass}`} aria-hidden="true"></i>
                            Host Game
                        </button>

                        <div className="flex items-center gap-4 my-6">
                            <div className={`flex-1 ${dividerClass}`}></div>
                            <span className="text-[#6F7F89] text-xs uppercase tracking-[0.2em]">or</span>
                            <div className={`flex-1 ${dividerClass}`}></div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter Room ID"
                                value={joinRoomId}
                                onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && handleJoinGame()}
                                className={inputClass}
                                maxLength={8}
                            />
                            <button onClick={handleJoinGame} className={`${secondaryButtonClass} text-base sm:text-lg`}>
                                <i className={`fi fi-br-enter ${iconClass}`} aria-hidden="true"></i>
                                Join Game
                            </button>
                        </div>

                        <button
                            onClick={() => setShowInstructions(true)}
                            className={`${secondaryButtonClass} text-sm sm:text-base`}
                        >
                            <i className={`fi fi-br-book-open-cover ${iconClass}`} aria-hidden="true"></i>
                            How To Play
                        </button>
                    </div>
                )}
            </div>

            {showInstructions && (
                <div className={modalOverlayClass} onClick={() => setShowInstructions(false)}>
                    <div
                        className={modalCardClass}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <i className={`fi fi-br-book-open-cover ${iconClass} text-[1.4rem] sm:text-[1.6rem]`} aria-hidden="true"></i>
                                    <h2
                                        className="text-2xl sm:text-3xl font-black text-[#25343F]"
                                        style={{ fontFamily: 'Outfit, sans-serif' }}
                                    >
                                        {currentInstructions.title}
                                    </h2>
                                </div>
                                <p className="text-sm text-[#4A5A65] mt-1">
                                    Learn the rules before you start.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className={modalCloseClass}
                                aria-label="Close instructions"
                            >
                                <i className={`fi fi-br-cross-small ${iconClass}`} aria-hidden="true"></i>
                            </button>
                        </div>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setInstructionLanguage((lang) => (lang === 'bn' ? 'en' : 'bn'))}
                                className={`${secondaryButtonClass} w-auto px-4 py-2 text-sm`}
                            >
                                {currentInstructions.toggle}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4">
                            {currentInstructions.body.map((paragraph) => (
                                <p key={paragraph} className={instructionParagraphClass}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
