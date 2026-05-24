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
      'এইটা ২ বা ৩ জনের অনলাইন Bingo গেম। একজন Host Game করে রুম তৈরি করবে, এরপর বাকি খেলোয়াড়রা রুম আইডি বা ইনভাইট লিংক দিয়ে জয়েন করবে।',
      'গেম শুরুর আগে সবাই নিজের নাম সেট করবে এবং নিজের ৫×৫ বোর্ডে ১ থেকে ২৫ পর্যন্ত সংখ্যা সাজাবে। একই সংখ্যা একাধিকবার ব্যবহার করা যাবে না। সবাই Ready হলে host গেম শুরু করবে।',
      'গেম শুরু হওয়ার পর একজন যে নাম্বারে ক্লিক করবে, সেটা সাথে সাথে সব বোর্ডে mark হবে।',
      'প্রথম যে ৫টি line complete করবে সে ১ম হবে। ৩ জনের রুমে এরপর বাকি ২ জনের মধ্যে গেম চলবে ২য় স্থান ঠিক হওয়া পর্যন্ত।',
      'শুধু row আর column গণনা হবে। diagonal line ধরা হবে না।',
    ],
    toggle: 'English',
  },
  en: {
    title: 'How To Play',
    body: [
      'This is an online Bingo game for 2 or 3 players. One player hosts a room, and the others join with the room ID or invite link.',
      'Before the game starts, every player sets a name and arranges the numbers 1 to 25 on a 5×5 board with no duplicates. Once everyone is ready, the host starts the game.',
      'When any player clicks a number, that number is marked on every board in real time.',
      'The first player to complete 5 lines takes 1st place. In a 3-player room, the other two continue playing for 2nd place while the first player watches.',
      'Only rows and columns count as completed lines. Diagonals do not count.',
    ],
    toggle: 'বাংলা',
  },
};

export default function Lobby({ emit }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionLanguage, setInstructionLanguage] = useState('bn');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setJoinRoomId(roomFromUrl.toUpperCase());
    }
  }, []);

  const handleHostGame = () => {
    if (!hostName.trim()) {
      dispatch({ type: 'SET_ERROR', error: 'Enter your name before creating the room' });
      return;
    }

    emit('createRoom', { maxPlayers: playerCount, playerName: hostName }, (response) => {
      if (response?.error) {
        dispatch({ type: 'SET_ERROR', error: response.error });
        return;
      }

      dispatch({
        type: 'SET_ROOM',
        roomId: response.roomId,
        playerId: response.playerId,
        role: 'host',
        maxPlayers: response.roomState?.maxPlayers ?? playerCount,
      });

      if (response.roomState) {
        dispatch({ type: 'SYNC_ROOM_STATE', roomState: response.roomState });
      }
    });
  };

  const handleJoinGame = () => {
    if (!joinName.trim()) {
      dispatch({ type: 'SET_ERROR', error: 'Enter your name before joining the room' });
      return;
    }

    if (!joinRoomId.trim()) {
      dispatch({ type: 'SET_ERROR', error: 'Please enter a Room ID' });
      return;
    }

    emit('joinRoom', {
      roomId: joinRoomId.trim().toUpperCase(),
      playerName: joinName,
    }, (response) => {
      if (response?.error) {
        dispatch({ type: 'SET_ERROR', error: response.error });
        return;
      }

      dispatch({
        type: 'SET_ROOM',
        roomId: response.roomId,
        playerId: response.playerId,
        role: 'joiner',
        maxPlayers: response.roomState?.maxPlayers ?? 2,
      });

      if (response.roomState) {
        dispatch({ type: 'SYNC_ROOM_STATE', roomState: response.roomState });
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
  const joinedPlayers = state.players.length || (state.roomId ? 1 : 0);
  const roomIsOpen = Boolean(state.roomId && state.players.length > 0);
  const maxPlayersInRoom = state.maxPlayers || playerCount;
  const slotsRemaining = Math.max(maxPlayersInRoom - joinedPlayers, 0);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-5">
      <div className={`${cardClass} w-full max-w-lg p-4 sm:p-8`}>
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-6xl font-black tracking-[0.1em] mb-2 text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            BINGO
          </h1>
          <p className="text-[#4A5A65] text-xs sm:text-sm">
            Real-time multiplayer - 2 or 3 Players
          </p>
        </div>

        {state.reconnecting && (
          <div className="mb-4 rounded-xl border-2 border-[#25343F] bg-[#BFC9D1] p-3 text-center text-sm text-[#25343F]">
            Reconnecting to your room...
          </div>
        )}

        {state.error && (
          <div className="mb-4 rounded-xl border-2 border-[#25343F] bg-[#FF9B51] p-3 text-center text-sm text-[#25343F]">
            {state.error}
          </div>
        )}

        {roomIsOpen ? (
          <div>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#BFC9D1] border-2 border-[#25343F] mb-3">
                <span className={statusWaitingClass}></span>
                <span className="text-[#25343F] text-xs sm:text-sm font-bold">
                  {slotsRemaining > 0 ? `Waiting for ${slotsRemaining} more player${slotsRemaining > 1 ? 's' : ''}...` : 'Room is ready'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.7rem] text-[#6F7F89] uppercase tracking-[0.2em] mb-2 text-center">
                Room ID
              </label>
              <div className="text-center text-xl sm:text-3xl font-black tracking-[0.28em] text-[#25343F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {state.roomId}
              </div>
            </div>

            <div className="mb-4 rounded-xl border-2 border-[#25343F] bg-[#BFC9D1] p-3 text-center text-xs sm:text-sm text-[#25343F]">
              {joinedPlayers}/{maxPlayersInRoom} players joined
            </div>

            <button onClick={copyInviteLink} className={secondaryButtonClass}>
              <i className={`fi ${copied ? 'fi-br-check' : 'fi-br-copy'} ${iconClass}`} aria-hidden="true"></i>
              {copied ? 'Invite link copied' : 'Copy Invite Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerCount(count)}
                  className={`${secondaryButtonClass} py-3 text-sm ${playerCount === count ? 'bg-[#FF9B51]' : ''}`}
                >
                  {count} Players
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Your name"
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              className={`${inputClass} py-3 text-sm tracking-[0.06em]`}
              maxLength={18}
            />

            <button onClick={handleHostGame} className={`${primaryButtonClass} text-sm sm:text-lg`}>
              <i className={`fi fi-br-plus ${iconClass}`} aria-hidden="true"></i>
              Host Game for {playerCount}
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className={`flex-1 ${dividerClass}`}></div>
              <span className="text-[#6F7F89] text-[0.7rem] uppercase tracking-[0.2em]">or</span>
              <div className={`flex-1 ${dividerClass}`}></div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                className={`${inputClass} py-3 text-sm tracking-[0.06em]`}
                maxLength={18}
              />
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
                onKeyDown={(event) => event.key === 'Enter' && handleJoinGame()}
                className={`${inputClass} py-3 text-sm`}
                maxLength={8}
              />
              <button onClick={handleJoinGame} className={`${secondaryButtonClass} text-sm sm:text-lg`}>
                <i className={`fi fi-br-enter ${iconClass}`} aria-hidden="true"></i>
                Join Game
              </button>
            </div>

            <button
              onClick={() => setShowInstructions(true)}
              className={`${secondaryButtonClass} text-sm`}
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
                  <i className={`fi fi-br-book-open-cover ${iconClass} text-[1.2rem] sm:text-[1.6rem]`} aria-hidden="true"></i>
                  <h2
                    className="text-xl sm:text-3xl font-black text-[#25343F]"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {currentInstructions.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#4A5A65] mt-1">
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
