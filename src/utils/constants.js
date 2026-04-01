const rawSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

export const SOCKET_URL = rawSocketUrl || 'https://bingo-client-cyan.vercel.app';

export const PHASES = {
  LOBBY: 'lobby',
  SETUP: 'setup',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
};

export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const GRID_SIZE = 5;
export const TOTAL_NUMBERS = 25;
